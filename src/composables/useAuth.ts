import { ref, computed } from 'vue'

export interface Role {
  roleId: string
  roleName: string
  token: string
  channelId: string
}

const STORAGE_KEY = 'jclaw_auth'

// 模块级单例
const roles = ref<Role[]>([])
const currentRoleId = ref<string>('')
const isLoggedIn = ref(false)

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data: { roles: Role[]; currentRoleId: string } = JSON.parse(raw)
    if (data.roles?.length) {
      roles.value = data.roles
      currentRoleId.value = data.currentRoleId || data.roles[0].roleId
      isLoggedIn.value = true
    }
  } catch { /* ignore */ }
}

restore()

export function useAuth() {
  const currentRole = computed(() =>
    roles.value.find(r => r.roleId === currentRoleId.value) ?? null
  )

  async function login(username: string, password: string) {
    const url = (import.meta.env.VITE_LOGIN_API_URL as string | undefined) ?? '/api/login'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error(`登录失败 (${res.status})`)
    const json = await res.json()
    // 兼容 { code, data: { roles } } 和 { roles } 两种格式
    const data = json.data ?? json
    const list: Role[] = data.roles ?? []
    if (!list.length) throw new Error('未获取到角色信息')
    roles.value = list
    currentRoleId.value = list[0].roleId
    isLoggedIn.value = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roles: list, currentRoleId: list[0].roleId }))
  }

  function setRole(roleId: string) {
    currentRoleId.value = roleId
    const stored = { roles: roles.value, currentRoleId: roleId }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }

  function logout() {
    roles.value = []
    currentRoleId.value = ''
    isLoggedIn.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return { isLoggedIn, roles, currentRole, login, setRole, logout }
}
