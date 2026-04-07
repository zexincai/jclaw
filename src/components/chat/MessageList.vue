<template>
  <div ref="listEl" class="overflow-y-auto px-4 py-4 space-y-1">
    <!-- 重连 / 断连横幅 -->
    <div
      v-if="store.wsStatus === 'disconnected' && !store.wsMaxRetries"
      class="sticky top-0 z-10 mb-3 py-1.5 px-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 text-center"
    >
      连接断开，正在重连…
    </div>
    <div
      v-if="store.wsMaxRetries"
      class="sticky top-0 z-10 mb-3 py-1.5 px-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center"
    >
      无法连接，请检查 OpenClaw 是否运行
    </div>

    <!-- Agent 运行状态条 -->
    <div
      v-if="store.agentRunning"
      class="sticky top-0 z-10 mb-3 py-1.5 px-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600 text-center"
    >
      JClaw 正在与业务界面交互中…
    </div>

    <MessageBubble
      v-for="msg in store.activeSessionMessages()"
      :key="msg.id"
      :message="msg"
      @retry="chat.send(msg.content, msg.attachments)"
      @open-modal="(action) => bridge.openModal(action.modal, action.data)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import { useIframeBridge } from '../../composables/useIframeBridge'
import MessageBubble from './MessageBubble.vue'

const store = useChatStore()
const chat = useChat()
const bridge = useIframeBridge()
const listEl = ref<HTMLDivElement | null>(null)

watch(() => store.messages.length, async () => {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
})
</script>
