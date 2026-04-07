# JClaw 聊天系统 — 设计规格文档

**日期：** 2026-04-07
**状态：** 已确认

---

## 背景与目标

构建一个名为"JClaw"的 Web 端聊天界面，让用户与本地运行的 OpenClaw 实例（加载了自定义 skill）进行对话。UI 风格参考专业 AI 助手产品，包含项目维度的会话管理、会话历史、流式 AI 回复、思考过程展示和快捷操作入口。

布局右侧通过 iframe 内嵌另一个独立开发的业务 Web 系统。OpenClaw skill 返回结构化 JSON 后，聊天前端解析并通过 postMessage 指令控制 iframe 弹出预填表单，用户确认后提交，实现 AI 生成内容与业务系统的数据联动。

---

## 整体架构

```
浏览器（Vue 3 SPA, Vite）
  ↕ WebSocket  ws://127.0.0.1:18789
OpenClaw 网关（本地进程）
  ↕
Claude + 自定义 Skill
         ↓ 返回结构化 JSON
浏览器解析 JSON → postMessage → iframe（业务系统）
                                    ↕ 弹出预填表单
```

布局分为左右两栏：**左栏** = 聊天界面，**右栏** = iframe 业务系统。

---

## 技术选型

| 层级 | 选择 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 样式 | Tailwind CSS v3 |
| 图标 | lucide-vue-next |
| WebSocket | 原生 WebSocket API（封装为 composable） |

**Tailwind v3 配置注意：** 需在 `tailwind.config.js` 中配置：
```js
content: ['./index.html', './src/**/*.{vue,ts}']
```
并在 `postcss.config.js` 中注册 `tailwindcss` 和 `autoprefixer`。

---

## 目录结构

```
src/
├── components/
│   ├── layout/
│   │   ├── TopBar.vue           # 顶部项目切换标签栏（全部 / 项目A / B / C…）
│   │   ├── SidePanel.vue        # 左侧会话历史面板
│   │   ├── ChatArea.vue         # 左栏主聊天区域
│   │   └── BusinessPanel.vue    # 右栏 iframe 容器 + postMessage 桥接
│   ├── chat/
│   │   ├── MessageList.vue      # 可滚动消息流
│   │   ├── MessageBubble.vue    # 单条消息气泡（用户=右粉色，AI=左白色）
│   │   ├── ThinkingBlock.vue    # 可折叠"已完成思考"块
│   │   ├── ActionCard.vue       # AI 内联操作卡片（如"新增质量隐患排查"按钮）
│   │   └── InputBar.vue         # 底部输入栏
│   └── ui/
│       ├── QuickActions.vue     # 快捷功能按钮组
│       ├── FileUpload.vue       # 图片 & 附件上传
│       └── UsageBar.vue         # Token 用量显示条
├── composables/
│   ├── useWebSocket.ts          # WS 生命周期：连接、重连、发帧、接收事件
│   ├── useChat.ts               # 消息状态、send()、流式追加、历史拉取
│   ├── useProjects.ts           # 项目列表、当前项目、channelId 解析
│   ├── useIframeBridge.ts       # postMessage 双向通信
│   └── useUsage.ts              # Token 用量查询与实时监听
├── stores/
│   └── chat.ts                  # Pinia：sessions[]、messages[]、projects[]、activeProjectId、usage
├── config/
│   └── quickActions.ts          # 快捷按钮定义
├── App.vue
├── main.ts
└── env.d.ts
```

---

## OpenClaw WebSocket 通信协议

### 请求 / 响应帧格式

```jsonc
// 客户端 → 服务端（请求）
{ "type": "req", "id": "<uuid-v4>", "method": "chat.send", "params": { "message": "...", "channelId": "..." } }

// 服务端 → 客户端（直接回复）
{ "type": "res", "id": "<相同uuid>", "ok": true, "payload": {} }
// 出错时：
{ "type": "res", "id": "<相同uuid>", "ok": false, "error": { "code": "...", "message": "..." } }
```

### 服务端推送事件（流式）

```jsonc
{ "type": "event", "event": "thinking", "payload": { "text": "..." }, "seq": 1 }
{ "type": "event", "event": "chat",     "payload": { "delta": "..." }, "seq": 2 }
{ "type": "event", "event": "chat",     "payload": { "delta": "...", "done": true }, "seq": 3 }
{ "type": "event", "event": "agent",    "payload": { "status": "running" | "done" }, "seq": 4 }
```

### 关键规则

- **消息 ID：** 客户端使用 `crypto.randomUUID()` 生成，用于将 `res` 帧与对应的 `req` 帧关联
- **流式终止：** 最后一个 `chat` 事件携带 `payload.done = true`，客户端将消息标记为 `done` 并重新启用输入框
- **thinking 事件：** 在 `chat` 事件之前到达，缓冲至 `Message.thinking` 字段
- **agent 事件：** `status = "running"` 时更新顶部状态条（"JClaw 正在与业务界面交互中…"）
- **seq 字段：** 仅用于流内排序，出现缺口时记录日志并继续

### 鉴权与配置

- Token 来源：读取 `VITE_OPENCLAW_TOKEN` 环境变量；若缺失，启动时弹出配置弹窗
- WS 地址：读取 `VITE_OPENCLAW_WS_URL` 环境变量，默认 `ws://127.0.0.1:18789`

### 连接流程

```jsonc
// 1. 打开 WebSocket 连接
// 2. 立即发送连接帧
{ "type": "connect", "params": { "auth": { "token": "VITE_OPENCLAW_TOKEN" } } }
// 3. 服务端以 code 4001 关闭 → 鉴权失败，弹出配置弹窗，不重试
// 4. 服务端以 code 1006/1011 关闭 → 可恢复断连，按退避策略重试
```

### 历史记录请求 / 响应

```jsonc
// 请求
{ "type": "req", "id": "<uuid>", "method": "chat.history", "params": { "channelId": "..." } }
// 响应 payload
{ "messages": [ { "role": "user"|"assistant", "content": "...", "id": "...", "createdAt": "ISO8601" } ] }
```

### 文件上传

文件以 base64 编码内嵌在 `chat.send` 帧中：

```jsonc
{ "method": "chat.send", "params": { "message": "...", "channelId": "...",
  "attachments": [ { "name": "photo.jpg", "mimeType": "image/jpeg", "data": "<base64>" } ] } }
```

- 单文件最大 10 MB，发送前客户端校验
- 支持类型：图片（jpg、png、gif、webp）、PDF、纯文本

### channelId 与项目 / 会话的映射

- 每个 `Project` 有固定的 `channelId`（存储在 localStorage 的项目配置中）
- 每个 `Session` 用本地 `id` 标识，用于分组展示历史记录（UI 层过滤，不影响 WS 通信）

---

## 核心交互流程

### 1. 发送消息

1. 用户在 `InputBar` 输入并点击发送
2. `useChat.send(text)` 立即以乐观方式插入用户气泡（status = `sending`）
3. 发送 WebSocket 帧：`chat.send`，携带当前 `channelId`
4. 服务端流式推送 `chat` 事件 → 逐步追加至 AI 气泡
5. 若 `res` 帧返回 `ok: false`，消息状态变为 `error`，显示重试按钮

### 2. AI 思考展示

- `thinking` 事件缓冲至 `Message.thinking`
- 流结束后，若存在 thinking 内容，渲染 `ThinkingBlock`
- 标题显示"已完成思考 ▼"，点击展开详情，默认折叠

### 3. 项目切换

1. 用户点击 `TopBar` 中的项目标签
2. `useProjects.setActive(projectId)` 更新 Pinia store
3. `useChat.loadHistory(channelId)` 拉取新项目的历史记录
4. `SidePanel` 和 `MessageList` 联动刷新

### 4. 会话历史（左侧面板）

- 按时间分组：今天 / 本周 / 本月 / 按月归档
- 每条显示会话标题（首条消息截断）
- 悬停时显示删除按钮
- 点击加载该会话消息

### 5. 文件上传

- 点击附件图标 → 原生文件选择器
- 文件读取为 base64，超出 10 MB 显示 toast 错误并中止
- 以附件形式随下一条消息发送
- 消息气泡中显示图片缩略图或文件名

---

## UI 布局

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo] [全部][项目A][项目B][项目C]…                       [─][□][×]│  TopBar
├──────────┬──────────────────────────────┬───────────────────────────┤
│ [+]新建  │ [状态条: JClaw正在与业务界面交互中…]          │           │
│          │                              │                           │
│ 今天     │  ┌──────────────────────┐   │   ┌─────────────────────┐ │
│ • 会话1  │  │ 录入质量隐患排查…    │   │   │  *标题:             │ │
│ • 会话2  │  └──────────────────────┘   │   │  [请输入标题      ] │ │
│          │                              │   │                     │ │
│ 本周     │  [已完成思考 ▼]             │   │  *事故日期:         │ │
│ • 会话3  │  [项目标签] AI 回复内容…    │   │  [2024/08/01 📅]   │ │
│          │                              │   │                     │ │
│ 本月     │  [🔖 新增质量隐患排查]       │   │  *内容:             │ │
│ • 会话4  │                              │   │  [请输入内容      ] │ │
│          │                              │   │                     │ │
│          │                              │   │  所属分项工程:      │ │
│          │                              │   │  [单位/分部分项 ▼] │ │
│          │                              │   │                     │ │
│          ├──────────────────────────────┤   │      [取消] [保存]  │ │
│          │ [待办事项>][录入资料>][查询>]│   └─────────────────────┘ │
│          │ ┌────────────────────────────┤                           │
│[头像][⚙]│ │可以描述任务或提问任何问题  │                           │
│          │ └────────────────────────────┤                           │
│          │ [📷][📎]   [项目选择▼][🎤][➤]│                           │
└──────────┴──────────────────────────────┴───────────────────────────┘
           ←————————— 左栏（聊天）—————————→ ←—— 右栏（业务 iframe）——→
```

---

## 数据模型（Pinia Store）

```typescript
interface Project {
  id: string
  name: string        // "全部" | "XXX项目部A" | …
  channelId: string   // OpenClaw 频道 ID
}

interface Session {
  id: string
  projectId: string
  title: string       // 首条消息截断显示
  createdAt: Date
}

interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string   // 思考内容（若有）
  actionJson?: ActionPayload  // 解析出的 AI 操作指令
  status: 'sending' | 'streaming' | 'done' | 'error'
  createdAt: Date
}

interface ActionPayload {
  action: 'open_modal'
  modal: string
  data: Record<string, unknown>
  autoOpen: boolean
}

interface ChatStore {
  projects: Project[]
  activeProjectId: string
  sessions: Session[]
  activeSessionId: string
  messages: Message[]
  wsStatus: 'connecting' | 'connected' | 'disconnected'
  usage: UsageStats | null
}

interface UsageStats {
  inputTokens: number       // 本 session 累计输入 token
  outputTokens: number      // 本 session 累计输出 token
  totalCostUsd: number      // 本 session 累计费用（美元）
  contextUsedPct: number    // context 窗口使用百分比（0-100）
  lastUpdated: Date
}
```

---

## WebSocket Composable 接口

```typescript
// useWebSocket.ts
interface UseWebSocket {
  status: Ref<'connecting' | 'connected' | 'disconnected'>
  send(frame: object): void
  on(event: string, handler: (payload: unknown) => void): () => void
  connect(token: string): void
  disconnect(): void
}
```

---

## 流式状态管理

- `useChat` composable 持有流中间缓冲 `streamingContent: string`
- 收到 `chat` 事件时：将 `payload.delta` 追加至 `streamingContent`，同步更新 Pinia store 中的活跃消息
- 收到 `payload.done = true` 时：将 `streamingContent` 写入 `Message.content`，设置 `status = 'done'`，清空缓冲
- WS 重连发生在流中时：丢弃 `streamingContent`，将消息标记为 `error`
- 仅 `done` 状态的消息持久化至 localStorage

---

## 乐观消息插入

用户消息立即插入（status = `sending`）。若服务端 `res` 帧返回 `ok: false`，消息状态切换为 `error`，显示重试按钮，气泡始终保持可见。

---

## 快捷功能按钮

四个按钮向聊天框发送预设消息，定义在 `src/config/quickActions.ts`：

| 按钮 | 发送给 AI 的消息 |
|------|----------------|
| 待办事项 | `"显示我的待办事项"` |
| 录入资料 | `"我要录入资料"` |
| 查询记录 | `"查询记录"` |
| 汇总数据 | `"汇总数据"` |

---

## Token 用量显示

### 数据来源（WebSocket）

连接成功后，通过以下方式获取用量数据：

```jsonc
// 主动查询当前 session 用量
{ "type": "req", "id": "<uuid>", "method": "sessions.usage" }
// 响应 payload 示例
{
  "inputTokens": 12400,
  "outputTokens": 3200,
  "totalCostUsd": 0.018,
  "contextUsedPct": 34
}

// 查询健康 & 配额状态
{ "type": "req", "id": "<uuid>", "method": "health" }
// 响应包含 provider 配额剩余百分比

// 每次 AI 回复流结束（done: true）后自动轮询一次 sessions.usage，更新显示
```

服务端也会在握手 `hello-ok` 消息和 `heartbeat` 事件中携带基础状态，前端监听后直接更新 store。

### UI 展示位置

用量数据显示在**左侧面板底部头像旁**，紧凑展示：

```
[头像]  ↑12.4k  ↓3.2k  $0.018  ctx 34%  [⚙]
```

| 字段 | 说明 |
|------|------|
| `↑12.4k` | 本 session 输入 token 数（千为单位） |
| `↓3.2k` | 本 session 输出 token 数 |
| `$0.018` | 本 session 累计费用（美元） |
| `ctx 34%` | context 窗口使用率，超过 80% 变橙色警告 |

悬停时弹出 tooltip，显示完整数字和最后更新时间。

### `useUsage.ts` composable

```typescript
interface UseUsage {
  stats: Ref<UsageStats | null>
  refresh(): Promise<void>   // 主动拉取 sessions.usage
}
```

- 连接成功时立即 `refresh()` 一次
- 每次 AI 消息 `done` 后自动 `refresh()`
- 监听 `heartbeat` 事件中的用量字段，有变化时更新 store

### 验收标准补充

13. WS 连接成功后，底部显示 token 用量（inputTokens、outputTokens、费用、ctx 占比）
14. 每次 AI 回复结束后，用量数字自动刷新
15. ctx 使用率 > 80% 时，数字变橙色提示

---



### AI 返回的结构化 JSON

当 OpenClaw skill 需要触发业务操作时，回复消息中包含 JSON 块（前端提取，不直接展示给用户）：

```json
{
  "action": "open_modal",
  "modal": "quality_hazard_report",
  "data": {
    "title": "桥柱水泥被冲垮",
    "accidentDate": "2026-06-01",
    "content": "出现水管爆裂，1号桥柱水泥浇灌被冲垮",
    "subProject": "1号桥柱"
  },
  "autoOpen": true
}
```

### 两种触发模式

**模式一 — 自动弹窗（`autoOpen: true`）：**
- 流结束（`done: true`）后，前端检测到 JSON 中的 action
- 自动调用 `useIframeBridge.openModal(modal, data)`
- 右侧面板展示，状态条显示"JClaw 正在与业务界面交互中…"

**模式二 — 手动触发（操作卡片）：**
- AI 消息渲染 `ActionCard`，包含按钮（如"🔖 新增质量隐患排查"）
- 用户点击 → 调用 `useIframeBridge.openModal(modal, data)`

### postMessage 通信协议

```typescript
// JClaw → iframe（打开弹窗）
iframeRef.contentWindow.postMessage({
  type: 'JCLAW_OPEN_MODAL',
  modal: 'quality_hazard_report',
  data: { title, accidentDate, content, subProject }
}, VITE_BUSINESS_SYSTEM_ORIGIN)

// iframe → JClaw（用户已保存）
window.parent.postMessage({
  type: 'JCLAW_MODAL_SAVED',
  modal: 'quality_hazard_report',
  record: { id: '...', title: '...', createdAt: '...' }
}, '*')

// iframe → JClaw（用户已取消）
window.parent.postMessage({
  type: 'JCLAW_MODAL_CANCELLED',
  modal: 'quality_hazard_report'
}, '*')
```

### useIframeBridge.ts 接口

```typescript
interface UseIframeBridge {
  iframeRef: Ref<HTMLIFrameElement | null>
  openModal(modal: string, data: Record<string, unknown>): void
  onSaved(handler: (modal: string, record: unknown) => void): () => void
  onCancelled(handler: (modal: string) => void): () => void
}
```

### 保存后的状态更新

收到 `JCLAW_MODAL_SAVED` 后：
1. `ActionCard` 或 AI 消息更新为："✅ 提交质量隐患排查记录成功！"
2. 消息中追加记录链接卡片：`📋 2026-06-01 桥柱水泥被冲垮 [查看]`
3. 右侧状态条清除

### 安全

- `postMessage` 目标 origin 通过 `VITE_BUSINESS_SYSTEM_ORIGIN` 环境变量配置（如 `http://localhost:5174`）
- JClaw 仅监听来自 `VITE_BUSINESS_SYSTEM_ORIGIN` 的消息，其余忽略

---

## 错误处理

- **WS 断连（可恢复，code 1006/1011）：** 显示横幅"连接断开，正在重连…"，指数退避重试：1s → 2s → 4s → 8s → 16s → 30s（上限），最多重试 10 次，超出后显示"无法连接，请检查 OpenClaw 是否运行"
- **鉴权失败（code 4001）：** 不重试，弹出配置弹窗提示用户在 `.env.local` 中配置 token
- **消息发送失败（`ok: false`）：** 消息标记为 `error`，显示内联重试按钮
- **文件过大（> 10 MB）：** 发送前显示 toast 错误，不建立 WS 帧

---

## 一期范围外

- 多用户 / 远程访问
- 语音输入（UI 仅占位）
- 消息推送通知

---

## 验收标准

1. `npm run dev` → 应用在 localhost 正常打开，无控制台错误
2. OpenClaw 本地运行 → WebSocket 连接成功（状态指示器绿色）
3. 发送文字消息 → 用户气泡出现，AI 回复流式渲染
4. AI 含思考内容 → "已完成思考"块出现，点击可展开
5. 切换项目标签 → 消息列表清空，新项目历史加载
6. 左侧面板按时间分组展示会话，点击加载对应消息
7. 上传图片 → 消息气泡中显示缩略图
8. 底部四个快捷按钮可见并可点击
9. 断开 OpenClaw → 重连横幅出现并自动重试
13. WS 连接成功后，底部显示 token 用量（inputTokens、outputTokens、费用、ctx 占比）
14. 每次 AI 回复结束后，用量数字自动刷新
15. ctx 使用率 > 80% 时，数字变橙色提示
16. AI 返回含 `action: "open_modal"` 的 JSON → 右侧 iframe 弹窗并预填数据
11. 点击 ActionCard 中的"新增"按钮 → 右侧 iframe 弹窗
12. 用户在 iframe 中保存 → JClaw 接收 postMessage，消息状态更新并显示记录链接