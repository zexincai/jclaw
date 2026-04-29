<template>
  <!-- 遮罩 -->
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/20" @click="$emit('close')">
    <!-- 面板（阻止点击冒泡到遮罩） -->
    <div class="relative z-50 flex flex-col overflow-hidden bg-white shadow-2xl rounded-xl" style="width: 800px; height: 70vh" @click.stop>

    <!-- ── 头部 ── -->
    <div class="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 shrink-0">
      <div
        class="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full shrink-0"
        :style="{ backgroundColor: activeTabColor }"
      >{{ activeTabLabel.charAt(0) }}</div>
      <span class="text-sm font-semibold text-gray-800">{{ activeTabLabel }}</span>
      <span class="text-xs text-gray-400">({{ visibleItems.length }})</span>
      <div class="flex-1" />
      <button
        @click="$emit('close')"
        class="flex items-center justify-center text-gray-400 transition-colors rounded-full w-7 h-7 hover:bg-gray-100 hover:text-gray-600"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- ── 标签页 ── -->
    <div class="flex items-center gap-1 px-3 pt-2 pb-0 border-b border-gray-100 shrink-0">
      <button
        v-for="tab in TABS"
        :key="tab.type"
        @click="selectTab(tab.type)"
        class="relative whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors"
        :class="activeTab === tab.type
          ? 'bg-white text-blue-600 border border-b-white border-gray-200 -mb-px z-10'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
      >
        {{ tab.label }}
        <span
          v-if="tabCount(tab.type) > 0"
          class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none border border-white"
          :class="activeTab === tab.type ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'"
        >{{ tabCount(tab.type) }}</span>
      </button>
    </div>

    <!-- ── 主体：左侧角色 + 右侧列表 ── -->
    <div class="flex flex-1 min-h-0">

      <!-- 左侧角色列表 -->
      <div class="py-1 overflow-y-auto border-r border-gray-100 w-14 shrink-0 bg-gray-50">
        <button
          v-for="role in rolesWithCount"
          :key="role.userId"
          @click="selectedUserId = role.userId"
          class="relative flex justify-center w-full py-2 transition-colors"
          :class="selectedUserId === role.userId ? 'bg-white' : 'hover:bg-gray-100'"
        >
          <!-- 选中竖线 -->
          <span
            v-if="selectedUserId === role.userId"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r"
          />
          <!-- 头像（与切换角色列表逻辑相同） -->
          <div class="relative">
            <div
              :class="[
                'w-8 h-8 rounded-[10px] flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0 border border-gray-100',
                !getAvatarByOrgType(role.orgType) && !role.avatar
                  ? BG_COLORS[rolesWithCount.indexOf(role) % BG_COLORS.length]
                  : 'bg-white',
              ]"
            >
              <img v-if="getAvatarByOrgType(role.orgType)" :src="getAvatarByOrgType(role.orgType)!" class="object-cover w-full h-full" />
              <img v-else-if="role.avatar" :src="role.avatar" class="object-cover w-full h-full" />
              <span v-else>{{ role.loginName.slice(0, 1).toUpperCase() }}</span>
            </div>
            <span
              v-if="role.count > 0"
              class="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none border border-white"
            >{{ role.count }}</span>
          </div>
        </button>
      </div>

      <!-- 右侧列表 -->
      <div class="flex-1 overflow-y-auto">
        <!-- 加载中 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
          <Loader2 :size="18" class="animate-spin" />
          <span class="text-xs">加载中…</span>
        </div>

        <template v-else>
          <div
            v-for="item in visibleItems"
            :key="item.pkId"
            class="flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-50 hover:bg-gray-50"
          >
            <!-- 类型方块 -->
            <div
              class="flex items-center justify-center w-16 h-10 px-1 text-xs font-medium leading-tight text-center rounded-md shrink-0"
              :style="typeBlockStyle(item)"
            >{{ item.businessTypeName || '?' }}</div>

            <!-- 内容 -->
            <div class="flex-1 min-w-0">
              <p class="text-sm leading-snug text-gray-800 truncate">{{ item.title || '（无标题）' }}</p>
              <p class="text-xs text-gray-400 mt-0.5 flex gap-1.5">
                <span>{{ item.fkUserName || '' }}</span>
                <span v-if="item.createTime">{{ formatDate(item.createTime) }}</span>
              </p>
            </div>

            <!-- 操作按钮 -->
            <button
              @click="handleAction(item)"
              class="shrink-0 text-xs px-2.5 py-1 rounded border transition-colors"
              :class="actionLabel(item) === '确认'
                ? 'border-orange-400 text-orange-500 hover:bg-orange-50'
                : 'border-blue-400 text-blue-500 hover:bg-blue-50'"
            >{{ actionLabel(item) }}</button>
          </div>

          <div v-if="visibleItems.length === 0" class="py-10 text-sm text-center text-gray-400">
            暂无{{ activeTabLabel }}
          </div>
        </template>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useBacklog } from '../../composables/useBacklog'
import { useAuth } from '../../composables/useAuth'
import { useChat } from '../../composables/useChat'
import { getAvatarByOrgType } from '../../utils/avatar'
import type { BacklogItemVo } from '../../api/agent'

const props = defineProps<{ messageType: number }>()
const emit = defineEmits<{ close: [] }>()

const { typeTotals, typeItemsMap, typeItemsLoadingSet, fetchTypeItems, fetchAllTypeItems } = useBacklog()
const { roles } = useAuth()
const chat = useChat()

// ── 标签页配置 ────────────────────────────────────────
const ALL_TAB = -1
const TABS = [
  { type: 0,       label: '待办事项', color: '#4fa3e3' },
  { type: 1,       label: '确认事项', color: '#f97316' },
  { type: 2,       label: '提醒事项', color: '#9b59b6' },
  { type: ALL_TAB, label: '全部',     color: '#6b7280' },
]

const activeTab = ref(props.messageType)
const selectedUserId = ref<string>('')

function tabCount(type: number) {
  if (type === ALL_TAB) return Object.values(typeTotals.value).reduce((a, b) => a + b, 0)
  return typeTotals.value[type] ?? 0
}

const activeTabLabel = computed(() => TABS.find(t => t.type === activeTab.value)?.label ?? '')
const activeTabColor  = computed(() => TABS.find(t => t.type === activeTab.value)?.color ?? '#4fa3e3')

// ── 当前 tab 的原始列表（过滤 mechanismType===1 私下发送项） ──────────────
const currentItems = computed<BacklogItemVo[]>(() => {
  const filterPrivate = (arr: BacklogItemVo[]) => arr.filter(item => item.mechanismType !== 1)
  if (activeTab.value === ALL_TAB) {
    return [
      ...filterPrivate(typeItemsMap.value[0] ?? []),
      ...filterPrivate(typeItemsMap.value[1] ?? []),
      ...filterPrivate(typeItemsMap.value[2] ?? []),
    ]
  }
  return filterPrivate(typeItemsMap.value[activeTab.value] ?? [])
})

// ── 加载状态 ──────────────────────────────────────────
const isLoading = computed(() => {
  if (activeTab.value === ALL_TAB) {
    return [0, 1, 2].some(t => typeItemsLoadingSet.value.has(t))
  }
  return typeItemsLoadingSet.value.has(activeTab.value)
})

// ── 左侧角色列表（登录接口角色 + 当前 tab 数量） ──────
const rolesWithCount = computed(() =>
  roles.value.map(role => ({
    ...role,
    count: currentItems.value.filter(
      item => String(item.fkUserId) === String(role.userId)
    ).length,
  })).filter(r => r.count > 0)
)

// 默认选中第一个有数据的角色
watch(rolesWithCount, (list) => {
  if (list.length && !list.find(r => r.userId === selectedUserId.value)) {
    selectedUserId.value = list[0].userId
  }
}, { immediate: true })

// ── 右侧可见列表（按选中角色过滤） ───────────────────
const visibleItems = computed(() =>
  selectedUserId.value
    ? currentItems.value.filter(item => String(item.fkUserId) === String(selectedUserId.value))
    : currentItems.value
)

// ── 切换 tab ──────────────────────────────────────────
function selectTab(type: number) {
  activeTab.value = type
  selectedUserId.value = ''
  if (type === ALL_TAB) {
    fetchAllTypeItems()
  } else {
    fetchTypeItems(type)
  }
}

// ── 初始加载 ──────────────────────────────────────────
onMounted(async () => {
  if (props.messageType === ALL_TAB) {
    await fetchAllTypeItems()
  } else {
    await fetchTypeItems(props.messageType)
  }
  chat.autoSendPrivateItems()
})

// ── 样式工具 ──────────────────────────────────────────
const BG_COLORS = [
  'bg-teal-500',
  'bg-slate-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-cyan-600',
]

const TYPE_BLOCK_COLORS = [
  { bg: '#fde8e8', text: '#c0392b' },
  { bg: '#e8f4fd', text: '#2471a3' },
  { bg: '#e8fdf0', text: '#1e8449' },
  { bg: '#fef9e7', text: '#b7770d' },
  { bg: '#f0ebff', text: '#7d3c98' },
  { bg: '#fdebd0', text: '#d35400' },
  { bg: '#eaf2ff', text: '#1a5276' },
  { bg: '#fdf2f8', text: '#c0392b' },
]
function typeBlockStyle(item: BacklogItemVo) {
  const key = (item.matterType ?? item.businessType ?? 0) % TYPE_BLOCK_COLORS.length
  const c = TYPE_BLOCK_COLORS[key]
  return { backgroundColor: c.bg, color: c.text }
}

function formatDate(dateStr: string) {
  return dateStr.replace('T', ' ').slice(0, 16)
}

function actionLabel(item: BacklogItemVo) {
  return item.quickButtonName || (item.matterStatus === 1 ? '确认' : '处理')
}

async function handleAction(item: BacklogItemVo) {
  await chat.sendBacklogItem(item)
  emit('close')
}
</script>
