<template>
  <div
    class="flex flex-col items-center w-[72px] bg-white border-r border-gray-100 pt-6 pb-4 shrink-0 h-full overflow-hidden">
    <div class="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-none flex flex-col items-center gap-4">
      <div v-for="(project, idx) in store.projects" :key="project.id"
        class="relative flex items-center justify-center w-full px-2">
        <!-- 活动指示条 -->
        <div v-if="store.activeProjectId === project.id"
          class="absolute left-0 w-1.5 h-8 bg-red-500 rounded-r-full transition-all duration-300" />

        <button @click="handleSwitch(project.id)" :title="project.name" :class="[
          'w-12 h-12 rounded-[18px] flex items-center justify-center text-sm font-bold transition-all duration-200 hover:rounded-[14px] overflow-hidden border',
          store.activeProjectId === project.id
            ? 'text-white shadow-lg shadow-black/10 scale-105 ring-2 ring-red-500 ring-offset-2 border-transparent'
            : 'text-white opacity-90 hover:opacity-100 hover:scale-105 border-blue-100',
          !getAvatarByOrgType(project.orgType) && !project.avatar ? BG_COLORS[idx % BG_COLORS.length] : 'bg-white'
        ]">
          <img v-if="getAvatarByOrgType(project.orgType)" :src="getAvatarByOrgType(project.orgType)!"
            class="w-full h-full object-cover" />
          <img v-else-if="project.avatar" :src="project.avatar" class="w-full h-full object-cover" />
          <span v-else>{{ initial(project.name) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../../stores/chat'
import { useProjects } from '../../composables/useProjects'
import { useChat } from '../../composables/useChat'
import { useAuth } from '../../composables/useAuth'
import { getAvatarByOrgType } from '../../utils/avatar'

const BG_COLORS = [
  'bg-teal-500',
  'bg-slate-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-cyan-600',
]

const store = useChatStore()
const { setActive } = useProjects()
const chat = useChat()
const auth = useAuth()

function initial(name: string) {
  return name.slice(0, 1).toUpperCase()
}

async function handleSwitch(projectId: string) {
  if (store.activeProjectId === projectId) return
  // 切换前清空旧用户的消息和会话状态，避免显示上个用户的聊天记录
  store.messages = []
  store.sessions = []
  store.activeSessionId = ''
  setActive(projectId)
  await auth.switchRole(projectId)
  await chat.loadSessions()
  if (!store.activeSessionId) {
    chat.newSession()
  } else {
    await chat.loadSession(store.activeSessionId)
  }
}
</script>

<style scoped>
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
