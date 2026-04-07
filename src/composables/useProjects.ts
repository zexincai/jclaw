import { computed } from 'vue'
import { useChatStore } from '../stores/chat'
import type { Project } from '../stores/chat'

const STORAGE_KEY = 'jclaw_projects'

function defaultProjects(): Project[] {
  return [{ id: 'all', name: '全部', channelId: 'default' }]
}

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultProjects()
  } catch { return defaultProjects() }
}

function save(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function useProjects() {
  const store = useChatStore()

  function init() {
    store.projects = load()
    if (!store.activeProjectId) {
      store.activeProjectId = store.projects[0]?.id ?? ''
    }
  }

  function setActive(projectId: string) {
    store.activeProjectId = projectId
  }

  function addProject(name: string, channelId: string) {
    const p: Project = { id: crypto.randomUUID(), name, channelId }
    store.projects.push(p)
    save(store.projects)
  }

  function removeProject(id: string) {
    store.projects = store.projects.filter(p => p.id !== id)
    save(store.projects)
    if (store.activeProjectId === id) {
      store.activeProjectId = store.projects[0]?.id ?? ''
    }
  }

  const activeProject = computed(() => store.activeProject())

  return { init, setActive, addProject, removeProject, activeProject }
}
