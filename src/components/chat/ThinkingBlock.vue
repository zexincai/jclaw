<template>
  <div class="mb-2">
    <button
      @click="open = !open"
      class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      <ChevronDown
        :size="12"
        :class="{ 'rotate-180': open }"
        class="transition-transform duration-150"
      />
      已完成思考
    </button>
    <div
      v-if="open"
      class="mt-1.5 pl-3 border-l-2 border-gray-200 text-xs text-gray-500 whitespace-pre-wrap leading-relaxed"
    >{{ content }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
defineProps<{ content: string }>()
const open = ref(false)
</script>
