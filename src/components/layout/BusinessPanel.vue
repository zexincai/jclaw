<template>
  <div class="flex flex-col h-full bg-gray-50">
    <iframe
      :ref="(el) => { bridge.iframeRef.value = el as HTMLIFrameElement | null }"
      :src="businessUrl"
      class="flex-1 w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useIframeBridge } from '../../composables/useIframeBridge'
import { useChatStore } from '../../stores/chat'

const bridge = useIframeBridge()
const store = useChatStore()
const businessUrl = (import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined) ?? ''

// 接收 autoOpen 全局事件（由 useChat 在 AI 流结束后派发）
function onAutoOpen(e: Event) {
  const { modal, data } = (e as CustomEvent<{ modal: string; data: Record<string, unknown> }>).detail
  bridge.openModal(modal, data)
  store.agentRunning = true
}
onMounted(() => window.addEventListener('jclaw:open-modal', onAutoOpen))
onUnmounted(() => window.removeEventListener('jclaw:open-modal', onAutoOpen))

// 业务系统保存后更新 AI 消息
bridge.onSaved((modal, record) => {
  const r = record as { title?: string; id?: string; createdAt?: string }
  const msg = [...store.messages].reverse().find(m => m.actionJson?.modal === modal)
  if (msg) {
    const date = r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
    msg.content += `\n\n✅ 提交成功！\n📋 ${date} ${r.title ?? modal} [查看]`
  }
  store.agentRunning = false
})

bridge.onCancelled(() => {
  store.agentRunning = false
})
</script>
