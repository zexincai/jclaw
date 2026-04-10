import { ref, computed } from 'vue'
import { mobileLoginApi } from '../api/login'

export interface Role {
  roleId: string
  roleName: string
  token: string
  channelId: string
  systemPrompt?: string
}

const STORAGE_KEY = 'jclaw_auth'

// 模块级单例
const roles = ref<Role[]>([])
const currentRoleId = ref<string>('')
const isLoggedIn = ref(false)

// mock 模式下各角色的 systemPrompt 补全表（兼容旧缓存）
const MOCK_PROMPTS: Record<string, string> = {
  role_pm:    '你是建筑工程行业高级项目经理，精通项目进度管控、成本管理与质量安全管理。用专业、简洁的语言回答问题，不需要说明自己的身份。',
  role_cost:  '你是建筑工程行业成本主管，擅长工程量清单、合同管理与造价分析。用专业、简洁的语言回答问题，不需要说明自己的身份。',
  role_admin: '你是建筑工程信息化系统管理员，负责系统配置与用户权限管理。',
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data: { roles: Role[]; currentRoleId: string } = JSON.parse(raw)
    if (data.roles?.length) {
      // mock 模式下自动补全旧缓存中缺失的 systemPrompt
      if (import.meta.env.VITE_MOCK_LOGIN === 'true') {
        data.roles = data.roles.map(r => ({
          ...r,
          systemPrompt: r.systemPrompt ?? MOCK_PROMPTS[r.roleId],
        }))
      }
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
    // ── Mock 模式（无后端时使用）──────────────────────────────────
    if (import.meta.env.VITE_MOCK_LOGIN === 'true') {
      await new Promise(r => setTimeout(r, 800)) // 模拟网络延迟
      if (username !== 'admin' || password !== '123456') {
        throw new Error('用户名或密码错误（mock: admin / 123456）')
      }
      const list: Role[] = [
        { roleId: 'role_pm',    roleName: '项目经理',   token: 'mock_token_pm',    channelId: 'ch_001', systemPrompt: '你是建筑工程行业高级项目经理，精通项目进度管控、成本管理与质量安全管理。用专业、简洁的语言回答问题，不需要说明自己的身份。' },
        { roleId: 'role_cost',  roleName: '成本主管',   token: 'mock_token_cost',  channelId: 'ch_002', systemPrompt: '你是建筑工程行业成本主管，擅长工程量清单、合同管理与造价分析。用专业、简洁的语言回答问题，不需要说明自己的身份。' },
        { roleId: 'role_admin', roleName: '系统管理员', token: 'mock_token_admin', channelId: 'ch_003', systemPrompt: '你是建筑工程信息化系统管理员，负责系统配置与用户权限管理。' },
      ]
      roles.value = list
      currentRoleId.value = list[0].roleId
      isLoggedIn.value = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ roles: list, currentRoleId: list[0].roleId }))
      return
    }
    // ─────────────────────────────────────────────────────────────

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

  async function loginByMobile(phoneNumber: string, code: string, uuid: string) {
    const data = (await mobileLoginApi({ phoneNumber, code, uuid })) as any
    const list: Role[] = data.roles ?? []
    if (!list.length) throw new Error('未获取到角色信息')
    roles.value = list
    currentRoleId.value = list[0].roleId
    isLoggedIn.value = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roles: list, currentRoleId: list[0].roleId }))
  }

  return { isLoggedIn, roles, currentRole, login, loginByMobile, setRole, logout }
}
