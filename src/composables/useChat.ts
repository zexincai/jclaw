/**
 * 模块级单例 — 与 useWebSocket 共享同一事件注册，避免重复监听
 */
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload, Attachment, PlatformAction, Session } from '../stores/chat'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import { useIframeBridge } from './useIframeBridge'
import { addChat, addChatRecordData, deleteAgent, getUserAccountChatList, chatRecordDataSearchPage } from '../api/agent'

let initialized = false
let currentSessionKey = ''
let streamingId: string | null = null
let streamingContent = ''
let streamingThinking = ''
let currentChatId: number | null = null  // 当前会话的后端 fkChatId

interface IframeNavigateAction {
  isSkip: boolean
  operateType: number
  menuPath: string
  menuButtonCode: string
}

function extractAction(content: string): ActionPayload | undefined {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return undefined
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.action === 'open_modal') return parsed as ActionPayload
  } catch { /* ignore */ }
  return undefined
}

function extractIframeAction(content: string): IframeNavigateAction | undefined {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return undefined
  try {
    const parsed = JSON.parse(match[1])
    if (typeof parsed.isSkip === 'boolean' && parsed.menuPath) {
      return parsed as IframeNavigateAction
    }
  } catch { /* ignore */ }
  return undefined
}

function stripActionJson(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
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

/** Vite 构建时加载 src/skills/*.md 原始内容 */
// const skillModules = import.meta.glob('../skills/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
// const SKILLS_CONTENT = Object.values(skillModules).join('\n\n---\n\n')

/** 将 roleToken + systemPrompt + skills 拼接为 <system> 内容块，前缀在消息体最前面。
 *  AI（Claude）对 <system> 标签有原生理解，会将其内容作为系统级指令处理。 */
function buildMessageWithCtx(text: string, token?: string, prompt?: string): string {
  if (!token && !prompt) return text
  const lines = [
    prompt || '',
    token ? `用户令牌：${token}` : '',
    // SKILLS_CONTENT ? `\n<skills>\n${SKILLS_CONTENT}\n</skills>` : '',
  ].filter(Boolean).join('\n')
  return `<system>\n${lines}\n</system>\n\n${text}`
}

/** 平台检测 */
function detectPlatform(): 'pc' | 'app' | 'desk' {
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__ELECTRON__) return 'desk'
  if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) return 'app'
  return 'pc'
}

/** 提取当前平台的 action 标签，格式：<pcAction>{"label":"查看",...}</pcAction> */
function extractPlatformAction(content: string): PlatformAction | undefined {
  const tagMap = { pc: 'pcAction', app: 'appAction', desk: 'deskAction' }
  const tag = tagMap[detectPlatform()]
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = content.match(re)
  if (!match) return undefined
  try {
    const parsed = JSON.parse(match[1].trim())
    if (parsed.label) return { label: parsed.label, payload: parsed }
  } catch { /* ignore */ }
  return undefined
}

/** 剥离所有平台 action 标签 */
function stripAllActionTags(content: string): string {
  return content
    .replace(/<pcAction>[\s\S]*?<\/pcAction>/gi, '')
    .replace(/<appAction>[\s\S]*?<\/appAction>/gi, '')
    .replace(/<deskAction>[\s\S]*?<\/deskAction>/gi, '')
    .trim()
}

/** 从 OpenClaw message 对象中提取纯文本（content 可能是 string 或 block 数组） */
function extractText(message: unknown): string {
  if (!message || typeof message !== 'object') return ''
  const msg = message as { content?: unknown; text?: string }
  if (typeof msg.content === 'string') return msg.content
  if (Array.isArray(msg.content)) {
    return (msg.content as Array<{ type?: string; text?: string }>)
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join('')
  }
  if (typeof msg.text === 'string') return msg.text
  return ''
}

function persistMessage(msg: Message) {
  // 过滤掉空的助手消息，防止产生空白历史记录
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

export function useChat() {
  const store = useChatStore()
  const ws = useWebSocket()

  // 只注册一次全局事件监听
  if (!initialized) {
    initialized = true
    const bridge = useIframeBridge()

    // 从 hello-ok 握手响应中获取 sessionKey
    ws.on('connected', (payload: unknown) => {
      const p = payload as { sessionKey?: string }
      if (p.sessionKey) currentSessionKey = p.sessionKey
    })

    // chat 事件：新格式 state = 'delta' | 'final' | 'aborted' | 'error'
    ws.on('chat', (payload: unknown) => {
      const p = payload as {
        state?: string
        sessionKey?: string
        message?: unknown
        runId?: string
        errorMessage?: string
      }

      // sessionKey 过滤（兼容 "ch_001" 与 "agent:main:ch_001" 两种格式）
      if (p.sessionKey && currentSessionKey) {
        const match = p.sessionKey === currentSessionKey
          || p.sessionKey.endsWith(':' + currentSessionKey)
          || currentSessionKey.endsWith(':' + p.sessionKey)
        if (!match) return
        // 同步为服务端返回的完整 key，后续严格匹配
        currentSessionKey = p.sessionKey
      }

      if (p.state === 'delta') {
        const rawText = extractText(p.message)
        if (!rawText) return
        const thinking = extractThinking(rawText)
        const text = stripThinkingTags(rawText)

        if (!streamingId) {
          // 优先寻找现有的空占位消息进行复用，防止重复气泡
          const activeMsgs = store.activeSessionMessages()
          const lastMsg = activeMsgs[activeMsgs.length - 1]
          if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
            streamingId = lastMsg.id
            lastMsg.status = 'streaming'
          } else {
            const msg: Message = {
              id: crypto.randomUUID(),
              sessionId: store.activeSessionId,
              role: 'assistant',
              content: '',
              thinking: thinking || undefined,
              status: 'streaming',
              createdAt: new Date().toISOString(),
            }
            store.messages.push(msg)
            streamingId = msg.id
          }
        }

        // delta 内容是累积全文，直接替换而非追加
        if (text.length >= streamingContent.length) {
          streamingContent = text
          streamingThinking = thinking
          const msg = store.messages.find(m => m.id === streamingId)
          if (msg) {
            msg.content = streamingContent
            msg.thinking = streamingThinking || undefined
          }
        }
        return
      }

      if (p.state === 'final') {
        const rawText = extractText(p.message) || streamingContent
        const thinking = extractThinking(rawText) || streamingThinking
        const text = stripThinkingTags(rawText) || streamingContent

        // 内容为空说明占位消息没有被填充，直接移除（除非有思考过程或指令）
        if (!text && !thinking && !extractPlatformAction(text) && !extractAction(text)) {
          store.messages = store.messages.filter(m => m.id !== streamingId)
          streamingId = null; streamingContent = ''; streamingThinking = ''
          return
        }

        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) {
          // 1. 平台 Action 标签（<pcAction> / <appAction> / <deskAction>）
          const platformAction = extractPlatformAction(text)
          if (platformAction) {
            msg.content = stripAllActionTags(text)
            msg.thinking = thinking || undefined
            msg.platformAction = platformAction
            msg.status = 'done'
            persistMessage(msg)
          } else {
            // 2. iframe 跳转指令
            const iframeAction = extractIframeAction(text)
            if (iframeAction) {
              msg.content = stripActionJson(text)
              msg.thinking = thinking || undefined
              msg.status = 'done'
              persistMessage(msg)
              if (iframeAction.isSkip) {
                bridge.navigate({
                  menuPath: iframeAction.menuPath,
                  menuButtonCode: iframeAction.menuButtonCode,
                  operateType: iframeAction.operateType,
                })
              }
            } else {
              // 3. open_modal 指令
              const action = extractAction(text)
              msg.actionJson = action
              msg.content = action ? stripActionJson(text) : text
              msg.thinking = thinking || undefined
              msg.status = 'done'
              persistMessage(msg)
              if (action?.autoOpen) {
                window.dispatchEvent(new CustomEvent('jclaw:open-modal', {
                  detail: { modal: action.modal, data: action.data }
                }))
              }
            }
          }
        }
        // 保存 AI 消息到后端
        if (text && currentChatId) {
          addChatRecordData({
            fkChatId: currentChatId,
            chatContent: text,
            chatObject: '1',
          }).catch(() => { })
        }

        streamingId = null
        streamingContent = ''
        streamingThinking = ''
        return
      }

      if (p.state === 'aborted' || p.state === 'error') {
        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) {
          msg.status = 'error'
          if (streamingContent) msg.content = streamingContent
          persistMessage(msg)
        }
        streamingId = null
        streamingContent = ''
        streamingThinking = ''
      }
    })

    // agent 事件：新格式 stream = 'lifecycle' | 'assistant' | 'tool'
    ws.on('agent', (payload: unknown) => {
      const p = payload as {
        stream?: string
        sessionKey?: string
        runId?: string
        data?: { phase?: string; text?: string }
      }

      // sessionKey 过滤（兼容短格式/长格式）
      if (p.sessionKey && currentSessionKey) {
        const match = p.sessionKey === currentSessionKey
          || p.sessionKey.endsWith(':' + currentSessionKey)
          || currentSessionKey.endsWith(':' + p.sessionKey)
        if (!match) return
      }

      if (p.stream === 'lifecycle') {
        store.agentRunning = p.data?.phase === 'start'
      } else if (p.stream === 'assistant') {
        // assistant stream 提供累积文本，比 chat.delta 更实时
        const rawText = p.data?.text || ''
        if (rawText) {
          const thinking = extractThinking(rawText)
          const text = stripThinkingTags(rawText)
          if (text.length > streamingContent.length) {
            streamingContent = text
            streamingThinking = thinking
            if (streamingId) {
              const msg = store.messages.find(m => m.id === streamingId)
              if (msg) {
                msg.content = text
                msg.thinking = thinking || undefined
              }
            } else {
              // 优先寻找现有的空占位消息进行复用
              const activeMsgs = store.activeSessionMessages()
              const lastMsg = activeMsgs[activeMsgs.length - 1]
              if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
                streamingId = lastMsg.id
                lastMsg.content = text
                lastMsg.thinking = thinking || undefined
                lastMsg.status = 'streaming'
              } else {
                const msg: Message = {
                  id: crypto.randomUUID(),
                  sessionId: store.activeSessionId,
                  role: 'assistant',
                  content: text,
                  thinking: thinking || undefined,
                  status: 'streaming',
                  createdAt: new Date().toISOString(),
                }
                store.messages.push(msg)
                streamingId = msg.id
              }
            }
          }
        }
      }
    })

    ws.on('reconnecting', () => {
      if (streamingId) {
        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) msg.status = 'error'
        streamingId = null; streamingContent = ''; streamingThinking = ''
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      sessionId: store.activeSessionId,
      role: 'user',
      content: text,
      attachments: attachments.length ? attachments : undefined,
      status: 'sending',
      createdAt: new Date().toISOString(),
    }
    store.messages.push(userMsg)
    persistMessage(userMsg)

    // 立即创建占位 AI 消息，让"思考中"动画马上出现
    const placeholder: Message = {
      id: crypto.randomUUID(),
      sessionId: store.activeSessionId,
      role: 'assistant',
      content: '',
      thinking: ' ', // 非空以触发 ThinkingBlock 流式动画
      status: 'streaming',
      createdAt: new Date().toISOString(),
    }
    store.messages.push(placeholder)
    streamingId = placeholder.id
    streamingContent = ''
    streamingThinking = ''

    const session = store.sessions.find(s => s.id === store.activeSessionId)
    const hasContent = text || attachments.length > 0
    if (session?.title === '新对话' && hasContent) {
      session.title = text ? text.slice(0, 20) : '语音消息'
    }

    // 确保后端会话存在（首次发消息时创建）
    if (session && !session.backendId && hasContent) {
      try {
        const title = text ? text.slice(0, 50) : '语音消息'
        const res = await addChat({ chatTitle: title })
        const pkId = (res as any).data
        if (pkId) session.backendId = pkId
      } catch { /* 接口失败时继续本地发送 */ }
    }
    // 固定当次发送的 fkChatId，WS 事件回调直接使用，避免异步查找错误
    currentChatId = session?.backendId ?? null

    // 保存用户消息到后端（不依赖 ws.request 结果，先行记录）
    if (currentChatId && hasContent) {
      addChatRecordData({
        fkChatId: currentChatId,
        chatContent: text || '',
        chatObject: '0',
        ...(attachments.length ? {
          chatRecordFileList: attachments.map(a => {
            // 根据 mimeType 判断文件类型：0-图片，1-文件，2-音频
            let fileType = 1 // 默认为文件
            if (a.mimeType.startsWith('image/')) {
              fileType = 0
            } else if (a.mimeType.startsWith('audio/')) {
              fileType = 2
            }

            return {
              fileName: a.name,
              fileType: String(fileType),
              fileUrl: a.data // data 字段现在存储的是上传后的真实 URL
            }
          })
        } : {}),
      }).catch(() => { })
    }

    try {
      const auth = useAuth()
      const roleToken = auth.token.value
      const systemPrompt = auth.currentRole.value?.userRolePrompt

      // 将图片、音频及其他文件（如 PDF）URL 以 markdown 格式插入到发送给 AI 的文本中
      let textWithImages = text || ''
      if (attachments.length > 0) {
        console.log('Processing attachments...', attachments)
        const imageMarkdown = attachments
          .filter(a => a.mimeType.startsWith('image/'))
          .map(a => `![${a.name}](${a.data})\n[🖼️ 图片: ${a.name}](${a.data})`)
          .join('\n')

        const audioMarkdown = attachments
          .filter(a => a.mimeType.startsWith('audio/'))
          .map(a => `[🎵 语音消息，URL: ${a.data}](${a.data})`)
          .join('\n')

        const fileMarkdown = attachments
          .filter(a => !a.mimeType.startsWith('image/') && !a.mimeType.startsWith('audio/'))
          .map(a => `[📄 文件: ${a.name}](${a.data})`)
          .join('\n')

        const mediaMarkdown = [imageMarkdown, audioMarkdown, fileMarkdown].filter(Boolean).join('\n')
        if (mediaMarkdown) {
          textWithImages = mediaMarkdown + (text ? '\n' + text : '')
        }
      }

      const messageWithCtx = buildMessageWithCtx(textWithImages, roleToken, systemPrompt)
      const wsAttachments = attachments.map(a => ({ name: a.name, mimeType: a.mimeType, data: a.data }))
      // 同步 currentSessionKey，确保 chat 事件过滤器能接受服务端响应
      const chatSessionKey = project.channelId || currentSessionKey
      currentSessionKey = chatSessionKey
      const res = await ws.request('chat.send', {
        sessionKey: chatSessionKey,
        message: messageWithCtx,
        deliver: false,
        idempotencyKey: crypto.randomUUID(),
        ...(wsAttachments.length ? { attachments: wsAttachments } : {}),
      }) as { ok: boolean }
      userMsg.status = res.ok ? 'done' : 'error'
      persistMessage(userMsg)
    } catch {
      userMsg.status = 'error'
      persistMessage(userMsg)
      // 移除无效占位消息
      store.messages = store.messages.filter(m => m.id !== streamingId)
      streamingId = null
      streamingContent = ''
      streamingThinking = ''
    }
  }

  /**
 * 加载指定会话的聊天历史记录
 * @param {string} [sessionKey] - 会话键，如果不提供则使用当前会话键
 * @returns {Promise<void>} 无返回值
 * @throws {Error} WebSocket 请求失败时抛出异常（内部已忽略）
 */
  // async function loadHistory(sessionKey?: string) {
  //   const key = sessionKey || currentSessionKey
  //   if (!key) return
  //   try {
  //     const res = await ws.request('chat.history', { sessionKey: key, limit: 200 }) as {
  //       ok: boolean
  //       payload?: { messages: Array<{ role: string; content: unknown; id: string; createdAt: string }> }
  //     }
  //     if (!res.ok || !res.payload?.messages) return
  //     const sessionId = store.activeSessionId
  //     const msgs: Message[] = res.payload.messages
  //       .filter(m => m.role === 'user' || m.role === 'assistant')
  //       .map(m => {
  //         const rawContent = extractText(m)
  //         const platformAction = m.role === 'assistant' ? extractPlatformAction(rawContent) : undefined
  //         const cleaned = stripHiddenTags(stripThinkingTags(rawContent))
  //         return {
  //           id: m.id, sessionId, role: m.role as 'user' | 'assistant',
  //           content: cleaned, status: 'done' as const, createdAt: m.createdAt,
  //           ...(platformAction ? { platformAction } : {}),
  //         }
  //       })
  //     store.messages = store.messages.filter(m => m.sessionId !== sessionId)
  //       .concat(msgs.filter(m => m.content.trim() !== '' || m.platformAction))
  //     if (msgs.length > 0) {
  //       const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
  //       if (lastUserMsg) {
  //         const session = store.sessions.find(s => s.id === sessionId)
  //         if (session && session.title === '新对话') session.title = lastUserMsg.content.slice(0, 20)
  //       }
  //     }
  //   } catch { /* ignore */ }
  // }

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
          // 转换后端的 chatRecordFileList 为前端的 attachments 格式
          let attachments: Attachment[] | undefined
          if (r.chatRecordFileList && Array.isArray(r.chatRecordFileList) && r.chatRecordFileList.length > 0) {
            attachments = r.chatRecordFileList.map((file: any) => {
              // fileType 可能是数字或字符串，统一转换为字符串比较
              const fileType = String(file.fileType)
              return {
                name: file.fileName || 'unknown',
                mimeType: fileType === '0' ? 'image/png' : (fileType === '2' ? 'audio/mp3' : 'application/octet-stream'),
                data: file.fileUrl || '',
                previewUrl: fileType === '0' ? file.fileUrl : undefined,
              }
            })
          }

          return {
            id: String(r.pkId),
            sessionId,
            role: (String(r.chatObject) === '0' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: r.chatContent || '',
            status: 'done' as const,
            createdAt: r.createTime || new Date().toISOString(),
            ...(attachments ? { attachments } : {}),
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
      // 当前 activeSessionId 不在新会话列表中时重置（含空列表情况）
      if (!mapped.find(s => s.id === store.activeSessionId)) {
        store.activeSessionId = mapped[0]?.id ?? ''
      }
    } catch { /* ignore */ }
  }

  return { send, newSession, loadSession, deleteSession, loadSessions }
}
