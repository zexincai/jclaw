<template>
  <span>
    <input ref="input" type="file" class="hidden" :accept="accept" @change="onChange" />
    <button
      @click="input?.click()"
      class="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
    ><slot /></button>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Attachment } from '../../stores/chat'

const MAX = 10 * 1024 * 1024
defineProps<{ accept?: string }>()
const emit = defineEmits<{ file: [Attachment]; error: [string] }>()
const input = ref<HTMLInputElement | null>(null)

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX) { emit('error', `文件过大（最大 10MB）：${file.name}`); return }
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    const data = result.split(',')[1]
    const previewUrl = file.type.startsWith('image/') ? result : undefined
    emit('file', { name: file.name, mimeType: file.type, data, previewUrl })
  }
  reader.readAsDataURL(file)
  // 重置 input，允许再次选同一文件
  ;(e.target as HTMLInputElement).value = ''
}
</script>
