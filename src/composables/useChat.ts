/**
 * 模块级单例 — 与 useWebSocket 共享同一事件注册，避免重复监听
 */
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload, Attachment } from '../stores/chat'
import { useWebSocket } from './useWebSocket'

let initialized = false

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

    ws.on('thinking', (payload: unknown) => {
      const p = payload as { text: string }
      streamingThinking += p.text
      if (streamingId) {
        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) msg.thinking = streamingThinking
      }
    })

    ws.on('chat', (payload: unknown) => {
      const p = payload as { delta?: string; done?: boolean }

      if (!streamingId) {
        const msg: Message = {
          id: crypto.randomUUID(),
          sessionId: store.activeSessionId,
          role: 'assistant',
          content: '',
          thinking: streamingThinking || undefined,
          status: 'streaming',
          createdAt: new Date().toISOString(),
        }
        store.messages.push(msg)
        streamingId = msg.id
      }

      if (p.delta) {
        streamingContent += p.delta
        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) msg.content = streamingContent
      }

      if (p.done) {
        const msg = store.messages.find(m => m.id === streamingId)
        if (msg) {
          const action = extractAction(streamingContent)
          msg.actionJson = action
          msg.content = action ? stripActionJson(streamingContent) : streamingContent
          msg.thinking = streamingThinking || undefined
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
      }
    })

    ws.on('agent', (payload: unknown) => {
      const p = payload as { status: string }
      store.agentRunning = p.status === 'running'
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
        message: text,
        channelId: project.channelId,
        ...(wsAttachments.length ? { attachments: wsAttachments } : {}),
      }) as { ok: boolean }
      userMsg.status = res.ok ? 'done' : 'error'
      persistMessage(userMsg)
    } catch {
      userMsg.status = 'error'
      persistMessage(userMsg)
    }
  }

  async function loadHistory(channelId: string) {
    try {
      const res = await ws.request('chat.history', { channelId }) as {
        ok: boolean
        payload?: { messages: Array<{ role: string; content: string; id: string; createdAt: string }> }
      }
      if (!res.ok || !res.payload?.messages) return
      const sessionId = store.activeSessionId
      const msgs: Message[] = res.payload.messages.map(m => ({
        id: m.id, sessionId, role: m.role as 'user' | 'assistant',
        content: m.content, status: 'done' as const, createdAt: m.createdAt,
      }))
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
