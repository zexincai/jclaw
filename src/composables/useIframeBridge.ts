/**
 * 模块级单例 iframe 桥接 — iframeRef 在 BusinessPanel 中绑定，
 * 其他组件调用 openModal 时共享同一引用
 */
import { ref } from 'vue'
import { useChat } from './useChat'

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
    // if (ORIGIN && e.origin !== ORIGIN) return
    const data = e.data as { type?: string; modal?: string; record?: unknown; origin?: string; text?: string; message?: string }
    if (!data?.type) return
    if (data.origin === 'JWKJ') {
      if (data.type === 'INIT') {
        if (cachedToken) sendToken(cachedToken)
      } else if (data.type === 'JCLAW_MODAL_SAVED') {
        savedHandlers.forEach(h => h(data.modal!, data.record))
      } else if (data.type === 'JCLAW_MODAL_CANCELLED') {
        cancelledHandlers.forEach(h => h(data.modal!))
      } else if (data.type === 'SEND') {
        // 处理发送消息给 AI
        if (data.message) {
          const { send } = useChat()
          send(data.message)
        }
      }
    }

  })
}

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function openModal(modal: string, data: Record<string, unknown>) {
  console.log("fsfdssfdsfdsfdsfd", modal, data)
  attachListener()
  isVisible.value = true
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_OPEN_MODAL', modal, data, origin: 'JCLAW', access_token: cachedToken }),
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
    plain({ type: 'JCLAW_NAVIGATE', ...params, origin: 'JCLAW', access_token: cachedToken }),
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
// PC端：2,智能体-PC端：6，智能体-PC安装版：7
// 移动端（安卓：0，iOS：1,PC端：2,鸿蒙系统：3，智能体-安卓：4，智能体-iOS：5,智能体-PC端：6，智能体-PC安装版：7，智能体-鸿蒙系统：8
function dispatchAction(payload: unknown) {
  attachListener()
  isVisible.value = true
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_ACTION', ...(payload || {}), origin: "JCLAW", access_token: cachedToken, mobileType: 6 }),
    ORIGIN || '*'
  )
}

function sendToken(token: string) {
  if (!token) return
  cachedToken = token
  iframeRef.value?.contentWindow?.postMessage(
    plain({ type: 'JCLAW_SET_TOKEN', access_token: token, origin: 'JCLAW' }),
    ORIGIN || '*'
  )
}

export function useIframeBridge() {
  return { iframeRef, isVisible, openModal, closePanel, navigate, onSaved, onCancelled, dispatchAction, sendToken }
}
