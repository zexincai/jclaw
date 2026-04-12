/**
 * 模块级单例 iframe 桥接 — iframeRef 在 BusinessPanel 中绑定，
 * 其他组件调用 openModal 时共享同一引用
 */
import { ref } from 'vue'

type SavedHandler = (modal: string, record: unknown) => void
type CancelledHandler = (modal: string) => void

const ORIGIN = (import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined) ?? ''

// 模块级单例
const iframeRef = ref<HTMLIFrameElement | null>(null)
const isVisible = ref(false)
const savedHandlers = new Set<SavedHandler>()
const cancelledHandlers = new Set<CancelledHandler>()
let listenerAttached = false
let cachedToken = ''

function attachListener() {
  if (listenerAttached) return
  listenerAttached = true
  window.addEventListener('message', (e: MessageEvent) => {
    console.log('hahahahah:', e.data)
    if (ORIGIN && e.origin !== ORIGIN) return
    const data = e.data as { type?: string; modal?: string; record?: unknown }
    if (!data?.type) return
    if (data.type === 'INIT') {
      if (cachedToken) sendToken(cachedToken)
    } else if (data.type === 'JCLAW_MODAL_SAVED') {
      savedHandlers.forEach(h => h(data.modal!, data.record))
    } else if (data.type === 'JCLAW_MODAL_CANCELLED') {
      cancelledHandlers.forEach(h => h(data.modal!))
    }
  })
}

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function openModal(modal: string, data: Record<string, unknown>) {
  attachListener()
  isVisible.value = true
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_OPEN_MODAL', modal, data }),
    ORIGIN || '*'
  )
}

function closePanel() {
  isVisible.value = false
  // 如果左边的收起状态 则展开
}

function navigate(params: { menuPath: string; menuButtonCode: string; operateType: number }) {
  attachListener()
  isVisible.value = true
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_NAVIGATE', ...params }),
    ORIGIN || '*'
  )
}

function onSaved(handler: SavedHandler) {
  attachListener()
  savedHandlers.add(handler)
  return () => savedHandlers.delete(handler)
}

function onCancelled(handler: CancelledHandler) {
  cancelledHandlers.add(handler)
  return () => cancelledHandlers.delete(handler)
}

function dispatchAction(payload: unknown) {
  attachListener()
  isVisible.value = true
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_ACTION', payload }),
    ORIGIN || '*'
  )
}

function sendToken(token: string) {
  if (!token) return
  cachedToken = token
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_SET_TOKEN', access_token: token }),
    ORIGIN || '*'
  )
}

export function useIframeBridge() {
  return { iframeRef, isVisible, openModal, closePanel, navigate, onSaved, onCancelled, dispatchAction, sendToken }
}
