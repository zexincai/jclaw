<template>
  <!-- Toast 始终挂载，登录页也能显示错误提示 -->
  <ToastList />
  <LoginView v-if="!auth.isLoggedIn.value" />
  <div v-else class="flex flex-col h-screen overflow-hidden bg-gray-50">
    <!-- 标题栏 -->
    <div class="flex items-center h-10 gap-2 px-3 bg-white border-b border-gray-200 shrink-0">
      <div class="flex items-center gap-1.5">
        <img :src="logoUrl" class="object-cover w-8 h-8 rounded-full" />
        <span class="text-sm font-semibold text-gray-700">JClaw</span>
      </div>
      <div class="flex-1" />
      <!-- iframe 通信测试按钮 -->
      <!-- <button @click="testIframe"
        class="px-2.5 py-1 text-xs border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-mono"
        title="测试 iframe 通信">测试通信</button> -->
      <!-- WS 状态指示 -->
      <div :class="[
        'w-2 h-2 rounded-full shrink-0 transition-colors',
        store.wsStatus === 'connected' ? 'bg-green-500' :
          store.wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
      ]" :title="store.wsStatus === 'connected' ? '已连接' : store.wsStatus === 'connecting' ? '连接中' : '未连接'" />
    </div>

    <!-- 主内容区：项目栏 + 会话面板 + 聊天 + iframe -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <ProjectSwitcher />
      <SidePanel v-show="sidePanelOpen" :style="{ width: sidePanelWidth + 'px' }" class="shrink-0" />
      <button @click="sidePanelOpen = !sidePanelOpen" @mousedown="onSideDividerMousedown"
        class="flex items-center justify-center w-4 transition-colors border-r border-gray-200 shrink-0 bg-gray-50 hover:bg-gray-50 text-gray-00 hover:text-gray-500"
        :title="sidePanelOpen ? '收起侧栏' : '展开侧栏'">
        <ChevronsLeft v-if="sidePanelOpen" :size="12" />
        <ChevronsRight v-else :size="12" />
      </button>
      <ChatArea class="flex-1 min-w-[450px]" />
      <button v-if="bridge.isVisible.value" @click="bridge.closePanel()" @mousedown="onBizDividerMousedown"
        class="flex items-center justify-center w-4 text-gray-300 transition-colors border-l border-gray-200 bg-gray-50 shrink-0 hover:bg-gray-50 hover:text-gray-500"
        title="收起面板">
        <ChevronsRight :size="12" />
      </button>
      <BusinessPanel v-show="bridge.isVisible.value" :style="{ width: businessPanelWidth + 'px' }" class="shrink-0" />
    </div>

    <!-- 配对引导弹窗 -->
    <div v-if="pairingModalVisible" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="pairingModalVisible = false" />

      <!-- 弹窗主体 -->
      <div
        class="relative w-full max-w-sm overflow-hidden duration-300 bg-white shadow-2xl rounded-2xl animate-in fade-in zoom-in">
        <div class="flex flex-col items-center px-6 py-8 text-center">
          <div class="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-50">
            <Link2 class="text-red-500" :size="32" />
          </div>

          <h3 class="mb-2 text-lg font-bold text-gray-900">需要设备配对</h3>
          <p class="mb-8 text-sm leading-relaxed text-gray-500">
            当前设备尚未与 JClaw 环境成功配对。请前往管理页面完成验证，以便正常使用智能能力。
          </p>

          <div class="flex flex-col w-full gap-3">
            <button @click="goToPairing"
              class="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-200 active:scale-[0.98]">
              立即去配对
            </button>
            <button @click="pairingModalVisible = false"
              class="w-full px-4 py-3 text-gray-500 transition-colors hover:text-gray-700 hover:bg-gray-50 rounded-xl">
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

    <!-- 连接状态弹窗 -->
    <!-- 连接状态弹窗 -->
    <ConnectionStatusModal :visible="connectionModalVisible" :status="auth.connectionStatus.value"
      :error="auth.connectionError.value" @close="connectionModalVisible = false" @retry="handleRetryConnection"
      @update-token="handleUpdateToken" @not-paired="handleNotPaired" />

    <!-- 切换角色加载中 -->
    <GlobalLoading :visible="store.switchingRole" message="加载中" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// 拖拽分割线逻辑
function useDividerDrag(
  widthRef: ReturnType<typeof ref<number>>,
  minWidth: number,
  maxWidth: number,
  direction: 'left' | 'right' = 'left',
  dynamicMax?: () => number
) {
  function onMousedown(e: MouseEvent) {
    const startX = e.clientX
    const startWidth = widthRef.value
    let dragged = false
    let overlay: HTMLDivElement | null = null

    function onMousemove(ev: MouseEvent) {
      if (!dragged && Math.abs(ev.clientX - startX) < 4) return
      if (!dragged) {
        dragged = true
        // 拖动开始时才创建遮罩，避免单击时 click 事件丢失
        overlay = document.createElement('div')
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:col-resize'
        document.body.appendChild(overlay)
      }
      const delta = direction === 'left' ? ev.clientX - startX : startX - ev.clientX
      const max = dynamicMax ? dynamicMax() : maxWidth
      widthRef.value = Math.min(max, Math.max(minWidth, (startWidth ?? 0) + delta))
    }
    function cleanup(ev: MouseEvent) {
      overlay?.remove()
      window.removeEventListener('mousemove', onMousemove)
      window.removeEventListener('mouseup', cleanup)
      if (dragged) ev.stopPropagation()
    }
    window.addEventListener('mousemove', onMousemove)
    window.addEventListener('mouseup', cleanup)
  }
  return { onMousedown }
}
import logoUrl from './assets/logo.png'
import { ChevronsLeft, ChevronsRight, Link2 } from 'lucide-vue-next'
import ProjectSwitcher from './components/layout/ProjectSwitcher.vue'
import SidePanel from './components/layout/SidePanel.vue'
import ChatArea from './components/layout/ChatArea.vue'
import BusinessPanel from './components/layout/BusinessPanel.vue'
import RealNameAuthModal from './components/modals/RealNameAuthModal.vue'
import GlobalLoading from './components/GlobalLoading.vue'
import LoginView from './views/LoginView.vue'
import ConnectionStatusModal from './components/ConnectionStatusModal.vue'
import ToastList from './components/ui/ToastList.vue'
import { useWukongIM } from './composables/useWukongIM'
import { useProjects } from './composables/useProjects'
import { useChat } from './composables/useChat'
import { useIframeBridge } from './composables/useIframeBridge'
import { useAuth } from './composables/useAuth'
import { useChatStore } from './stores/chat'
const store = useChatStore()
const wkIM = useWukongIM()
const { init } = useProjects()
const chat = useChat()
const bridge = useIframeBridge()
const auth = useAuth()

const sidePanelOpen = ref(true)
const pairingModalVisible = ref(false)
const connectionModalVisible = ref(false)

const sidePanelWidth = ref(224) // 默认 w-56 = 224px
const businessPanelWidth = ref(1260)
const { onMousedown: onSideDividerMousedown } = useDividerDrag(sidePanelWidth, 160, 400, 'left')
const { onMousedown: onBizDividerMousedown } = useDividerDrag(businessPanelWidth, 600, 1600, 'right', () => {
  // 总可用宽度 - 聊天区最小宽度 560 - 分割条 4px*2 - ProjectSwitcher/SidePanel 等左侧宽度
  const chatMinWidth = 450
  const dividers = 8 // 两个分割条各 4px
  return window.innerWidth - (sidePanelOpen.value ? sidePanelWidth.value : 0) - chatMinWidth - dividers - 40 // 40 为 ProjectSwitcher 估算
})

function onAuthSuccess() {
  auth.updateCertificationStatus(true)
}

watch(wkIM.status, async (s) => {
  store.wsStatus = s
  if (s !== 'connected') return
  store.wsMaxRetries = false
  pairingModalVisible.value = false
  if (store.activeSessionId) return
  const project = store.activeProject()
  if (!project) return
  await chat.loadSessions()
  if (!store.activeSessionId) {
    chat.newSession()
  } else {
    await chat.loadSession(store.activeSessionId)
  }
}, { immediate: true })

// function testIframe() {
//   const testMsg = {
//     type: 'JCLAW_OPEN_MODAL',
//     "label": "查看施工日志",
//     "path": "/org/dept",
//     "menuId": "301",
//     name: "测试",
//     operateType: 0
//   }
//   const iframe = bridge.iframeRef.value
//   if (!iframe?.contentWindow) return
//   bridge.dispatchAction(testMsg)
//   bridge.isVisible.value = true
// }

function goToPairing() {
  window.open('http://127.0.0.1:18789/nodes', '_blank')
  pairingModalVisible.value = false
}

function connectWS() {
  if (store.wsStatus !== 'disconnected') return
  init()

  const role = auth.currentRole.value
  if (!role) {
    auth.setConnectionStatus('failed', '未获取到用户信息')
    return
  }

  auth.setConnectionStatus('verifying')
  const token = auth.token.value || localStorage.getItem('jclaw_token') || ''
  wkIM.connect(String(role.userId), role.telephone, token)
    .then(() => auth.setConnectionStatus('connected'))
    .catch(() => auth.setConnectionStatus('failed', '悟空IM连接失败'))
}

function handleRetryConnection() {
  wkIM.disconnect()
  connectWS()
}

function handleUpdateToken(_token: string) {
  // 悟空IM 使用业务系统 token，无需单独配置
  wkIM.disconnect()
  connectWS()
}

function handleNotPaired(_error: Error) {
  connectionModalVisible.value = false
  pairingModalVisible.value = true
}

// 已登录（localStorage 恢复）时直接连接；登录事件触发时也连接
onMounted(() => {
  if (auth.isLoggedIn.value) connectWS()
})

watch(auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) connectWS()
})

// 切换角色时重连（userId 变化，初次赋值跳过）
watch(() => auth.currentRole.value?.userId, (newId, oldId) => {
  if (!newId || !oldId || newId === oldId) return
  wkIM.disconnect()
  store.wsStatus = 'disconnected'
  connectWS()
})

// 监听连接状态变化，失败时显示弹窗
watch(() => auth.connectionStatus.value, (status) => {
  if (status === 'failed') {
    connectionModalVisible.value = true
  }
})
</script>
