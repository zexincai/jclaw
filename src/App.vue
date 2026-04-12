<template>
  <LoginView v-if="!auth.isLoggedIn.value" />
  <div v-else class="flex flex-col h-screen bg-gray-50 overflow-hidden">
    <!-- 标题栏 -->
    <div class="flex items-center h-10 bg-white border-b border-gray-200 px-3 gap-2 shrink-0">
      <div class="flex items-center gap-1.5">
        <img :src="logoUrl" class="w-8 h-8 rounded-full object-cover" />
        <span class="text-sm font-semibold text-gray-700">JClaw</span>
      </div>
      <button @click="chat.newSession()"
        class="ml-40 w-7 h-7 flex items-center justify-center text-green-600 border border-gray-200 hover:border-green-500 hover:bg-green-50 rounded transition-colors"
        title="新对话">
        <Plus :size="16" />
      </button>
      <div class="flex-1" />
      <!-- iframe 通信测试按钮 -->
      <button @click="testIframe"
        class="px-2.5 py-1 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-mono"
        title="测试 iframe 通信">测试通信</button>
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
        class="w-4 shrink-0 flex items-center justify-center bg-gray-50 border-r border-gray-200 hover:bg-gray-50 text-gray-00 hover:text-gray-500 transition-colors"
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
      <BusinessPanel v-show="bridge.isVisible.value" class="w-[1260px] shrink-0" />
    </div>

    <!-- 配对引导弹窗 -->
    <div v-if="pairingModalVisible" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="pairingModalVisible = false" />

      <!-- 弹窗主体 -->
      <div
        class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="px-6 py-8 flex flex-col items-center text-center">
          <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <Link2 class="text-red-500" :size="32" />
          </div>

          <h3 class="text-lg font-bold text-gray-900 mb-2">需要设备配对</h3>
          <p class="text-sm text-gray-500 leading-relaxed mb-8">
            当前设备尚未与 JClaw 环境成功配对。请前往管理页面完成验证，以便正常使用智能能力。
          </p>

          <div class="flex flex-col w-full gap-3">
            <button @click="goToPairing"
              class="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-200 active:scale-[0.98]">
              立即去配对
            </button>
            <button @click="pairingModalVisible = false"
              class="w-full py-3 px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
              稍后再说
            </button>
          </div>
        </div>

        <!-- 装饰底部 -->
        <div class="h-1.5 bg-gradient-to-r from-red-400 via-red-600 to-red-400" />
      </div>
    </div>

    <!-- 实名认证弹窗 (强制显示) -->
    <RealNameAuthModal v-if="auth.needsCertification.value" :telephone="auth.currentRole.value?.telephone || ''"
      @success="onAuthSuccess" />

    <!-- 切换角色加载中 -->
    <GlobalLoading :visible="store.switchingRole" message="加载中" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import logoUrl from './assets/logo.jpg'
import { Plus, ChevronsLeft, ChevronsRight, Link2 } from 'lucide-vue-next'
import ProjectSwitcher from './components/layout/ProjectSwitcher.vue'
import SidePanel from './components/layout/SidePanel.vue'
import ChatArea from './components/layout/ChatArea.vue'
import BusinessPanel from './components/layout/BusinessPanel.vue'
import RealNameAuthModal from './components/modals/RealNameAuthModal.vue'
import GlobalLoading from './components/GlobalLoading.vue'
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
const pairingModalVisible = ref(false)

function onAuthSuccess() {
  auth.updateCertificationStatus(true)
}

watch(bridge.isVisible, v => {
  if (v) {
    sidePanelOpen.value = false
  } else {
    sidePanelOpen.value = true
  }
})

watch(ws.status, s => {
  store.wsStatus = s
  if (s === 'connected') {
    store.wsMaxRetries = false
    pairingModalVisible.value = false
  }
})

ws.on('connected', async () => {
  // 仅在页面首次加载（无活动会话）时恢复历史
  if (store.activeSessionId) return
  const project = store.activeProject()
  if (!project) return
  // 先从后端加载会话列表，无会话时再新建
  await chat.loadSessions()
  if (!store.activeSessionId) {
    chat.newSession()
  } else {
    await chat.loadSession(store.activeSessionId)
  }
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

ws.on('not-paired', () => {
  pairingModalVisible.value = true
})

function testIframe() {
  const testMsg = { type: 'JCLAW_SET_TOKEN', access_token: '7c42142c-170f-484a-aa4e-bed5a1944341', timestamp: Date.now(), message: 'hello from JClaw' }
  const iframe = bridge.iframeRef.value
  if (!iframe?.contentWindow) {
    // alert('iframe 未加载，无法测试通信')
    return
  }
  const origin = (import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined) || '*'
  iframe.contentWindow.postMessage(testMsg, origin)
  bridge.isVisible.value = true
  // alert(`已发送测试消息：\n${JSON.stringify(testMsg, null, 2)}\n\n请在 iframe 页面的控制台查看是否收到消息。`)
}

function goToPairing() {
  window.open('http://127.0.0.1:18789/nodes', '_blank')
  pairingModalVisible.value = false
}

function connectWS() {
  if (store.wsStatus !== 'disconnected') return
  init()
  const wsToken = import.meta.env.VITE_OPENCLAW_TOKEN || auth.token.value
  const url = import.meta.env.VITE_OPENCLAW_WS_URL ?? 'ws://127.0.0.1:18789'
  if (wsToken) {
    ws.connect(wsToken, url)
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
