<template>
  <div v-if="backlogTotal > 0" class="relative shrink-0">
    <!-- 折叠头部 -->
    <button
      @click="expanded = !expanded"
      class="flex items-center gap-1.5 w-full px-4 py-2 text-sm bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
    >
      <span>待办事项 ({{ backlogTotal }})</span>
      <ChevronDown
        :size="14"
        class="transition-transform text-gray-400"
        :class="expanded ? 'rotate-180' : ''"
      />
    </button>

    <!-- 展开列表（绝对定位，悬浮在聊天内容上方） -->
    <div
      v-if="expanded"
      class="absolute top-full left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-md max-h-80 overflow-y-auto"
    >
      <div
        v-for="item in backlogItems"
        :key="item.pkId"
        class="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
      >
        <!-- 头像 -->
        <div class="relative shrink-0">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            :style="{ backgroundColor: avatarColor(item) }"
          >
            {{ avatarText(item) }}
          </div>
          <span
            v-if="isNew(item)"
            class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          />
        </div>

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <!-- 标签 -->
          <div class="flex items-center gap-1 mb-0.5">
            <span
              v-if="item.businessTypeName"
              class="inline-block px-1.5 py-0.5 rounded text-xs leading-tight"
              :style="tagStyle(item)"
            >{{ item.businessTypeName }}</span>
            <span
              v-if="item.roleName"
              class="inline-block px-1.5 py-0.5 rounded text-xs leading-tight bg-gray-100 text-gray-500"
            >{{ item.roleName }}</span>
          </div>
          <!-- 标题 -->
          <p class="text-sm text-gray-800 truncate leading-snug">{{ item.title || '（无标题）' }}</p>
          <!-- 发起人 + 时间 -->
          <p class="text-xs text-gray-400 mt-0.5">
            {{ item.fkUserName || '' }}
            <span v-if="item.createTime" class="ml-1">{{ formatDate(item.createTime) }}</span>
          </p>
        </div>

        <!-- 操作按钮 -->
        <button
          class="shrink-0 text-xs px-2.5 py-1 rounded border border-blue-400 text-blue-500 hover:bg-blue-50 transition-colors"
        >
          {{ actionLabel(item) }}
        </button>
      </div>

      <div v-if="backlogItems.length === 0" class="py-6 text-center text-sm text-gray-400">
        暂无待办
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useBacklog } from '../../composables/useBacklog'
import type { BacklogItemVo } from '../../api/agent'

const { backlogItems, backlogTotal } = useBacklog()
const expanded = ref(false)

// 颜色池，按 bizType 或 businessType 取色
const COLORS = ['#4f9cf9', '#f97316', '#a78bfa', '#34d399', '#fb7185', '#fbbf24', '#60a5fa', '#f472b6']

function avatarColor(item: BacklogItemVo): string {
  const key = (item.bizType ?? item.businessType ?? 0) % COLORS.length
  return COLORS[key]
}

function avatarText(item: BacklogItemVo): string {
  const name = item.businessTypeName ?? ''
  return name.charAt(0) || '?'
}

const TAG_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: '#e8f4fd', text: '#2b7abf' },
  4: { bg: '#f0ebff', text: '#7c3aed' },
  0: { bg: '#fff7e6', text: '#d97706' },
}

function tagStyle(item: BacklogItemVo) {
  const c = TAG_COLORS[item.bizType ?? -1] ?? { bg: '#f3f4f6', text: '#6b7280' }
  return { backgroundColor: c.bg, color: c.text }
}

function isNew(item: BacklogItemVo): boolean {
  // 将创建时间在最近24小时内的视为"新"待办
  if (!item.createTime) return false
  const created = new Date(item.createTime).getTime()
  return Date.now() - created < 86400_000
}

function formatDate(dateStr: string): string {
  return dateStr.replace('T', ' ').slice(0, 16)
}

function actionLabel(item: BacklogItemVo): string {
  // matterStatus 1:发起用章待办 → 确认；其余 → 处理
  if (item.matterStatus === 1) return '确认'
  return '处理'
}
</script>
