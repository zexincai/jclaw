/**
 * 模块级单例 — 与 useWebSocket 共享同一事件注册，避免重复监听
 */
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload, Attachment, PlatformAction } from '../stores/chat'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import { useIframeBridge } from './useIframeBridge'

let initialized = false
let currentSessionKey = ''
let streamingId: string | null = null
let streamingContent = ''
let streamingThinking = ''

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
const skillModules = import.meta.glob('../skills/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const SKILLS_CONTENT = Object.values(skillModules).join('\n\n---\n\n')

/** 将 roleToken + systemPrompt + skills 拼接为 <system> 内容块，前缀在消息体最前面。
 *  AI（Claude）对 <system> 标签有原生理解，会将其内容作为系统级指令处理。 */
function buildMessageWithCtx(text: string, token?: string, prompt?: string): string {
  if (!token && !prompt) return text
  const lines = [
    prompt || '',
    token ? `用户令牌：${token}` : '',
    SKILLS_CONTENT ? `\n<skills>\n${SKILLS_CONTENT}\n</skills>` : '',
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

/** 剥离所有隐藏标签及平台 action 标签，用于历史消息清洗 */
function stripHiddenTags(content: string): string {
  return content
    .replace(/<system\s*>[\s\S]*?<\/system\s*>\s*/gi, '')   // <system> 块
    .replace(/<jclaw-ctx[^>]*>[\s\S]*?<\/jclaw-ctx>\s*/gi, '') // 旧格式兼容
    .replace(/<jclaw-ctx[^/]*\/>\s*/gi, '')                    // 自闭合旧格式
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

        // 内容为空说明占位消息没有被填充（内容由其他流完成），直接移除
        if (!text) {
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
    const session = {
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
    if (session?.title === '新对话' && text) {
      session.title = text.slice(0, 20)
    }

    try {
      const auth = useAuth()
      const roleToken = auth.currentRole.value?.token
      const systemPrompt = auth.currentRole.value?.systemPrompt
      const messageWithCtx = buildMessageWithCtx(text, roleToken, systemPrompt)
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

  async function loadHistory(sessionKey?: string) {
    const key = sessionKey || currentSessionKey
    if (!key) return
    try {
      const res = await ws.request('chat.history', { sessionKey: key, limit: 200 }) as {
        ok: boolean
        payload?: { messages: Array<{ role: string; content: unknown; id: string; createdAt: string }> }
      }
      if (!res.ok || !res.payload?.messages) return
      const sessionId = store.activeSessionId
      const msgs: Message[] = res.payload.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => {
          const rawContent = extractText(m)
          const platformAction = m.role === 'assistant' ? extractPlatformAction(rawContent) : undefined
          const cleaned = stripHiddenTags(stripThinkingTags(rawContent))
          return {
            id: m.id, sessionId, role: m.role as 'user' | 'assistant',
            content: cleaned, status: 'done' as const, createdAt: m.createdAt,
            ...(platformAction ? { platformAction } : {}),
          }
        })
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
      if (msgs.length > 0) {
        const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
        if (lastUserMsg) {
          const session = store.sessions.find(s => s.id === sessionId)
          if (session && session.title === '新对话') session.title = lastUserMsg.content.slice(0, 20)
        }
      }
    } catch { /* ignore */ }
  }

  function loadSession(sessionId: string) {
    store.activeSessionId = sessionId
    const key = `jclaw_msgs_${sessionId}`
    try {
      const msgs: Message[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
    } catch { /* ignore */ }
  }

  function deleteSession(sessionId: string) {
    store.sessions = store.sessions.filter(s => s.id !== sessionId)
    store.messages = store.messages.filter(m => m.sessionId !== sessionId)
    localStorage.removeItem(`jclaw_msgs_${sessionId}`)
    if (store.activeSessionId === sessionId) {
      store.activeSessionId = store.sessions[0]?.id ?? ''
    }
  }

  return { send, loadHistory, newSession, loadSession, deleteSession }
}
