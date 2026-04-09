<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- 关闭按钮 -->
    <div class="flex items-center justify-end h-10 px-3 bg-white border-b border-gray-200 shrink-0">
      <button
        @click="bridge.closePanel()"
        class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="关闭"
      >
        <X :size="14" />
      </button>
    </div>
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
import { X } from 'lucide-vue-next'
import { useIframeBridge } from '../../composables/useIframeBridge'
import { useChatStore } from '../../stores/chat'

const bridge = useIframeBridge()
const store = useChatStore()
const businessUrl = (import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined) ?? ''

function onAutoOpen(e: Event) {
  const { modal, data } = (e as CustomEvent<{ modal: string; data: Record<string, unknown> }>).detail
  bridge.openModal(modal, data)
  store.agentRunning = true
}
onMounted(() => window.addEventListener('jclaw:open-modal', onAutoOpen))
onUnmounted(() => window.removeEventListener('jclaw:open-modal', onAutoOpen))

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
