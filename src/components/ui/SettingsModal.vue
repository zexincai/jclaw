<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]" @click="emit('close')" />
      <div class="relative w-[700px] max-w-[92vw] h-[460px] bg-white rounded-2xl shadow-2xl flex overflow-hidden">

        <!-- 左侧导航 -->
        <div class="w-44 shrink-0 border-r border-gray-100 p-5 flex flex-col">
          <h2 class="text-base font-semibold text-gray-800 mb-5">设置</h2>
          <nav class="flex flex-col gap-0.5">
            <button v-for="tab in tabs" :key="tab.id" @click="active = tab.id" :class="[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left',
              active === tab.id
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            ]">
              <component :is="tab.icon" :size="14" />
              {{ tab.label }}
            </button>
          </nav>
        </div>

        <!-- 右侧内容 -->
        <div class="flex-1 flex flex-col min-h-0 min-w-0">

          <!-- 通用设置 -->
          <div v-if="active === 'general'" class="flex-1 p-6 overflow-y-auto">
            <h3 class="text-sm font-semibold text-gray-700 mb-5">通用设置</h3>
            <div class="space-y-3">
              <!-- 用户信息卡片 -->
              <div class="border border-gray-100 rounded-xl overflow-hidden">
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <span class="text-sm text-gray-700">头像</span>
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    <img v-if="userInfo?.portraitUrl" :src="userInfo.portraitUrl" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      <UserCircle :size="28" />
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between px-5 py-4">
                  <span class="text-sm text-gray-700">姓名</span>
                  <span class="text-sm text-gray-500">{{ userInfo?.realName || '—' }}</span>
                </div>
              </div>

              <!-- 退出登录 -->
              <div class="border border-gray-100 rounded-xl px-5 py-4">
                <button @click="handleLogout"
                  class="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          </div>

          <!-- 用量统计 -->
          <div v-else-if="active === 'usage'" class="flex-1 p-6 overflow-y-auto">
            <h3 class="text-sm font-semibold text-gray-700 mb-5">用量统计</h3>
            <div v-if="store.usage" class="grid grid-cols-2 gap-3">
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">输入 Token</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.inputTokens) }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">输出 Token</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.outputTokens) }}
                </div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">累计费用</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">${{ (store.usage.totalCostUsd ??
                  0).toFixed(4) }}</div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">消息总数</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.totalMessages) }}
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center h-48 text-gray-300 gap-2">
              <BarChart2 :size="32" />
              <p class="text-sm">暂无用量数据，连接后自动刷新</p>
            </div>
            <p v-if="store.usage" class="text-xs text-gray-300 mt-4">
              最后更新：{{ new Date(store.usage.lastUpdated).toLocaleString() }}
            </p>
          </div>

          <!-- 关于我们 -->
          <div v-else-if="active === 'about'" class="flex-1 flex flex-col">
            <div class="flex-1 overflow-y-auto px-6 py-6">
              <div class="flex flex-col items-center gap-3 mb-6">
                <img :src="logoUrl" class="w-16 h-16 rounded-2xl object-cover shadow-md" alt="JClaw Logo" />
                <div class="text-base font-semibold text-gray-800">JClaw</div>
                <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl w-full max-w-sm mt-1">
                  <span class="text-xs text-gray-500">当前版本</span>
                  <span class="text-xs font-medium text-gray-700">{{ currentVersion || 'v1.0.0' }}</span>
                  <span class="flex-1" />
                  <button
                    :disabled="loadingVersions"
                    class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="loadVersionInfo">{{ loadingVersions ? '加载中...' : '版本日志' }}</button>
                </div>
              </div>

              <!-- 版本日志列表 -->
              <div v-if="versionList.length > 0" class="border border-gray-100 rounded-xl overflow-hidden max-w-sm mx-auto">
                <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <h4 class="text-sm font-medium text-gray-700">版本更新日志</h4>
                </div>
                <div class="max-h-[240px] overflow-y-auto">
                  <div v-for="(version, index) in versionList" :key="index"
                    class="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-gray-800">{{ version.versionCode }}</span>
                        <span v-if="version.forceStatus === '1'"
                          class="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded">强制</span>
                        <span v-if="version.enableStatus === 1"
                          class="px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs rounded">待更新</span>
                        <span v-else-if="version.enableStatus === 2"
                          class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded">已更新</span>
                      </div>
                    </div>
                    <p v-if="version.updateContent" class="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{{
                      version.updateContent }}</p>
                    <div class="flex flex-col gap-1 text-xs text-gray-400">
                      <span v-if="version.updateBeginTime">开始: {{ formatDate(version.updateBeginTime) }}</span>
                      <span v-if="version.updateEndTime">结束: {{ formatDate(version.updateEndTime) }}</span>
                    </div>
                    <p v-if="version.remark" class="text-xs text-gray-400 mt-2">{{ version.remark }}</p>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-else-if="!loadingVersions && hasLoadedVersions"
                class="border border-gray-100 rounded-xl px-4 py-8 text-center max-w-sm mx-auto">
                <p class="text-sm text-gray-400">暂无版本更新记录</p>
              </div>
            </div>
            <div class="py-4 text-center border-t border-gray-100">
              <button class="text-xs text-gray-400 hover:text-gray-600 transition-colors">服务协议</button>
              <span class="text-xs text-gray-200 mx-2">｜</span>
              <button class="text-xs text-gray-400 hover:text-gray-600 transition-colors">隐私保护协议</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings, BarChart2, Info, UserCircle } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
import { useAuth } from '../../composables/useAuth'
import { getPersonalUserInfo, getMobileVersionInfo, type EngAgentUserVo, type EngVersionVo } from '../../api/agent'
import logoUrl from '../../assets/logo.jpg'

const emit = defineEmits<{ close: [] }>()
const store = useChatStore()
const { logout } = useAuth()

const tabs = [
  { id: 'general', label: '通用设置', icon: Settings },
  { id: 'usage', label: '用量统计', icon: BarChart2 },
  { id: 'about', label: '关于我们', icon: Info },
]

const active = ref('general')
const userInfo = ref<EngAgentUserVo | null>(null)
const versionList = ref<EngVersionVo[]>([])
const loadingVersions = ref(false)
const hasLoadedVersions = ref(false)
const currentVersion = ref('')

onMounted(async () => {
  try {
    const res = await getPersonalUserInfo()
    userInfo.value = (res as any).data ?? null
  } catch { /* ignore */ }
})

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

async function loadVersionInfo() {
  if (loadingVersions.value) return

  loadingVersions.value = true
  hasLoadedVersions.value = true

  try {
    // mobileType: PC端(PC端: 2, 智能体-PC端: 6, 智能体-移动端: 7)
    const res = await getMobileVersionInfo('6')
    versionList.value = res.data || []

    // 设置当前版本为最新版本
    if (versionList.value.length > 0) {
      currentVersion.value = versionList.value[0].versionCode || 'v1.0.0'
    }
  } catch (err) {
    console.error('获取版本信息失败:', err)
    versionList.value = []
  } finally {
    loadingVersions.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

function handleLogout() {
  logout()
  emit('close')
}
</script>
