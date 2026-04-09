<template>
  <div class="flex flex-col items-center w-14 bg-white border-r border-gray-200 py-3 shrink-0 gap-1.5">
    <button
      v-for="(project, idx) in store.projects"
      :key="project.id"
      @click="handleSwitch(project.id)"
      :title="project.name"
      :class="[
        'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-150',
        store.activeProjectId === project.id
          ? 'text-white shadow-sm'
          : 'text-white hover:opacity-90',
        BG_COLORS[idx % BG_COLORS.length]
      ]"
    >{{ initial(project.name) }}</button>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../../stores/chat'
import { useProjects } from '../../composables/useProjects'
import { useChat } from '../../composables/useChat'
import { useAuth } from '../../composables/useAuth'

const BG_COLORS = [
  'bg-teal-500',
  'bg-slate-400',
  'bg-indigo-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-emerald-500',
  'bg-violet-400',
  'bg-cyan-500',
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
  setActive(projectId)
  auth.setRole(projectId)
  chat.newSession()
  const project = store.activeProject()
  if (project) await chat.loadHistory(project.channelId)
}
</script>
