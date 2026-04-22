<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Agent 运行状态条（仅 iframe 打开时显示） -->
    <div v-if="bridge.isVisible.value"
      class="relative flex items-center py-2.5 px-4 bg-blue-50/80 border-b border-blue-100/50 backdrop-blur-sm">
      <span class="flex-1 text-xs font-medium text-center text-blue-600">JClaw 正在与业务界面交互中…</span>
      <button @click="bridge.closePanel()"
        class="absolute flex items-center justify-center w-5 h-5 text-blue-400 transition-colors rounded right-2 hover:text-blue-600 hover:bg-blue-100"
        title="收起面板">
        <X :size="22" />
      </button>
    </div>
    <iframe :ref="(el) => { bridge.iframeRef.value = el as HTMLIFrameElement | null }" :src="businessUrl"
      class="flex-1 w-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      @load="onIframeLoad" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useIframeBridge } from '../../composables/useIframeBridge'
import { useChatStore } from '../../stores/chat'
import { useAuth } from '../../composables/useAuth'

const bridge = useIframeBridge()
const store = useChatStore()
const auth = useAuth()
const businessUrl = (import.meta.env.VITE_IFRAME_URL as string | undefined)
  || (import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined)
  || ''

// 当 token 发生变化时，如果 iframe 已加载，则同步同步过去
watch(auth.token, (newToken) => {
  if (newToken) {
    bridge.sendToken(newToken)
  }
}, { immediate: true })

// iframe 加载完成后的回调：确保 token 已送达
function onIframeLoad() {
  if (auth.token.value) {
    bridge.sendToken(auth.token.value)
  }
}

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
