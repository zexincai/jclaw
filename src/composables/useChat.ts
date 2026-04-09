/**
 * 模块级单例 — 与 useWebSocket 共享同一事件注册，避免重复监听
 */
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload, Attachment } from '../stores/chat'
import { useWebSocket } from './useWebSocket'

let initialized = false
let currentSessionKey = ''

function extractAction(content: string): ActionPayload | undefined {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return undefined
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.action === 'open_modal') return parsed as ActionPayload
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
    let streamingId: string | null = null
    let streamingContent = ''
    let streamingThinking = ''

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

      // sessionKey 过滤（多 session 时只处理当前 session）
      if (p.sessionKey && currentSessionKey && p.sessionKey !== currentSessionKey) return

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

        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) {
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

      // sessionKey 过滤
      if (p.sessionKey && currentSessionKey && p.sessionKey !== currentSessionKey) return

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

    const session = store.sessions.find(s => s.id === store.activeSessionId)
    if (session?.title === '新对话' && text) {
      session.title = text.slice(0, 20)
    }

    try {
      const wsAttachments = attachments.map(a => ({ name: a.name, mimeType: a.mimeType, data: a.data }))
      const res = await ws.request('chat.send', {
        sessionKey: currentSessionKey,
        message: text,
        deliver: false,
        idempotencyKey: crypto.randomUUID(),
        ...(wsAttachments.length ? { attachments: wsAttachments } : {}),
      }) as { ok: boolean }
      userMsg.status = res.ok ? 'done' : 'error'
      persistMessage(userMsg)
    } catch {
      userMsg.status = 'error'
      persistMessage(userMsg)
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
          return {
            id: m.id, sessionId, role: m.role as 'user' | 'assistant',
            content: stripThinkingTags(rawContent), status: 'done' as const, createdAt: m.createdAt,
          }
        })
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
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
