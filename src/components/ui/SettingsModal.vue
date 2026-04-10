<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]" @click="emit('close')" />
      <div class="relative w-[700px] max-w-[92vw] h-[460px] bg-white rounded-2xl shadow-2xl flex overflow-hidden">

        <!-- 左侧导航 -->
        <div class="w-44 shrink-0 border-r border-gray-100 p-5 flex flex-col">
          <h2 class="text-base font-semibold text-gray-800 mb-5">设置</h2>
          <nav class="flex flex-col gap-0.5">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="active = tab.id"
              :class="[
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left',
                active === tab.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              ]"
            >
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
            <div class="space-y-1">
              <div class="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div class="text-sm text-gray-700">界面语言</div>
                  <div class="text-xs text-gray-400 mt-0.5">当前界面显示语言</div>
                </div>
                <select class="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300">
                  <option>中文</option>
                  <option>English</option>
                </select>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <div class="text-sm text-gray-700">发送快捷键</div>
                  <div class="text-xs text-gray-400 mt-0.5">按下后发送消息</div>
                </div>
                <select class="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300">
                  <option>Enter</option>
                  <option>Ctrl + Enter</option>
                </select>
              </div>
              <div class="flex items-center justify-between py-3">
                <div>
                  <div class="text-sm text-gray-700">自动展开思考过程</div>
                  <div class="text-xs text-gray-400 mt-0.5">收到消息时自动展开 Thinking</div>
                </div>
                <button
                  @click="autoExpandThinking = !autoExpandThinking"
                  :class="[
                    'w-9 h-5 rounded-full transition-colors relative shrink-0',
                    autoExpandThinking ? 'bg-teal-500' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                      autoExpandThinking ? 'translate-x-4' : 'translate-x-0.5'
                    ]"
                  />
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
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.inputTokens) }}</div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">输出 Token</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.outputTokens) }}</div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">累计费用</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">${{ (store.usage.totalCostUsd ?? 0).toFixed(4) }}</div>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="text-xs text-gray-400 mb-1.5">消息总数</div>
                <div class="text-2xl font-semibold text-gray-800 tracking-tight">{{ fmtNum(store.usage.totalMessages) }}</div>
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
            <div class="flex-1 flex flex-col items-center justify-center gap-3 px-6">
              <div class="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-md">
                <span class="text-white text-2xl font-bold">J</span>
              </div>
              <div class="text-base font-semibold text-gray-800">JClaw</div>
              <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl w-full max-w-sm mt-1">
                <span class="text-xs text-gray-500">当前版本</span>
                <span class="text-xs font-medium text-gray-700">v1.0.0</span>
                <span class="flex-1" />
                <button
                  class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
                  @click="checkUpdate"
                >检查更新</button>
                <button class="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors">版本日志</button>
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
import { ref } from 'vue'
import { Settings, BarChart2, Info } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'

const emit = defineEmits<{ close: [] }>()
const store = useChatStore()

const tabs = [
  { id: 'general', label: '通用设置', icon: Settings },
  { id: 'usage',   label: '用量统计', icon: BarChart2 },
  { id: 'about',   label: '关于我们', icon: Info },
]

const active = ref('general')
const autoExpandThinking = ref(false)

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function checkUpdate() {
  alert('当前已是最新版本 v1.0.0')
}
</script>
