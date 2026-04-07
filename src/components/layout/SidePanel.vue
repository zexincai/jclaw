<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200">
    <div class="p-3 border-b border-gray-100 shrink-0">
      <button
        @click="chat.newSession()"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Plus :size="14" /> 新对话
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-2">
      <template v-for="(group, label) in groupedSessions" :key="label">
        <div class="px-3 pt-2 pb-1 text-xs text-gray-400 font-medium">{{ label }}</div>
        <div
          v-for="session in group" :key="session.id"
          @click="chat.loadSession(session.id)"
          class="group relative flex items-center px-3 py-2 mx-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-100': session.id === store.activeSessionId }"
        >
          <span class="flex-1 text-sm text-gray-700 truncate pr-2">{{ session.title }}</span>
          <button
            @click.stop="chat.deleteSession(session.id)"
            class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all shrink-0"
          ><Trash2 :size="12" /></button>
        </div>
      </template>
      <div v-if="Object.keys(groupedSessions).length === 0" class="px-4 py-6 text-xs text-gray-300 text-center">
        暂无会话
      </div>
    </div>

    <div class="p-3 border-t border-gray-100 shrink-0">
      <UsageBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import UsageBar from '../ui/UsageBar.vue'

const store = useChatStore()
const chat = useChat()

const groupedSessions = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const week = new Date(today); week.setDate(today.getDate() - 7)
  const month = new Date(now.getFullYear(), now.getMonth(), 1)
  const groups: Record<string, typeof store.sessions> = { '今天': [], '本周': [], '本月': [] }

  for (const s of store.sessionsByProject(store.activeProjectId)) {
    const d = new Date(s.createdAt)
    if (d >= today) groups['今天'].push(s)
    else if (d >= week) groups['本周'].push(s)
    else if (d >= month) groups['本月'].push(s)
    else {
      const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
      if (!groups[label]) groups[label] = []
      groups[label].push(s)
    }
  }
  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0))
})
</script>
