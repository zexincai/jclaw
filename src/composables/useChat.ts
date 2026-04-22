/**
 * 聊天业务逻辑 — 使用悟空IM SDK 作为消息传输层
 */
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload, Attachment, PlatformAction, Session } from '../stores/chat'
import { useWukongIM } from './useWukongIM'
import { useAuth } from './useAuth'
import { useIframeBridge } from './useIframeBridge'
import { addChat, addChatRecordData, deleteAgent, getUserAccountChatList, chatRecordDataSearchPage } from '../api/agent'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

let initialized = false
let streamingId: string | null = null
let pendingSessionId: string | null = null
let currentChatId: number | null = null
let _store: ReturnType<typeof useChatStore> | null = null

interface IframeNavigateAction {
  isSkip: boolean
  operateType: number
  menuPath: string
  menuButtonCode: string
}

function parseJsonBlock(content: string): Record<string, unknown> | undefined {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return undefined
  try { return JSON.parse(match[1]) } catch { return undefined }
}

function extractAction(content: string): ActionPayload | undefined {
  const parsed = parseJsonBlock(content)
  return parsed?.action === 'open_modal' ? parsed as unknown as ActionPayload : undefined
}

function extractIframeAction(content: string): IframeNavigateAction | undefined {
  const parsed = parseJsonBlock(content)
  if (parsed && typeof parsed.isSkip === 'boolean' && parsed.menuPath) {
    return parsed as unknown as IframeNavigateAction
  }
  return undefined
}

function stripActionJson(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
}

function stripSystemBlock(content: string): string {
  return content.replace(/<system>[\s\S]*?<\/system>\n*/gi, '').trim()
}

function stripThinkingTags(text: string): string {
  return text
    .replace(/<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think(?:ing)?\s*>/gi, '')
    .trim()
}

function extractThinking(text: string): string {
  const match = text.match(/<\s*think(?:ing)?\s*>([\s\S]*?)<\s*\/\s*think(?:ing)?\s*>/i)
  return match ? match[1].trim() : ''
}

/** 平台检测 */
function detectPlatform(): 'pc' | 'app' | 'desk' {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__ELECTRON__) return 'desk'
  if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) return 'app'
  return 'pc'
}

/** 检测是否为360浏览器（其安全过滤器会剥离 HTML-like 标签） */
function is360Browser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /360SE|360EE|QIHU/i.test(navigator.userAgent)
}

/** 提取当前平台的 action 标签，支持 <pcAction> 和 [pcAction] 两种格式 */
function extractPlatformAction(content: string): PlatformAction | undefined {
  const tagMap = { pc: 'pcAction', app: 'appAction', desk: 'deskAction' }
  const platformTag = tagMap[detectPlatform()]
  // 优先当前平台，其次回退其他平台（兼容平台检测不准的情况）
  const tagsToTry = [platformTag, ...Object.values(tagMap).filter(t => t !== platformTag)]

  for (const tag of tagsToTry) {
    // 支持 <pcAction>...</pcAction> 和 [pcAction]...[/pcAction] 两种格式
    const patterns = [
      new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'),
      new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i'),
    ]
    for (const re of patterns) {
      const match = content.match(re)
      if (!match) continue
      try {
        const parsed = JSON.parse(match[1].trim())
        if (parsed.label) return { label: parsed.label, payload: parsed }
      } catch { /* ignore */ }
    }
  }
  return undefined
}

/** 剥离所有平台 action 标签（同时支持 <tag> 和 [tag] 两种格式） */
function stripAllActionTags(content: string): string {
  return content
    .replace(/<pcAction>[\s\S]*?<\/pcAction>/gi, '')
    .replace(/<appAction>[\s\S]*?<\/appAction>/gi, '')
    .replace(/<deskAction>[\s\S]*?<\/deskAction>/gi, '')
    .replace(/\[pcAction\][\s\S]*?\[\/pcAction\]/gi, '')
    .replace(/\[appAction\][\s\S]*?\[\/appAction\]/gi, '')
    .replace(/\[deskAction\][\s\S]*?\[\/deskAction\]/gi, '')
    .trim()
}

/** 从 WKSDK message 对象中提取文本 */
function extractText(message: unknown): string {
  if (!message || typeof message !== 'object') return ''
  const msg = message as { content?: unknown; text?: string }
  const content = msg.content as any
  if (content && typeof content.content === 'string') return content.content
  if (content && typeof content.text === 'string') return content.text
  if (typeof content === 'string') return content
  if (typeof msg.text === 'string') return msg.text
  return ''
}

function persistMessage(msg: Message) {
  if (msg.role === 'assistant' && !msg.content.trim() && !msg.thinking?.trim() && !msg.platformAction && !msg.actionJson) {
    return
  }
  const key = `jclaw_msgs_${msg.sessionId}`
  try {
    const existing: Message[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    const idx = existing.findIndex(m => m.id === msg.id)
    if (idx >= 0) existing[idx] = msg; else existing.push(msg)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch { /* ignore */ }
}

/** 处理收到的 AI 响应消息 */
function handleIncomingAIMessage(store: ReturnType<typeof useChatStore>, bridge: ReturnType<typeof useIframeBridge>, rawText: string) {
  const thinking = extractThinking(rawText)
  const text = stripThinkingTags(rawText)

  const msgId = streamingId || uuid()

  // 平台 Action 标签
  const platformAction = extractPlatformAction(text)
  // iframe 跳转指令
  const iframeAction = !platformAction ? extractIframeAction(text) : undefined
  // open_modal 指令
  const action = !platformAction && !iframeAction ? extractAction(text) : undefined

  const msg: Message = {
    id: msgId,
    sessionId: pendingSessionId ?? store.activeSessionId,
    role: 'assistant',
    content: platformAction
      ? stripAllActionTags(text)
      : (iframeAction || action)
        ? stripActionJson(text)
        : text,
    thinking: thinking || undefined,
    status: 'done',
    createdAt: new Date().toISOString(),
    ...(platformAction ? { platformAction } : {}),
    ...(action ? { actionJson: action } : {}),
  }

  // 替换占位消息或追加
  const existingIdx = store.messages.findIndex(m => m.id === streamingId)
  if (existingIdx >= 0) {
    store.messages[existingIdx] = msg
  } else {
    store.messages.push(msg)
  }
  persistMessage(msg)

  // 保存 AI 消息到后端
  if (text && currentChatId) {
    addChatRecordData({
      fkChatId: currentChatId,
      chatContent: text,
      chatObject: '1',
    }).catch(() => { })
  }

  // iframe 跳转
  if (iframeAction?.isSkip) {
    bridge.navigate({
      menuPath: iframeAction.menuPath,
      menuButtonCode: iframeAction.menuButtonCode,
      operateType: iframeAction.operateType,
    })
  }

  // open_modal 自动弹窗
  if (action?.autoOpen) {
    window.dispatchEvent(new CustomEvent('jclaw:open-modal', {
      detail: { modal: action.modal, data: action.data }
    }))
  }

  streamingId = null
  pendingSessionId = null
  if (_store) _store.aiReplying = false
}

export function useChat() {
  const store = useChatStore()
  _store = store
  const wkIM = useWukongIM()
  const auth = useAuth()

  // 只初始化一次全局消息监听
  if (!initialized) {
    initialized = true
    const bridge = useIframeBridge()

    // 监听来自悟空IM的消息
    wkIM.onMessage((rawMsg: unknown) => {
      const msg = rawMsg as { fromUID?: string; contentType?: number; content?: unknown }
      const currentUser = auth.currentRole.value
      if (!currentUser) return
      if (msg.fromUID === `${currentUser.userId}`) return
      if (msg.contentType !== 1 && msg.contentType !== 103) return

      const text = extractText(rawMsg)
      if (!text) return
      // msg.fromUID == 用户手机号码
      if (msg.fromUID === `${currentUser.telephone}`) {
        handleIncomingAIMessage(store, bridge, text)
      }
    })
  }

  function ensureSession() {
    if (!store.activeSessionId) newSession()
  }

  function newSession() {
    const project = store.activeProject()
    if (!project) return
    const session: Session = {
      id: uuid(),
      projectId: project.id,
      title: '新对话',
      createdAt: new Date().toISOString(),
    }
    store.sessions.unshift(session)
    store.activeSessionId = session.id
  }

  async function send(text: string, attachments: Attachment[] = []) {
    const project = store.activeProject()
    if (!project) return
    ensureSession()

    const userMsg: Message = {
      id: uuid(),
      sessionId: store.activeSessionId,
      role: 'user',
      content: text,
      attachments: attachments.length ? attachments : undefined,
      status: 'sending',
      createdAt: new Date().toISOString(),
    }
    store.messages.push(userMsg)
    persistMessage(userMsg)

    // 创建占位 AI 消息（等待响应）
    const placeholder: Message = {
      id: uuid(),
      sessionId: store.activeSessionId,
      role: 'assistant',
      content: '',
      thinking: ' ', // 触发 ThinkingBlock 动画
      status: 'streaming',
      createdAt: new Date().toISOString(),
    }
    store.messages.push(placeholder)
    streamingId = placeholder.id
    pendingSessionId = store.activeSessionId
    store.aiReplying = true

    const session = store.sessions.find(s => s.id === store.activeSessionId)
    const hasContent = text || attachments.length > 0
    if (session?.title === '新对话' && hasContent) {
      session.title = text ? text.slice(0, 20) : '语音消息'
    }

    // 确保后端会话存在
    if (session && !session.backendId && hasContent) {
      try {
        const title = text ? text.slice(0, 50) : '语音消息'
        const res = await addChat({ chatTitle: title })
        const pkId = (res as any).data
        if (pkId) session.backendId = pkId
      } catch { /* 接口失败时继续 */ }
    }
    currentChatId = session?.backendId ?? null

    // 构建系统上下文（token + 角色系统提示），对 IM 和后端接口共用
    const role = auth.currentRole.value
    // 360浏览器安全过滤会剥离 <pcAction> 标签，改用方括号格式
    const actionFormatHint = is360Browser() ? ' action-tag-format: bracket ' : ''
    const sysLines = [
      role?.userRolePrompt || '',
      ` operate-port: 2 ${actionFormatHint}`,
      auth.token.value ? `用户令牌：${auth.token.value}` : '',
    ].filter(Boolean).join('\n')
    const sysBlock = sysLines ? `<system>\n${sysLines}\n</system>\n\n` : ''

    // 保存用户消息到后端
    if (currentChatId && hasContent) {
      addChatRecordData({
        fkChatId: currentChatId,
        chatContent: sysBlock + (text || ''),
        chatObject: '0',
        ...(attachments.length ? {
          chatRecordFileList: attachments.map(a => {
            let fileType = 1
            if (a.mimeType.startsWith('image/')) fileType = 0
            else if (a.mimeType.startsWith('audio/')) fileType = 2
            return { fileName: a.name, fileType: String(fileType), fileUrl: a.data }
          })
        } : {}),
      }).catch(() => { })
    }

    try {
      // 构建发送文本（包含附件 markdown）
      let textToSend = text || ''
      if (attachments.length > 0) {
        const imageMarkdown = attachments
          .filter(a => a.mimeType.startsWith('image/'))
          .map(a => `![${a.name}](${a.data})`)
          .join('\n')
        // 当 text 非空时（即语音转文字路径），音频 URL 不发给 AI
        // 音频已通过 chatRecordFileList 存档到后端
        const audioMarkdown = text
          ? ''
          : attachments
              .filter(a => a.mimeType.startsWith('audio/'))
              .map(a => `[🎵 语音消息，URL: ${a.data}](${a.data})`)
              .join('\n')
        const fileMarkdown = attachments
          .filter(a => !a.mimeType.startsWith('image/') && !a.mimeType.startsWith('audio/'))
          .map(a => `[📄 文件: ${a.name}](${a.data})`)
          .join('\n')
        const mediaMarkdown = [imageMarkdown, audioMarkdown, fileMarkdown].filter(Boolean).join('\n')
        if (mediaMarkdown) textToSend = mediaMarkdown + (text ? '\n' + text : '')
      }

      // 通过悟空IM发送消息到 AI 频道
      wkIM.sendText(sysBlock + textToSend)
      userMsg.status = 'done'
      persistMessage(userMsg)
    } catch {
      userMsg.status = 'error'
      persistMessage(userMsg)
      // 移除占位消息
      store.messages = store.messages.filter(m => m.id !== streamingId)
      streamingId = null
      store.aiReplying = false
    }
  }

  async function loadSession(sessionId: string) {
    store.activeSessionId = sessionId
    const session = store.sessions.find(s => s.id === sessionId)
    if (!session?.backendId) return
    try {
      const res = await chatRecordDataSearchPage({ fkChatId: session.backendId, pageNum: 1, pageSize: 200 })
      const data = (res as any).data
      const records: any[] = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : [])
      const msgs: Message[] = records
        .map(r => {
          let attachments: Attachment[] | undefined
          if (r.chatRecordFileList?.length) {
            attachments = r.chatRecordFileList.map((file: any) => {
              const fileType = String(file.fileType)
              return {
                name: file.fileName || 'unknown',
                mimeType: fileType === '0' ? 'image/png' : (fileType === '2' ? 'audio/mp3' : 'application/octet-stream'),
                data: file.fileUrl || '',
                previewUrl: fileType === '0' ? file.fileUrl : undefined,
              }
            })
          }

          const rawContent = stripSystemBlock(r.chatContent || '')
          const isAssistant = String(r.chatObject) === '1'
          let platformAction: PlatformAction | undefined
          let cleanedContent = rawContent

          if (isAssistant) {
            platformAction = extractPlatformAction(rawContent)
            if (platformAction) {
              cleanedContent = stripAllActionTags(rawContent)
            } else {
              const iframeAction = extractIframeAction(rawContent)
              if (iframeAction) cleanedContent = stripActionJson(rawContent)
            }
          }

          return {
            id: String(r.pkId),
            sessionId,
            role: (String(r.chatObject) === '0' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: cleanedContent,
            status: 'done' as const,
            createdAt: r.createTime || new Date().toISOString(),
            ...(attachments ? { attachments } : {}),
            ...(platformAction ? { platformAction } : {}),
          }
        })
        .filter(m => m.content.trim() || m.attachments)
        .reverse()
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
    } catch { /* ignore */ }
  }

  async function deleteSession(sessionId: string) {
    const session = store.sessions.find(s => s.id === sessionId)
    if (session?.backendId) {
      try { await deleteAgent(String(session.backendId)) } catch { /* ignore */ }
    }
    store.sessions = store.sessions.filter(s => s.id !== sessionId)
    store.messages = store.messages.filter(m => m.sessionId !== sessionId)
    localStorage.removeItem(`jclaw_msgs_${sessionId}`)
    if (store.activeSessionId === sessionId) {
      store.activeSessionId = store.sessions[0]?.id ?? ''
    }
  }

  async function loadSessions() {
    try {
      const res = await getUserAccountChatList('')
      const data = (res as any).data
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      const project = store.activeProject()
      const projectId = project?.id ?? ''
      const mapped: Session[] = list.map((chat: any) => ({
        id: String(chat.pkId),
        projectId,
        title: chat.chatTitle || '对话',
        createdAt: chat.createTime || new Date().toISOString(),
        backendId: chat.pkId,
      }))
      store.sessions = mapped
      if (!mapped.find(s => s.id === store.activeSessionId)) {
        store.activeSessionId = mapped[0]?.id ?? ''
      }
    } catch { /* ignore */ }
  }

  function resetState() {
    streamingId = null
    pendingSessionId = null
    currentChatId = null
  }

  return { send, newSession, loadSession, deleteSession, loadSessions, resetState }
}
