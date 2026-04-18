# 录音转文字功能设计文档

**日期：** 2026-04-18
**状态：** 已确认

---

## 需求概述

用户录音结束后，通过阿里云智能语音交互（ISI）将音频转换为文字，再将文字发送给 AI。音频文件依然上传至存储并保存链接到后端，用于历史记录存档。

---

## 目标

- 录音结束 → 自动识别 → 将识别文字直接发送给 AI（无需用户二次确认）
- 后端仍保存音频 URL 至 `chatRecordFileList`，数据不丢失
- AI 接收到的是纯文字，不再是音频 URL markdown

---

## 架构设计

### 数据流

```
录音完成(File)
  │
  ├─[并行 A]─ uploadAudio(file) → audioUrl
  └─[并行 B]─ getAliyunToken() → { token, appkey }
                └─ 立即 transcribeAudio(file, token, appkey, format) → asrText
  │
  └─ 等待 A 和 B 都完成
       ├─ asrText 为空 → toast "未能识别语音内容"，终止
       └─ asrText 非空 → chat.send(asrText, [{ name, mimeType, data: audioUrl }])
  │
  └─ chat.send(text, attachments)
       ├─ addChatRecordData: chatContent=text + chatRecordFileList=[audioUrl]  (后端存档)
       └─ wkIM.sendText: sysBlock + text  (跳过音频 markdown，只发文字给 AI)
```

### 改动的文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/api/voice.ts` | 新建 | 封装 `getAliyunToken()` 和 `transcribeAudio()` |
| `src/components/chat/InputBar.vue` | 修改 | 改造 `handleVoiceFinish`，增加 ASR 流程和加载状态 |
| `src/composables/useChat.ts` | 修改 | `send()` 中 `audioMarkdown` 当 text 非空时置空 |

---

## 各模块详细设计

### 1. `src/api/voice.ts`（新建）

```ts
// 从后端获取阿里云 Token + Appkey
export async function getAliyunToken(): Promise<{ token: string; appkey: string }>

// 将音频 File 发送至阿里云 ASR，返回识别文字（可能为空字符串），失败时抛出 Error
export async function transcribeAudio(
  file: File,
  token: string,
  appkey: string,
  format: string
): Promise<string>
```

`transcribeAudio` 内部实现：
- URL: `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?appkey=<appkey>&format=<format>&sample_rate=16000&enable_punctuation_prediction=true`
- Headers: `Content-Type: application/octet-stream`, `X-NLS-Token: <token>`
- Body: `file`
- **超时 20s**：使用 `AbortController`，超时后抛出 `new Error('语音识别超时')`
- 响应: `status === 20000000` 时返回 `data.result`（可能为空）；否则抛出含 `data.message` 的错误

> **CORS：** 阿里云 NLS REST API 可从浏览器直接调用，但实际是否开放 CORS 取决于部署环境，**在第一次实现时须用 DevTools 验证**。若 CORS 受限，改由后端代理（`POST /eng/voice/transcribe` 转发请求），`transcribeAudio` 的调用方签名保持不变。

### 2. 音频格式处理

`VoiceRecorder.vue` 当前创建 File 时类型为 `audio/mp3` 或 `audio/webm`（纯字符串，无 codecs 后缀）。格式映射：

```ts
function getAsrFormat(mimeType: string): string {
  if (mimeType.includes('webm')) return 'opus'  // Chrome/Edge 录音容器是 webm/opus
  if (mimeType.includes('mp3'))  return 'mp3'
  if (mimeType.includes('wav'))  return 'wav'
  if (mimeType.includes('aac'))  return 'aac'
  if (mimeType.includes('ogg'))  return 'ogg'
  if (mimeType.includes('opus')) return 'opus'
  return 'mp3'  // fallback
}
```

> `audio/webm` 的实际编码是 opus；阿里云支持 format=`opus`，不支持 `webm`，因此 webm → opus。

### 3. `src/components/chat/InputBar.vue`

新增状态：
```ts
const isTranscribing = ref(false)
```

**模板分支结构**（三个互斥状态）：
```html
<div v-if="isRecording">
  <VoiceRecorder @cancel="isRecording = false" @finish="handleVoiceFinish" />
</div>
<div v-else-if="isTranscribing" class="flex items-center gap-3 px-4 h-[56px] ...">
  <!-- spinner + "正在识别语音..." -->
</div>
<div v-else>
  <!-- 原有输入框 -->
</div>
```

**`handleVoiceFinish` 完整逻辑**（伪代码）：

```ts
async function handleVoiceFinish(file: File) {
  if (isTranscribing.value) return  // 防重入
  isRecording.value = false
  isTranscribing.value = true
  toast.value = ''  // 清空上次错误

  // 最小录音大小（<1KB 视为空录音）
  if (file.size < 1024) {
    toast.value = '录音时间太短，请重试'
    isTranscribing.value = false
    return
  }

  try {
    const format = getAsrFormat(file.type)
    const [audioUrl, asrText] = await Promise.all([
      uploadAudio(file),
      getAliyunToken().then(({ token, appkey }) =>
        transcribeAudio(file, token, appkey, format)
      ),
    ])
    if (!asrText.trim()) {
      toast.value = '未能识别语音内容，请重试'
      return
    }
    await chat.send(asrText, [{
      name: file.name,
      mimeType: file.type,
      data: audioUrl,
    }])
  } catch (err) {
    toast.value = err instanceof Error ? err.message : '语音识别失败，请重试'
  } finally {
    isTranscribing.value = false
  }
}
```

> `uploadAudio` 继续从 `../../utils/upload` 引入，不迁移至 `voice.ts`。

### 4. `src/composables/useChat.ts`

修改 `send()` 内 `audioMarkdown` 赋值（位于 `send()` 函数的 attachments 处理块内）：

```ts
// 当 text 非空时，音频附件不拼入 WukongIM 消息（已通过 chatRecordFileList 存档）
// 注：此修改仅影响"有文字同时有音频附件"的场景，即语音转文字后的发送路径
const audioMarkdown = text
  ? ''
  : attachments
      .filter(a => a.mimeType.startsWith('audio/'))
      .map(a => `[🎵 语音消息，URL: ${a.data}](${a.data})`)
      .join('\n')
```

---

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 录音文件 < 1KB | toast "录音时间太短"，不请求网络 |
| 上传失败 | finally 重置 isTranscribing，toast 提示，不发送，不存档 |
| getAliyunToken 失败 | 同上 |
| CORS 被拦截 | 同上（后续改为后端代理） |
| ASR 返回非成功 status | 抛出错误，同上 |
| ASR 超时（>20s） | AbortController 中止，toast "语音识别超时" |
| ASR 返回空 result | toast "未能识别语音内容"，不调用 send()，audioUrl 丢弃 |
| chat.send() 抛出 | finally 重置 isTranscribing（UI 不卡死），toast 提示 |
| 重复触发（isTranscribing=true） | 函数开头 return，忽略 |

> **上传成功但 ASR 失败**：audioUrl 不存档（不调用 send()）。此为有意设计——仅完整完成识别的录音才入库，避免后端存入无法关联文字的孤立音频。

---

## 不涉及的内容

- `VoiceRecorder.vue` 无需改动
- 不做重试逻辑
- 不缓存 Token
- 不做客户端音频格式转码
