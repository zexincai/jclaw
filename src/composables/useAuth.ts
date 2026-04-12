import { ref, computed } from 'vue'
import { aiSysLoginPc, switchLogin } from '../api/auth'
export interface Role {
  userId: string
  loginName: string
  telephone: string
  isMaster: number
  pastStatus: number
  orgType: number
  orgTypeName: string
  orgName: string
  avatar?: string
  userRolePrompt?: string
  authStatusVo?: {
    mobile: string
    checkStatus: number
  }
}

const AUTH_STORAGE_KEY = 'jclaw_auth'
const TOKEN_STORAGE_KEY = 'jclaw_token'

// 模块级单例
const roles = ref<Role[]>([])
const currentRoleId = ref<string>('')
const token = ref<string>('')
const isLoggedIn = ref(false)

// mock 模式下各角色的 systemPrompt 补全表（不活跃）

function restore() {
  try {
    const rawAuth = localStorage.getItem(AUTH_STORAGE_KEY)
    token.value = localStorage.getItem(TOKEN_STORAGE_KEY) || ''

    if (!rawAuth) return
    const data: { roles: Role[]; currentRoleId: string } = JSON.parse(rawAuth)
    if (data.roles?.length) {
      roles.value = data.roles
      currentRoleId.value = data.currentRoleId || data.roles[0].userId
      isLoggedIn.value = !!token.value

      // 如果当前已登录但缺失 last_phone，则根据当前角色恢复它以保证 deviceId 稳定性
      if (isLoggedIn.value && !localStorage.getItem('jclaw_last_phone')) {
        const role = data.roles.find(r => r.userId === currentRoleId.value) || data.roles[0]
        if (role.telephone) {
          localStorage.setItem('jclaw_last_phone', role.telephone)
        }
      }
    }
  } catch { /* ignore */ }
}

restore()

export function useAuth() {
  const currentRole = computed(() =>
    roles.value.find(r => r.userId === currentRoleId.value) ?? null
  )

  async function login(username: string, password: string) {
    // ── Mock 模式（无后端时使用）──────────────────────────────────
    if (import.meta.env.VITE_MOCK_LOGIN === 'true') {
      await new Promise(r => setTimeout(r, 800)) // 模拟网络延迟
      if (username !== 'admin' || password !== '123456') {
        throw new Error('用户名或密码错误（mock: admin / 123456）')
      }
      const userList: Role[] = [
        { userId: 'role_pm', loginName: '项目经理', telephone: '18000000001', isMaster: 1, pastStatus: 1, orgType: 1, orgTypeName: '项目部', orgName: '演示项目部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', userRolePrompt: '你是建筑工程行业高级项目经理，精通项目进度管控、成本管理与质量安全管理。用专业、简洁的语言回答问题，不需要说明自己的身份。' },
        { userId: 'role_cost', loginName: '成本主管', telephone: '18000000002', isMaster: 0, pastStatus: 1, orgType: 1, orgTypeName: '项目部', orgName: '演示项目部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', userRolePrompt: '你是建筑工程行业成本主管，擅长工程量清单、合同管理与造价分析。用专业、简洁的语言回答问题，不需要说明自己的身份。' },
        { userId: 'role_admin', loginName: '系统管理员', telephone: '18000000003', isMaster: 1, pastStatus: 1, orgType: 1, orgTypeName: '运营单位', orgName: '建网科技', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', userRolePrompt: '你是建筑工程信息化系统管理员，负责系统配置与用户权限管理。' },
      ]
      const accessToken = 'mock_access_token'
      roles.value = userList
      currentRoleId.value = userList[0].userId
      token.value = accessToken
      isLoggedIn.value = true
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ roles: userList, currentRoleId: userList[0].userId }))
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
    // 兼容 { code, data: { access_token, userList } } 和 { access_token, userList } 两种格式
    const data = json.data ?? json
    const accessToken = data.access_token
    const userList: Role[] = data.userList ?? []

    if (!accessToken) throw new Error('未获取到登录令牌')
    if (!userList.length) throw new Error('未获取到账户信息')

    token.value = accessToken
    roles.value = userList
    currentRoleId.value = userList[0].userId
    isLoggedIn.value = true

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ roles: userList, currentRoleId: userList[0].userId }))
  }

  function setRole(roleId: string) {
    currentRoleId.value = roleId
    const stored = { roles: roles.value, currentRoleId: roleId }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored))
  }

  async function switchRole(roleId: string) {
    const role = roles.value.find(r => r.userId === roleId)

    if (!role) {
      throw new Error(`角色 ${roleId} 不存在`)
    }
    const phoneNumber = localStorage.getItem('jclaw_last_phone') || roles.value[0]?.telephone || ''
    console.log('switching role:', role)
    const res = (await switchLogin({ phoneNumber, pkId: role.userId as any, sourceType: 3 })) as any
    const data = res.data ?? res
    const newToken = data.access_token
    if (newToken) {
      token.value = newToken
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    }
    setRole(roleId)
  }

  function logout() {
    roles.value = []
    currentRoleId.value = ''
    token.value = ''
    isLoggedIn.value = false
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem('jclaw_last_phone')
  }

  async function loginByMobile(phoneNumber: string, code: string, uuid: string) {
    // 立即设置上一次手机号，以便请求拦截器能生成正确的 deterministic deviceId
    localStorage.setItem('jclaw_last_phone', phoneNumber)

    const res = (await aiSysLoginPc({ phoneNumber, code, forceType: 1, uuid, sourceType: 3, operateSource: 2 })) as any
    const data = res.data ?? res
    const accessToken = data.access_token
    const userList: Role[] = data.userList ?? []

    if (!accessToken) throw new Error('未获取到登录令牌')
    if (!userList.length) throw new Error('未获取到账户信息')

    token.value = accessToken
    roles.value = userList
    currentRoleId.value = userList[0].userId
    isLoggedIn.value = true

    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ roles: userList, currentRoleId: userList[0].userId }))
    localStorage.setItem('jclaw_last_phone', phoneNumber)
  }

  return { isLoggedIn, roles, currentRole, token, login, loginByMobile, setRole, switchRole, logout }
}
