<template>
  <span>
    <input ref="input" type="file" class="hidden" :accept="accept" @change="onChange" />
    <button
      @click="input?.click()"
      :disabled="uploading"
      class="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    ><slot /></button>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Attachment } from '../../stores/chat'
import { uploadFile } from '../../utils/upload'

const MAX = 10 * 1024 * 1024
defineProps<{ accept?: string }>()
const emit = defineEmits<{ file: [Attachment]; error: [string] }>()
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

async function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX) {
    emit('error', `文件过大（最大 10MB）：${file.name}`)
    return
  }

  uploading.value = true

  try {
    // 上传文件到腾讯云，获取真实 URL
    const fileUrl = await uploadFile(file, (percent) => {
      console.log(`上传进度: ${percent}%`)
    })

    // 生成预览 URL（图片类型）
    let previewUrl: string | undefined
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      previewUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }

    emit('file', {
      name: file.name,
      mimeType: file.type,
      data: fileUrl, // 存储真实的 URL 而不是 base64
      previewUrl
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    emit('error', error instanceof Error ? error.message : '文件上传失败，请重试')
  } finally {
    uploading.value = false
    // 重置 input，允许再次选同一文件
    ;(e.target as HTMLInputElement).value = ''
  }
}
</script>
