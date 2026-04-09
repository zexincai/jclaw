<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200">
    <!-- 搜索框 -->
    <div class="p-3 border-b border-gray-100 shrink-0">
      <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
        <Search :size="13" class="text-gray-400 shrink-0" />
        <input
          v-model="searchQuery"
          placeholder="搜索"
          class="flex-1 bg-transparent text-xs text-gray-600 outline-none placeholder-gray-400 min-w-0"
        />
      </div>
    </div>

    <!-- 会话列表 -->
    <div class="flex-1 overflow-y-auto py-2 scrollbar-hide">
      <template v-for="[label, group] in filteredGroups" :key="label">
        <!-- 分组标题行 -->
        <div
          class="flex items-center justify-between px-3 pt-2 pb-1 cursor-pointer hover:bg-gray-50 select-none"
          @click="toggleGroup(label)"
        >
          <span class="text-xs text-gray-400 font-medium">{{ label }}</span>
          <ChevronDown
            :size="12"
            :class="['text-gray-300 transition-transform duration-150', collapsed.has(label) ? '-rotate-90' : '']"
          />
        </div>
        <!-- 会话条目 -->
        <template v-if="!collapsed.has(label)">
          <div
            v-for="session in group"
            :key="session.id"
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
      </template>

      <div v-if="filteredGroups.length === 0" class="px-4 py-6 text-xs text-gray-300 text-center">
        {{ searchQuery ? '无匹配会话' : '暂无会话' }}
      </div>
    </div>

    <!-- 底部：用量 + 设置 -->
    <div class="p-3 border-t border-gray-100 shrink-0">
      <UsageBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, ChevronDown, Trash2 } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import UsageBar from '../ui/UsageBar.vue'

const store = useChatStore()
const chat = useChat()

const searchQuery = ref('')
const collapsed = ref(new Set<string>())

function toggleGroup(label: string) {
  if (collapsed.value.has(label)) {
    collapsed.value.delete(label)
  } else {
    collapsed.value.add(label)
  }
}

const groupedSessions = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const groups: Record<string, typeof store.sessions> = { '今天': [], '本周': [], '本月': [] }

  for (const s of store.sessionsByProject(store.activeProjectId)) {
    const d = new Date(s.createdAt)
    if (d >= today) groups['今天'].push(s)
    else if (d >= weekAgo) groups['本周'].push(s)
    else if (d >= monthStart) groups['本月'].push(s)
    else {
      const label = `${d.getFullYear() === now.getFullYear() ? '' : d.getFullYear() + '年'}${d.getMonth() + 1}月`
      if (!groups[label]) groups[label] = []
      groups[label].push(s)
    }
  }
  return Object.entries(groups).filter(([, v]) => v.length > 0)
})

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return groupedSessions.value
  return groupedSessions.value
    .map(([label, sessions]) => [label, sessions.filter(s => s.title.toLowerCase().includes(q))] as [string, typeof sessions])
    .filter(([, sessions]) => sessions.length > 0)
})
</script>
