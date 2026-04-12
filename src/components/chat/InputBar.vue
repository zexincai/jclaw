<template>
  <div :class="[
    'bg-white shrink-0 transition-all duration-500',
    isWelcome ? 'border-0' : 'border-t border-gray-100'
  ]">
    <QuickActions v-if="!isWelcome" @action="text = $event" />
    <div :class="['px-4 pb-3', isWelcome ? 'pt-0' : 'pt-2']">
      <div v-if="isRecording" class="transition-all">
        <VoiceRecorder @cancel="isRecording = false" @finish="handleVoiceFinish" />
      </div>
      
      <div v-else :class="[
        'flex flex-col border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all relative group',
        isWelcome ? 'border-gray-200' : 'border-gray-200 focus-within:border-blue-300',
        isDragging ? 'border-blue-400 bg-blue-50/20 ring-2 ring-blue-100' : ''
      ]"
      @dragover.prevent
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      >
        <!-- 拖拽提示层 -->
        <div v-if="isDragging" class="absolute inset-0 z-20 bg-blue-500/5 flex items-center justify-center pointer-events-none">
          <div class="px-4 py-2 bg-white rounded-full shadow-lg border border-blue-100 text-blue-600 text-sm font-medium flex items-center gap-2">
            <Upload :size="16" /> 释放鼠标以上传文件
          </div>
        </div>

        <!-- 上传进度条 -->
        <div v-if="uploadProgress !== null" class="absolute top-0 left-0 right-0 h-0.5 bg-gray-100 z-10">
          <div class="h-full bg-blue-500 transition-all duration-300 ease-out" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        
        <textarea v-model="text" @keydown.enter.exact.prevent="submit" @paste="handlePaste" rows="2" placeholder="可以描述任务或提问任何问题"
          class="px-4 pt-4 text-sm text-gray-700 resize-none outline-none placeholder-gray-400 bg-white" />
        <div class="flex items-center justify-between px-3 pb-3 bg-white">
          <div class="flex gap-2 text-gray-400">
            <FileUpload accept="image/*" @file="handleFile" @progress="uploadProgress = $event" @error="toast = $event">
              <Image :size="18" class="hover:text-blue-500 transition-colors" />
            </FileUpload>
            <FileUpload accept=".pdf,.txt,image/*" @file="handleFile" @progress="uploadProgress = $event" @error="toast = $event">
              <Paperclip :size="18" class="hover:text-blue-500 transition-colors" />
            </FileUpload>
          </div>
          <div class="flex items-center gap-3">
            <button @click="isRecording = true" class="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="语音输入">
              <Mic :size="18" />
            </button>
            <button @click="submit" :disabled="!text.trim() && files.length === 0"
              class="p-2 bg-blue-500 text-white rounded-full disabled:opacity-30 hover:bg-blue-600 transition-all shadow-md active:scale-95">
              <Send :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- 附件预览 -->
      <div v-if="files.length" class="flex flex-wrap gap-1.5 mt-2">
        <div v-for="(f, i) in files" :key="i"
          class="flex items-center gap-1 px-2 py-1 bg-blue-50/50 border border-blue-100 rounded-lg text-[10px] text-blue-700">
          <img v-if="f.previewUrl" :src="f.previewUrl" class="w-4 h-4 rounded object-cover" />
          <Paperclip v-else :size="10" />
          <span class="truncate max-w-[80px] font-medium">{{ f.name }}</span>
          <button @click="files.splice(i, 1)" class="text-blue-300 hover:text-blue-500 transition-colors">×</button>
        </div>
      </div>

      <p v-if="toast" class="mt-1 text-xs text-red-500">{{ toast }}</p>
      <p v-if="!isWelcome" class="mt-2 text-[10px] text-gray-300 text-center tracking-wider">内容由AI生成，请注意甄别</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Image, Paperclip, Mic, Send, Upload } from 'lucide-vue-next'
import type { Attachment } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import QuickActions from '../ui/QuickActions.vue'
import FileUpload from '../ui/FileUpload.vue'
import VoiceRecorder from './VoiceRecorder.vue'
import { uploadAudio, uploadFile } from '../../utils/upload'

defineProps<{
  isWelcome?: boolean
}>()

const chat = useChat()
const text = ref('')
const files = ref<Attachment[]>([])
const toast = ref('')
const isRecording = ref(false)
const isDragging = ref(false)
const uploadProgress = ref<number | null>(null)

function handleFile(f: Attachment) {
  files.value.push(f)
  uploadProgress.value = null
}

async function processFile(file: File) {
  const MAX = 10 * 1024 * 1024
  if (file.size > MAX) {
    toast.value = `文件过大（最大 10MB）：${file.name}`
    return
  }

  uploadProgress.value = 0
  try {
    const url = await uploadFile(file, (p) => {
      const percent = Math.round(p.percent || (p.loaded / p.total) * 100)
      uploadProgress.value = percent
    })

    let previewUrl: string | undefined
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      previewUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    }

    files.value.push({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      data: url,
      previewUrl
    })
  } catch (err) {
    toast.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    uploadProgress.value = null
  }
}

async function handleDrop(e: DragEvent) {
  isDragging.value = false
  const droppedFiles = e.dataTransfer?.files
  if (!droppedFiles?.length) return
  
  for (const file of Array.from(droppedFiles)) {
    await processFile(file)
  }
}

async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile()
      if (file) await processFile(file)
    }
  }
}

async function submit() {
  const t = text.value.trim()
  if (!t && files.value.length === 0) return
  toast.value = ''
  const att = [...files.value]
  text.value = ''
  files.value = []
  await chat.send(t, att)
}

async function handleVoiceFinish(file: File) {
  isRecording.value = false
  try {
    const url = await uploadAudio(file)
    const voiceAtt: Attachment = {
      name: file.name,
      mimeType: file.type,
      data: url
    }
    // 直接单发语音消息
    await chat.send('', [voiceAtt])
  } catch (err) {
    toast.value = err instanceof Error ? err.message : '语音上传失败'
  }
}
</script>
