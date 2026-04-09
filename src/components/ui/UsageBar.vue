<template>
  <div class="flex items-center gap-2 text-xs text-gray-400 min-w-0">
    <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <User :size="14" class="text-gray-500" />
    </div>
    <template v-if="store.usage">
      <span title="输入 token">↑{{ fmt(store.usage.inputTokens) }}</span>
      <span title="输出 token">↓{{ fmt(store.usage.outputTokens) }}</span>
      <span title="累计费用">${{ (store.usage.totalCostUsd ?? 0).toFixed(3) }}</span>
      <span
        :class="store.usage.contextUsedPct > 80 ? 'text-orange-500 font-semibold' : ''"
        title="context 窗口使用率"
      >ctx {{ store.usage.contextUsedPct }}%</span>
    </template>
    <span v-else class="text-gray-300 text-xs">未连接</span>
    <button class="ml-auto p-1 hover:text-gray-600 rounded transition-colors shrink-0" title="设置">
      <Settings :size="13" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { User, Settings } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'

const store = useChatStore()
function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
</script>
