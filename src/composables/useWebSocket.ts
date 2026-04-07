/**
 * 模块级单例 WebSocket —— 整个应用共享一个连接实例
 * 所有组件调用 useWebSocket() 返回同一个对象
 */
import { ref } from 'vue'

type WsStatus = 'connecting' | 'connected' | 'disconnected'
type EventHandler = (payload: unknown) => void

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]
const MAX_RETRIES = 10

// ── 模块级单例状态 ──────────────────────────────────────────────
const status = ref<WsStatus>('disconnected')
let ws: WebSocket | null = null
let retryCount = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
let shouldReconnect = true
let savedToken = ''
let savedUrl = ''
const handlers = new Map<string, Set<EventHandler>>()
const pendingRequests = new Map<string, (res: unknown) => void>()
// ────────────────────────────────────────────────────────────────

function on(event: string, handler: EventHandler) {
  if (!handlers.has(event)) handlers.set(event, new Set())
  handlers.get(event)!.add(handler)
  return () => handlers.get(event)?.delete(handler)
}

function emit(event: string, payload: unknown) {
  handlers.get(event)?.forEach(h => h(payload))
}

function send(frame: object) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(frame))
  }
}

function request(method: string, params: object = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    pendingRequests.set(id, resolve)
    send({ type: 'req', id, method, params })
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id)
        reject(new Error(`Request timeout: ${method}`))
      }
    }, 15000)
  })
}

function connect(token: string, url: string) {
  savedToken = token
  savedUrl = url
  shouldReconnect = true
  if (ws) { ws.onclose = null; ws.close() }
  status.value = 'connecting'

  ws = new WebSocket(url)

  // onopen 不发 connect —— 等服务端先发 connect.challenge
  ws.onopen = () => { /* 等待 connect.challenge */ }

  ws.onmessage = (e) => {
    let frame: Record<string, unknown>
    try { frame = JSON.parse(e.data) } catch { return }

    if (frame.type === 'res') {
      const id = frame.id as string
      const resolve = pendingRequests.get(id)
      if (resolve) { resolve(frame); pendingRequests.delete(id) }
      return
    }

    if (frame.type === 'event') {
      const ev = frame.event as string

      // 服务端发出挑战 → 用 nonce + token 响应
      if (ev === 'connect.challenge') {
        const { nonce } = (frame.payload ?? {}) as { nonce?: string }
        send({
          type: 'req',
          id: crypto.randomUUID(),
          method: 'connect',
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: 'jclaw-web', version: '1.0.0', platform: 'web', mode: 'client' },
            role: 'client',
            scopes: [],
            auth: { token },
            ...(nonce ? { device: { nonce } } : {}),
          },
        })
        return
      }

      if (ev === 'hello-ok' || ev === 'connect-ok') {
        status.value = 'connected'
        retryCount = 0
        emit('connected', frame.payload)
      } else {
        emit(ev, frame.payload)
      }
    }
  }

  ws.onclose = (e) => {
    status.value = 'disconnected'
    ws = null
    if (e.code === 4001) { emit('auth-error', { code: e.code }); return }
    if (shouldReconnect && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]
      emit('reconnecting', { attempt: retryCount + 1 })
      retryTimer = setTimeout(() => connect(savedToken, savedUrl), delay)
      retryCount++
    } else if (retryCount >= MAX_RETRIES) {
      emit('max-retries', {})
    }
  }

  ws.onerror = () => { /* onclose handles retry */ }
}

function disconnect() {
  shouldReconnect = false
  if (retryTimer) clearTimeout(retryTimer)
  ws?.close()
}

/** 返回模块级单例，全局共享同一 WS 连接 */
export function useWebSocket() {
  return { status, send, request, on, connect, disconnect }
}
