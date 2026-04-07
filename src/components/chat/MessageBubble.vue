<template>
  <!-- 用户消息：右对齐粉色气泡 -->
  <div v-if="message.role === 'user'" class="flex justify-end mb-3">
    <div class="max-w-[75%] flex flex-col items-end gap-1">
      <!-- 附件缩略图（图片） -->
      <div v-if="message.attachments?.length" class="flex flex-wrap gap-1 justify-end">
        <template v-for="att in message.attachments" :key="att.name">
          <img
            v-if="att.mimeType.startsWith('image/')"
            :src="`data:${att.mimeType};base64,${att.data}`"
            class="max-w-[160px] max-h-[120px] rounded-lg object-cover border border-gray-200"
            :alt="att.name"
          />
          <div
            v-else
            class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
          >
            <Paperclip :size="10" />{{ att.name }}
          </div>
        </template>
      </div>
      <!-- 文字气泡 -->
      <div v-if="message.content" class="px-4 py-2.5 bg-pink-100 rounded-2xl rounded-tr-sm text-sm text-gray-800">
        {{ message.content }}
      </div>
      <div v-if="message.status === 'error'" class="flex items-center gap-1 text-xs text-red-500">
        <AlertCircle :size="10" /> 发送失败
        <button @click="emit('retry')" class="underline">重试</button>
      </div>
    </div>
  </div>

  <!-- AI 消息：左对齐白色卡片 -->
  <div v-else class="flex flex-col mb-4 max-w-[85%]">
    <div class="flex items-center gap-1.5 mb-1 ml-1">
      <span class="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
        {{ projectName }}
      </span>
    </div>
    <div class="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
      <ThinkingBlock v-if="message.thinking" :content="message.thinking" />
      <div class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
        {{ message.content }}
        <span
          v-if="message.status === 'streaming'"
          class="inline-block w-0.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-middle"
        />
      </div>
      <ActionCard
        v-if="message.actionJson && !message.actionJson.autoOpen"
        :modal="message.actionJson.modal"
        @trigger="emit('open-modal', message.actionJson!)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, Paperclip } from 'lucide-vue-next'
import type { Message, ActionPayload } from '../../stores/chat'
import { useChatStore } from '../../stores/chat'
import ThinkingBlock from './ThinkingBlock.vue'
import ActionCard from './ActionCard.vue'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{ retry: []; 'open-modal': [action: ActionPayload] }>()

const store = useChatStore()
const projectName = computed(() => store.activeProject()?.name ?? '')
</script>
