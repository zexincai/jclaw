<template>
  <button
    @click="handleClick"
    class="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors"
  >
    <ExternalLink :size="12" />
    {{ action.label }}
  </button>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import type { PlatformAction } from '../../stores/chat'
import { useIframeBridge } from '../../composables/useIframeBridge'

const props = defineProps<{ action: PlatformAction }>()
const bridge = useIframeBridge()

function handleClick() {
  bridge.dispatchAction(props.action.payload)
}
</script>
