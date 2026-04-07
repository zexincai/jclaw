import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import { useWebSocket } from './useWebSocket'

let initialized = false
const loading = ref(false)

export function useUsage() {
  const store = useChatStore()
  const ws = useWebSocket()

  async function refresh() {
    if (loading.value || ws.status.value !== 'connected') return
    loading.value = true
    try {
      const res = await ws.request('sessions.usage', {}) as {
        ok: boolean
        payload?: { inputTokens: number; outputTokens: number; totalCostUsd: number; contextUsedPct: number }
      }
      if (res.ok && res.payload) {
        store.usage = { ...res.payload, lastUpdated: new Date().toISOString() }
      }
    } catch { /* ignore */ }
    finally { loading.value = false }
  }

  if (!initialized) {
    initialized = true

    ws.on('heartbeat', (payload: unknown) => {
      const p = payload as Record<string, unknown>
      if (typeof p?.inputTokens === 'number' && store.usage) {
        store.usage = {
          ...store.usage,
          inputTokens: p.inputTokens as number,
          outputTokens: (p.outputTokens as number) ?? store.usage.outputTokens,
          lastUpdated: new Date().toISOString(),
        }
      }
    })

    ws.on('connected', () => refresh())
  }

  return { refresh, loading }
}
