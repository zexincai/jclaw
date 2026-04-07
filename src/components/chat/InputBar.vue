<template>
  <div class="border-t border-gray-100 bg-white shrink-0">
    <QuickActions @action="text = $event" />
    <div class="px-4 pb-3 pt-2">
      <div class="flex flex-col border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-300 transition-colors">
        <textarea
          v-model="text"
          @keydown.enter.exact.prevent="submit"
          rows="2"
          placeholder="可以描述任务或提问任何问题"
          class="px-4 pt-3 text-sm text-gray-700 resize-none outline-none placeholder-gray-400 bg-white"
        />
        <div class="flex items-center justify-between px-3 pb-2 bg-white">
          <div class="flex gap-1">
            <FileUpload accept="image/*" @file="files.push($event)" @error="toast = $event">
              <Image :size="16" />
            </FileUpload>
            <FileUpload accept=".pdf,.txt,image/*" @file="files.push($event)" @error="toast = $event">
              <Paperclip :size="16" />
            </FileUpload>
          </div>
          <div class="flex items-center gap-2">
            <select
              v-model="store.activeProjectId"
              class="text-xs text-gray-500 outline-none bg-transparent border-0 cursor-pointer max-w-[100px] truncate"
            >
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button disabled class="p-1.5 text-gray-300 cursor-not-allowed" title="语音输入（暂未开放）">
              <Mic :size="16" />
            </button>
            <button
              @click="submit"
              :disabled="!text.trim() && files.length === 0"
              class="p-1.5 bg-blue-500 text-white rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
            ><Send :size="14" /></button>
          </div>
        </div>
      </div>

      <!-- 附件预览标签 -->
      <div v-if="files.length" class="flex flex-wrap gap-1.5 mt-2">
        <div v-for="(f, i) in files" :key="i"
          class="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
        >
          <img v-if="f.previewUrl" :src="f.previewUrl" class="w-5 h-5 rounded object-cover" />
          <Paperclip v-else :size="10" />
          <span class="truncate max-w-[80px]">{{ f.name }}</span>
          <button @click="files.splice(i, 1)" class="text-gray-400 hover:text-gray-600 leading-none text-base">×</button>
        </div>
      </div>

      <p v-if="toast" class="mt-1 text-xs text-red-500">{{ toast }}</p>
      <p class="mt-1 text-xs text-gray-300 text-center">内容由AI生成，请注意甄别</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Image, Paperclip, Mic, Send } from 'lucide-vue-next'
import type { Attachment } from '../../stores/chat'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import QuickActions from '../ui/QuickActions.vue'
import FileUpload from '../ui/FileUpload.vue'

const store = useChatStore()
const chat = useChat()
const text = ref('')
const files = ref<Attachment[]>([])
const toast = ref('')

async function submit() {
  const t = text.value.trim()
  if (!t && files.value.length === 0) return
  toast.value = ''
  const att = [...files.value]
  text.value = ''
  files.value = []
  await chat.send(t, att)
}
</script>
