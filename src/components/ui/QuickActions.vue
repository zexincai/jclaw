<template>
  <div class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-50">
    <button
      v-for="a in QUICK_ACTIONS" :key="a.id"
      @click="emit('action', a.message)"
      class="shrink-0 flex items-center gap-1 px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
    >{{ a.label }} <ChevronRight :size="10" /></button>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { QUICK_ACTIONS } from '../../config/quickActions'
const emit = defineEmits<{ action: [message: string] }>()
</script>
