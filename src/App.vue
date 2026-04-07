<template>
  <div class="flex flex-col h-screen bg-gray-50 overflow-hidden">
    <TopBar />
    <div class="flex flex-1 overflow-hidden min-h-0">
      <SidePanel class="w-60 shrink-0" />
      <ChatArea class="w-[480px] shrink-0 border-r border-gray-200" />
      <BusinessPanel class="flex-1 min-w-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import TopBar from './components/layout/TopBar.vue'
import SidePanel from './components/layout/SidePanel.vue'
import ChatArea from './components/layout/ChatArea.vue'
import BusinessPanel from './components/layout/BusinessPanel.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useUsage } from './composables/useUsage'
import { useProjects } from './composables/useProjects'
import { useChatStore } from './stores/chat'

const store = useChatStore()
const ws = useWebSocket()
const { refresh: refreshUsage } = useUsage()
const { init } = useProjects()

// 同步 WS 状态到 store
watch(ws.status, s => {
  store.wsStatus = s
  if (s === 'connected') store.wsMaxRetries = false
})

ws.on('auth-error', () => {
  alert('OpenClaw Token 无效，请在 .env.local 中配置 VITE_OPENCLAW_TOKEN')
})

ws.on('max-retries', () => {
  store.wsMaxRetries = true
  store.wsStatus = 'disconnected'
})

// AI 流结束后刷新用量
ws.on('chat', (p: unknown) => {
  if ((p as { done?: boolean }).done) refreshUsage()
})

onMounted(() => {
  init()
  const token = import.meta.env.VITE_OPENCLAW_TOKEN
  const url = import.meta.env.VITE_OPENCLAW_WS_URL ?? 'ws://127.0.0.1:18789'
  if (token) {
    ws.connect(token, url)
  } else {
    alert('请在 .env.local 中配置 VITE_OPENCLAW_TOKEN，然后刷新页面')
  }
})
</script>
