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
        payload?: {
          totals?: { input: number; output: number; totalCost: number }
          aggregates?: { messages?: { total: number } }
        }
      }
      if (res.ok && res.payload?.totals) {
        const t = res.payload.totals
        store.usage = {
          inputTokens: t.input,
          outputTokens: t.output,
          totalCostUsd: t.totalCost,
          totalMessages: res.payload.aggregates?.messages?.total ?? 0,
          lastUpdated: new Date().toISOString(),
        }
      }
    } catch { /* ignore */ }
    finally { loading.value = false }
  }

  if (!initialized) {
    initialized = true

    ws.on('heartbeat', (payload: unknown) => {
      const p = payload as Record<string, unknown>
      const input = p?.input ?? p?.inputTokens
      if (typeof input === 'number' && store.usage) {
        store.usage = {
          ...store.usage,
          inputTokens: input,
          outputTokens: (p?.output ?? p?.outputTokens ?? store.usage.outputTokens) as number,
          lastUpdated: new Date().toISOString(),
        }
      }
    })

    ws.on('connected', () => refresh())
  }

  return { refresh, loading }
}
