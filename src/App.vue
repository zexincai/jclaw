<template>
  <LoginView v-if="!auth.isLoggedIn.value" />
  <div v-else class="flex flex-col h-screen bg-gray-50 overflow-hidden">
    <!-- 标题栏 -->
    <div class="flex items-center h-10 bg-white border-b border-gray-200 px-3 gap-2 shrink-0">
      <div class="flex items-center gap-1.5">
        <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span class="text-white text-xs font-bold">J</span>
        </div>
        <span class="text-sm font-semibold text-gray-700">JClaw</span>
      </div>
      <button @click="chat.newSession()"
        class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        title="新对话">
        <Plus :size="14" />
      </button>
      <div class="flex-1" />
      <!-- WS 状态指示 -->
      <div :class="[
        'w-2 h-2 rounded-full shrink-0 transition-colors',
        store.wsStatus === 'connected' ? 'bg-green-500' :
          store.wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
      ]" :title="store.wsStatus === 'connected' ? '已连接' : store.wsStatus === 'connecting' ? '连接中' : '未连接'" />
    </div>

    <!-- 主内容区：项目栏 + 会话面板 + 聊天 + iframe -->
    <div class="flex flex-1 overflow-hidden min-h-0">
      <ProjectSwitcher />
      <SidePanel v-show="sidePanelOpen" class="w-56 shrink-0" />
      <button @click="sidePanelOpen = !sidePanelOpen"
        class="w-4 shrink-0 flex items-center justify-center bg-white border-r border-gray-200 hover:bg-gray-50 text-gray-300 hover:text-gray-500 transition-colors"
        :title="sidePanelOpen ? '收起侧栏' : '展开侧栏'">
        <ChevronsLeft v-if="sidePanelOpen" :size="12" />
        <ChevronsRight v-else :size="12" />
      </button>
      <ChatArea class="flex-1 min-w-0" />
      <button v-if="bridge.isVisible.value" @click="bridge.closePanel()"
        class="w-4 shrink-0 flex items-center justify-center bg-white border-l border-gray-200 hover:bg-gray-50 text-gray-300 hover:text-gray-500 transition-colors"
        title="收起面板">
        <ChevronsRight :size="12" />
      </button>
      <BusinessPanel v-show="bridge.isVisible.value" class="w-[860px] shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Plus, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import ProjectSwitcher from './components/layout/ProjectSwitcher.vue'
import SidePanel from './components/layout/SidePanel.vue'
import ChatArea from './components/layout/ChatArea.vue'
import BusinessPanel from './components/layout/BusinessPanel.vue'
import LoginView from './views/LoginView.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useUsage } from './composables/useUsage'
import { useProjects } from './composables/useProjects'
import { useChat } from './composables/useChat'
import { useIframeBridge } from './composables/useIframeBridge'
import { useAuth } from './composables/useAuth'
import { useChatStore } from './stores/chat'

const store = useChatStore()
const ws = useWebSocket()
const { refresh: refreshUsage } = useUsage()
const { init } = useProjects()
const chat = useChat()
const bridge = useIframeBridge()
const auth = useAuth()

const sidePanelOpen = ref(true)
watch(bridge.isVisible, v => {
  if (v) {
    sidePanelOpen.value = false
  } else {
    sidePanelOpen.value = true
  }
})

watch(ws.status, s => {
  store.wsStatus = s
  if (s === 'connected') store.wsMaxRetries = false
})

ws.on('connected', async () => {
  // 仅在页面首次加载（无活动会话）时恢复历史
  if (store.activeSessionId) return
  const project = store.activeProject()
  if (!project) return
  chat.newSession()
  await chat.loadHistory(project.channelId)
})

ws.on('auth-error', () => {
  alert('OpenClaw Token 无效，请在 .env.local 中配置 VITE_OPENCLAW_TOKEN')
})

ws.on('max-retries', () => {
  store.wsMaxRetries = true
  store.wsStatus = 'disconnected'
})

ws.on('chat', (p: unknown) => {
  if ((p as { state?: string }).state === 'final') refreshUsage()
})

function connectWS() {
  if (store.wsStatus !== 'disconnected') return
  init()
  const token = import.meta.env.VITE_OPENCLAW_TOKEN || auth.currentRole.value?.token
  const url = import.meta.env.VITE_OPENCLAW_WS_URL ?? 'ws://127.0.0.1:18789'
  if (token) {
    ws.connect(token, url)
  }
}

// 已登录（localStorage 恢复）时直接连接；登录事件触发时也连接
onMounted(() => {
  if (auth.isLoggedIn.value) connectWS()
})

watch(auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) connectWS()
})
</script>
