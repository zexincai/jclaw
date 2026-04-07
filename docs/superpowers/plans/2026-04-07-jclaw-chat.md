# JClaw 聊天系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建 JClaw Web 聊天界面，通过 WebSocket 与本地 OpenClaw 通信，支持流式回复、项目切换、会话历史、iframe 业务联动和 Token 用量显示。

**Architecture:** Vue 3 SPA 直连本地 OpenClaw WebSocket（ws://127.0.0.1:18789），左栏聊天界面 + 右栏 iframe 业务系统，通过 postMessage 双向通信。所有 WS 逻辑封装在 composable 中，Pinia 管理全局状态。

**Tech Stack:** Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS v3 + lucide-vue-next

**Spec:** `docs/superpowers/specs/2026-04-07-jclaw-chat-design.md`

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `vite.config.ts` | Vite 配置 |
| `tailwind.config.js` | Tailwind content 路径 |
| `postcss.config.js` | PostCSS 插件 |
| `.env.example` | 环境变量模板 |
| `src/main.ts` | 应用启动，注册 Pinia |
| `src/App.vue` | 根组件，WS 初始化，三栏布局 |
| `src/stores/chat.ts` | Pinia store：projects / sessions / messages / wsStatus / usage |
| `src/composables/useWebSocket.ts` | WS 生命周期：连接、重连退避、发帧、事件分发 |
| `src/composables/useChat.ts` | send()、流式追加、历史拉取、JSON action 解析 |
| `src/composables/useProjects.ts` | 项目列表 CRUD、activeProject、localStorage 持久化 |
| `src/composables/useUsage.ts` | sessions.usage 查询、heartbeat 监听 |
| `src/composables/useIframeBridge.ts` | postMessage 发送/接收，openModal() |
| `src/config/quickActions.ts` | 快捷按钮定义 |
| `src/components/layout/TopBar.vue` | 顶部项目标签栏 + WS 状态指示 |
| `src/components/layout/SidePanel.vue` | 左侧会话历史面板（分组 + 删除） |
| `src/components/layout/ChatArea.vue` | 左栏聊天主区域（组合 MessageList + InputBar） |
| `src/components/layout/BusinessPanel.vue` | 右栏 iframe 容器 + autoOpen 监听 |
| `src/components/chat/MessageList.vue` | 滚动消息流 + 状态条 |
| `src/components/chat/MessageBubble.vue` | 单条消息气泡（用户/AI） |
| `src/components/chat/ThinkingBlock.vue` | 可折叠思考块 |
| `src/components/chat/ActionCard.vue` | AI 内联操作卡片（手动触发弹窗） |
| `src/components/chat/InputBar.vue` | 底部输入栏（文本、附件、快捷、发送） |
| `src/components/ui/QuickActions.vue` | 快捷功能按钮组 |
| `src/components/ui/FileUpload.vue` | 文件上传（base64、大小校验） |
| `src/components/ui/UsageBar.vue` | Token 用量显示条 |

---

## Task 1：项目初始化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `.env.example`

- [ ] **Step 1：初始化 Vite + Vue 3 项目**

```bash
cd /Users/lion/Documents/learn/app-jw
npm create vite@latest . -- --template vue-ts
```

- [ ] **Step 2：安装依赖**

```bash
npm install
npm install pinia lucide-vue-next
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3：配置 Tailwind**

编辑 `tailwind.config.js` 全部替换为：
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4：引入 Tailwind 到 CSS**

替换 `src/style.css` 全部内容为：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 5：创建环境变量模板**

创建 `.env.example`：
```
VITE_OPENCLAW_WS_URL=ws://127.0.0.1:18789
VITE_OPENCLAW_TOKEN=your_token_here
VITE_BUSINESS_SYSTEM_ORIGIN=http://localhost:5174
```

```bash
cp .env.example .env.local
# 然后编辑 .env.local，填入真实 token
```

- [ ] **Step 6：确认启动正常**

```bash
npm run dev
```

预期：浏览器打开 `http://localhost:5173`，显示默认 Vue 页面，无报错。

- [ ] **Step 7：初始化 git 并提交**

```bash
git init
git add .
git commit -m "feat: 初始化 Vue 3 + Vite + Tailwind + Pinia 项目"
```

---

## Task 2：Pinia Store

**Files:**
- Create: `src/stores/chat.ts`
- Modify: `src/main.ts`

- [ ] **Step 1：注册 Pinia**

替换 `src/main.ts`：
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

- [ ] **Step 2：创建 store**

创建 `src/stores/chat.ts`：
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Project {
  id: string
  name: string
  channelId: string
}

export interface Session {
  id: string
  projectId: string
  title: string
  createdAt: string
}

export interface ActionPayload {
  action: 'open_modal'
  modal: string
  data: Record<string, unknown>
  autoOpen: boolean
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  actionJson?: ActionPayload
  status: 'sending' | 'streaming' | 'done' | 'error'
  createdAt: string
}

export interface UsageStats {
  inputTokens: number
  outputTokens: number
  totalCostUsd: number
  contextUsedPct: number
  lastUpdated: string
}

export const useChatStore = defineStore('chat', () => {
  const projects = ref<Project[]>([])
  const activeProjectId = ref<string>('')
  const sessions = ref<Session[]>([])
  const activeSessionId = ref<string>('')
  const messages = ref<Message[]>([])
  const wsStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const agentRunning = ref(false)
  const usage = ref<UsageStats | null>(null)

  function activeProject() {
    return projects.value.find(p => p.id === activeProjectId.value) ?? null
  }

  function activeSessionMessages() {
    return messages.value.filter(m => m.sessionId === activeSessionId.value)
  }

  function sessionsByProject(projectId: string) {
    return sessions.value.filter(s => s.projectId === projectId)
  }

  return {
    projects, activeProjectId, sessions, activeSessionId,
    messages, wsStatus, agentRunning, usage,
    activeProject, activeSessionMessages, sessionsByProject,
  }
})
```

- [ ] **Step 3：提交**

```bash
git add src/stores/chat.ts src/main.ts
git commit -m "feat: 添加 Pinia store 数据模型"
```

---

## Task 3：WebSocket Composable

**Files:**
- Create: `src/composables/useWebSocket.ts`

- [ ] **Step 1：创建 composable**

创建 `src/composables/useWebSocket.ts`：
```typescript
import { ref, onUnmounted } from 'vue'

type WsStatus = 'connecting' | 'connected' | 'disconnected'
type EventHandler = (payload: unknown) => void

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]
const MAX_RETRIES = 10

export function useWebSocket() {
  const status = ref<WsStatus>('disconnected')
  let ws: WebSocket | null = null
  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let shouldReconnect = true
  let savedToken = ''
  let savedUrl = ''
  const handlers = new Map<string, Set<EventHandler>>()
  const pendingRequests = new Map<string, (res: unknown) => void>()

  function on(event: string, handler: EventHandler) {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
    return () => handlers.get(event)?.delete(handler)
  }

  function emit(event: string, payload: unknown) {
    handlers.get(event)?.forEach(h => h(payload))
  }

  function send(frame: object) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame))
    }
  }

  function request(method: string, params: object = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      pendingRequests.set(id, resolve)
      send({ type: 'req', id, method, params })
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id)
          reject(new Error(`Request timeout: ${method}`))
        }
      }, 15000)
    })
  }

  function connect(token: string, url: string) {
    savedToken = token
    savedUrl = url
    shouldReconnect = true
    if (ws) { ws.onclose = null; ws.close() }
    status.value = 'connecting'

    ws = new WebSocket(url)

    ws.onopen = () => {
      send({ type: 'connect', params: { auth: { token } } })
    }

    ws.onmessage = (e) => {
      let frame: Record<string, unknown>
      try { frame = JSON.parse(e.data) } catch { return }

      if (frame.type === 'res') {
        const id = frame.id as string
        const resolve = pendingRequests.get(id)
        if (resolve) { resolve(frame); pendingRequests.delete(id) }
        return
      }

      if (frame.type === 'event') {
        const ev = frame.event as string
        if (ev === 'hello-ok' || ev === 'connect-ok') {
          status.value = 'connected'
          retryCount = 0
          emit('connected', frame.payload)
        } else {
          emit(ev, frame.payload)
        }
      }
    }

    ws.onclose = (e) => {
      status.value = 'disconnected'
      ws = null

      if (e.code === 4001) { emit('auth-error', { code: e.code }); return }

      if (shouldReconnect && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]
        emit('reconnecting', { attempt: retryCount + 1 })
        retryTimer = setTimeout(() => connect(savedToken, savedUrl), delay)
        retryCount++
      } else if (retryCount >= MAX_RETRIES) {
        emit('max-retries', {})
      }
    }

    ws.onerror = () => { /* onclose handles retry */ }
  }

  function disconnect() {
    shouldReconnect = false
    if (retryTimer) clearTimeout(retryTimer)
    ws?.close()
  }

  onUnmounted(() => disconnect())

  return { status, send, request, on, connect, disconnect }
}
```

- [ ] **Step 2：提交**

```bash
git add src/composables/useWebSocket.ts
git commit -m "feat: 添加 useWebSocket（连接、重连退避、req/res 关联、事件分发）"
```

---

## Task 4：useProjects + quickActions

**Files:**
- Create: `src/composables/useProjects.ts`, `src/config/quickActions.ts`

- [ ] **Step 1：创建快捷按钮配置**

创建 `src/config/quickActions.ts`：
```typescript
export interface QuickAction {
  id: string
  label: string
  message: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'todo',    label: '待办事项', message: '显示我的待办事项' },
  { id: 'record',  label: '录入资料', message: '我要录入资料' },
  { id: 'query',   label: '查询记录', message: '查询记录' },
  { id: 'summary', label: '汇总数据', message: '汇总数据' },
]
```

- [ ] **Step 2：创建 useProjects**

创建 `src/composables/useProjects.ts`：
```typescript
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
```

- [ ] **Step 3：提交**

```bash
git add src/composables/useProjects.ts src/config/quickActions.ts
git commit -m "feat: 添加 useProjects 和快捷按钮配置"
```

---

## Task 5：useChat Composable

**Files:**
- Create: `src/composables/useChat.ts`

- [ ] **Step 1：创建 useChat**

创建 `src/composables/useChat.ts`：
```typescript
import { useChatStore } from '../stores/chat'
import type { Message, ActionPayload } from '../stores/chat'
import type { useWebSocket } from './useWebSocket'

type WS = ReturnType<typeof useWebSocket>

function extractAction(content: string): ActionPayload | undefined {
  const match = content.match(/```json\s*([\s\S]*?)```/)
  if (!match) return undefined
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.action === 'open_modal') return parsed as ActionPayload
  } catch { /* ignore */ }
  return undefined
}

function stripActionJson(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim()
}

function persistMessage(msg: Message) {
  const key = `jclaw_msgs_${msg.sessionId}`
  try {
    const existing: Message[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    const idx = existing.findIndex(m => m.id === msg.id)
    if (idx >= 0) existing[idx] = msg; else existing.push(msg)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch { /* ignore */ }
}

export function useChat(ws: WS) {
  const store = useChatStore()
  let streamingId: string | null = null
  let streamingContent = ''
  let streamingThinking = ''

  ws.on('thinking', (payload: unknown) => {
    const p = payload as { text: string }
    streamingThinking += p.text
    if (streamingId) {
      const msg = store.messages.find(m => m.id === streamingId)
      if (msg) msg.thinking = streamingThinking
    }
  })

  ws.on('chat', (payload: unknown) => {
    const p = payload as { delta?: string; done?: boolean }

    if (!streamingId) {
      const msg: Message = {
        id: crypto.randomUUID(),
        sessionId: store.activeSessionId,
        role: 'assistant',
        content: '',
        thinking: streamingThinking || undefined,
        status: 'streaming',
        createdAt: new Date().toISOString(),
      }
      store.messages.push(msg)
      streamingId = msg.id
    }

    if (p.delta) {
      streamingContent += p.delta
      const msg = store.messages.find(m => m.id === streamingId)
      if (msg) msg.content = streamingContent
    }

    if (p.done) {
      const msg = store.messages.find(m => m.id === streamingId)
      if (msg) {
        const action = extractAction(streamingContent)
        msg.actionJson = action
        msg.content = action ? stripActionJson(streamingContent) : streamingContent
        msg.thinking = streamingThinking || undefined
        msg.status = 'done'
        persistMessage(msg)
        // 触发 autoOpen
        if (action?.autoOpen) {
          window.dispatchEvent(new CustomEvent('jclaw:open-modal', {
            detail: { modal: action.modal, data: action.data }
          }))
        }
      }
      streamingId = null
      streamingContent = ''
      streamingThinking = ''
    }
  })

  ws.on('agent', (payload: unknown) => {
    const p = payload as { status: string }
    store.agentRunning = p.status === 'running'
  })

  ws.on('reconnecting', () => {
    if (streamingId) {
      const msg = store.messages.find(m => m.id === streamingId)
      if (msg) msg.status = 'error'
      streamingId = null; streamingContent = ''; streamingThinking = ''
    }
  })

  function ensureSession() {
    if (!store.activeSessionId) newSession()
  }

  function newSession() {
    const project = store.activeProject()
    if (!project) return
    const session = {
      id: crypto.randomUUID(),
      projectId: project.id,
      title: '新对话',
      createdAt: new Date().toISOString(),
    }
    store.sessions.unshift(session)
    store.activeSessionId = session.id
  }

  async function send(text: string, attachments: Array<{ name: string; mimeType: string; data: string }> = []) {
    const project = store.activeProject()
    if (!project) return
    ensureSession()

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sessionId: store.activeSessionId,
      role: 'user',
      content: text,
      status: 'sending',
      createdAt: new Date().toISOString(),
    }
    store.messages.push(userMsg)
    persistMessage(userMsg)

    // 用首条消息更新会话标题
    const session = store.sessions.find(s => s.id === store.activeSessionId)
    if (session?.title === '新对话') session.title = text.slice(0, 20)

    try {
      const res = await ws.request('chat.send', {
        message: text,
        channelId: project.channelId,
        ...(attachments.length ? { attachments } : {}),
      }) as { ok: boolean }
      userMsg.status = res.ok ? 'done' : 'error'
      persistMessage(userMsg)
    } catch {
      userMsg.status = 'error'
      persistMessage(userMsg)
    }
  }

  async function loadHistory(channelId: string) {
    try {
      const res = await ws.request('chat.history', { channelId }) as {
        ok: boolean
        payload?: { messages: Array<{ role: string; content: string; id: string; createdAt: string }> }
      }
      if (!res.ok || !res.payload?.messages) return
      const sessionId = store.activeSessionId
      const msgs: Message[] = res.payload.messages.map(m => ({
        id: m.id, sessionId, role: m.role as 'user' | 'assistant',
        content: m.content, status: 'done' as const, createdAt: m.createdAt,
      }))
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
    } catch { /* ignore */ }
  }

  function loadSession(sessionId: string) {
    store.activeSessionId = sessionId
    const key = `jclaw_msgs_${sessionId}`
    try {
      const msgs: Message[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      store.messages = store.messages.filter(m => m.sessionId !== sessionId).concat(msgs)
    } catch { /* ignore */ }
  }

  function deleteSession(sessionId: string) {
    store.sessions = store.sessions.filter(s => s.id !== sessionId)
    store.messages = store.messages.filter(m => m.sessionId !== sessionId)
    localStorage.removeItem(`jclaw_msgs_${sessionId}`)
    if (store.activeSessionId === sessionId) {
      store.activeSessionId = store.sessions[0]?.id ?? ''
    }
  }

  return { send, loadHistory, newSession, loadSession, deleteSession }
}
```

- [ ] **Step 2：提交**

```bash
git add src/composables/useChat.ts
git commit -m "feat: 添加 useChat（流式、乐观插入、action 解析、autoOpen 事件）"
```

---

## Task 6：useUsage + useIframeBridge

**Files:**
- Create: `src/composables/useUsage.ts`, `src/composables/useIframeBridge.ts`

- [ ] **Step 1：创建 useUsage**

创建 `src/composables/useUsage.ts`：
```typescript
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import type { useWebSocket } from './useWebSocket'

type WS = ReturnType<typeof useWebSocket>

export function useUsage(ws: WS) {
  const store = useChatStore()
  const loading = ref(false)

  async function refresh() {
    if (loading.value || ws.status.value !== 'connected') return
    loading.value = true
    try {
      const res = await ws.request('sessions.usage', {}) as {
        ok: boolean
        payload?: { inputTokens: number; outputTokens: number; totalCostUsd: number; contextUsedPct: number }
      }
      if (res.ok && res.payload) {
        store.usage = { ...res.payload, lastUpdated: new Date().toISOString() }
      }
    } catch { /* ignore */ }
    finally { loading.value = false }
  }

  ws.on('heartbeat', (payload: unknown) => {
    const p = payload as Record<string, unknown>
    if (typeof p?.inputTokens === 'number' && store.usage) {
      store.usage = {
        ...store.usage,
        inputTokens: p.inputTokens as number,
        outputTokens: (p.outputTokens as number) ?? store.usage.outputTokens,
        lastUpdated: new Date().toISOString(),
      }
    }
  })

  ws.on('connected', () => refresh())

  return { refresh, loading }
}
```

- [ ] **Step 2：创建 useIframeBridge**

创建 `src/composables/useIframeBridge.ts`：
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

type SavedHandler = (modal: string, record: unknown) => void
type CancelledHandler = (modal: string) => void

const ORIGIN = import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN as string | undefined

export function useIframeBridge() {
  const iframeRef = ref<HTMLIFrameElement | null>(null)
  const savedHandlers = new Set<SavedHandler>()
  const cancelledHandlers = new Set<CancelledHandler>()

  function handleMessage(e: MessageEvent) {
    if (ORIGIN && e.origin !== ORIGIN) return
    const data = e.data as { type?: string; modal?: string; record?: unknown }
    if (!data?.type) return
    if (data.type === 'JCLAW_MODAL_SAVED') {
      savedHandlers.forEach(h => h(data.modal!, data.record))
    } else if (data.type === 'JCLAW_MODAL_CANCELLED') {
      cancelledHandlers.forEach(h => h(data.modal!))
    }
  }

  onMounted(() => window.addEventListener('message', handleMessage))
  onUnmounted(() => window.removeEventListener('message', handleMessage))

  function openModal(modal: string, data: Record<string, unknown>) {
    iframeRef.value?.contentWindow?.postMessage(
      { type: 'JCLAW_OPEN_MODAL', modal, data },
      ORIGIN ?? '*'
    )
  }

  function onSaved(handler: SavedHandler) {
    savedHandlers.add(handler)
    return () => savedHandlers.delete(handler)
  }

  function onCancelled(handler: CancelledHandler) {
    cancelledHandlers.add(handler)
    return () => cancelledHandlers.delete(handler)
  }

  return { iframeRef, openModal, onSaved, onCancelled }
}
```

- [ ] **Step 3：提交**

```bash
git add src/composables/useUsage.ts src/composables/useIframeBridge.ts
git commit -m "feat: 添加 useUsage 和 useIframeBridge"
```

---

## Task 7：基础布局组件

**Files:**
- Create: `src/components/layout/TopBar.vue`, `src/components/layout/SidePanel.vue`, `src/components/layout/ChatArea.vue`, `src/components/layout/BusinessPanel.vue`
- Create: `src/components/ui/UsageBar.vue`
- Modify: `src/App.vue`

- [ ] **Step 1：创建 TopBar.vue**

创建 `src/components/layout/TopBar.vue`：
```vue
<template>
  <div class="flex items-center h-10 bg-white border-b border-gray-200 px-3 gap-2 shrink-0">
    <div class="flex items-center gap-1.5 mr-2 shrink-0">
      <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
        <span class="text-white text-xs font-bold">J</span>
      </div>
      <span class="text-sm font-semibold text-gray-700">JClaw</span>
    </div>

    <div class="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
      <button
        v-for="project in store.projects"
        :key="project.id"
        @click="setActive(project.id)"
        :class="[
          'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
          store.activeProjectId === project.id
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >{{ project.name }}</button>
    </div>

    <div
      :class="[
        'w-2 h-2 rounded-full shrink-0',
        store.wsStatus === 'connected' ? 'bg-green-500' :
        store.wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
      ]"
      :title="store.wsStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '../../stores/chat'
import { useProjects } from '../../composables/useProjects'
const store = useChatStore()
const { setActive } = useProjects()
</script>
```

- [ ] **Step 2：创建 UsageBar.vue**

创建 `src/components/ui/UsageBar.vue`：
```vue
<template>
  <div class="flex items-center gap-2 text-xs text-gray-400">
    <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <User :size="14" class="text-gray-500" />
    </div>
    <template v-if="store.usage">
      <span title="输入 token">↑{{ fmt(store.usage.inputTokens) }}</span>
      <span title="输出 token">↓{{ fmt(store.usage.outputTokens) }}</span>
      <span title="费用">${{ store.usage.totalCostUsd.toFixed(3) }}</span>
      <span
        :class="store.usage.contextUsedPct > 80 ? 'text-orange-500 font-semibold' : ''"
        title="context 使用率"
      >ctx {{ store.usage.contextUsedPct }}%</span>
    </template>
    <span v-else class="text-gray-300">未连接</span>
    <button class="ml-auto p-1 hover:text-gray-600 rounded transition-colors" title="设置">
      <Settings :size="13" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { User, Settings } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
const store = useChatStore()
function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n) }
</script>
```

- [ ] **Step 3：创建 SidePanel.vue**

创建 `src/components/layout/SidePanel.vue`：
```vue
<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200">
    <div class="p-3 border-b border-gray-100">
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
          <span class="flex-1 text-sm text-gray-700 truncate">{{ session.title }}</span>
          <button
            @click.stop="chat.deleteSession(session.id)"
            class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          ><Trash2 :size="12" /></button>
        </div>
      </template>
    </div>

    <div class="p-3 border-t border-gray-100">
      <UsageBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import { useWebSocket } from '../../composables/useWebSocket'
import UsageBar from '../ui/UsageBar.vue'

const store = useChatStore()
const ws = useWebSocket()
const chat = useChat(ws)

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
```

- [ ] **Step 4：创建 BusinessPanel.vue**

创建 `src/components/layout/BusinessPanel.vue`：
```vue
<template>
  <div class="flex flex-col h-full bg-gray-50">
    <iframe
      ref="bridge.iframeRef"
      :src="businessUrl"
      class="flex-1 w-full border-0"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useIframeBridge } from '../../composables/useIframeBridge'
import { useChatStore } from '../../stores/chat'

const bridge = useIframeBridge()
const store = useChatStore()
const businessUrl = import.meta.env.VITE_BUSINESS_SYSTEM_ORIGIN ?? ''

// 接收 autoOpen 全局事件
function onAutoOpen(e: Event) {
  const { modal, data } = (e as CustomEvent).detail
  bridge.openModal(modal, data)
  store.agentRunning = true
}
onMounted(() => window.addEventListener('jclaw:open-modal', onAutoOpen))
onUnmounted(() => window.removeEventListener('jclaw:open-modal', onAutoOpen))

// 保存后更新消息状态
bridge.onSaved((modal, record) => {
  const r = record as { title?: string }
  const msg = [...store.messages].reverse().find(m => m.actionJson?.modal === modal)
  if (msg) msg.content += `\n\n✅ 提交成功！📋 ${r.title ?? modal} [已保存]`
  store.agentRunning = false
})
</script>
```

- [ ] **Step 5：创建 ChatArea.vue**

创建 `src/components/layout/ChatArea.vue`：
```vue
<template>
  <div class="flex flex-col h-full">
    <MessageList class="flex-1 min-h-0" />
    <InputBar />
  </div>
</template>

<script setup lang="ts">
import MessageList from '../chat/MessageList.vue'
import InputBar from '../chat/InputBar.vue'
</script>
```

- [ ] **Step 6：提交**

```bash
git add src/components/layout/ src/components/ui/UsageBar.vue
git commit -m "feat: 添加布局组件（TopBar、SidePanel、ChatArea、BusinessPanel）和 UsageBar"
```

---

## Task 8：消息气泡组件

**Files:**
- Create: `src/components/chat/ThinkingBlock.vue`, `src/components/chat/ActionCard.vue`, `src/components/chat/MessageBubble.vue`, `src/components/chat/MessageList.vue`

- [ ] **Step 1：创建 ThinkingBlock.vue**

创建 `src/components/chat/ThinkingBlock.vue`：
```vue
<template>
  <div class="mb-2">
    <button
      @click="open = !open"
      class="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
    >
      <ChevronDown :size="12" :class="{ 'rotate-180': open }" class="transition-transform duration-150" />
      已完成思考
    </button>
    <div v-if="open" class="mt-1.5 pl-3 border-l-2 border-gray-200 text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
defineProps<{ content: string }>()
const open = ref(false)
</script>
```

- [ ] **Step 2：创建 ActionCard.vue**

创建 `src/components/chat/ActionCard.vue`：
```vue
<template>
  <div class="mt-3">
    <button
      @click="emit('trigger')"
      class="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg hover:bg-green-100 transition-colors"
    >
      <Bookmark :size="12" />
      新增{{ label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bookmark } from 'lucide-vue-next'

const props = defineProps<{ modal: string }>()
const emit = defineEmits<{ trigger: [] }>()

const LABELS: Record<string, string> = {
  quality_hazard_report: '质量隐患排查',
  construction_diary: '施工日志',
}
const label = computed(() => LABELS[props.modal] ?? props.modal)
</script>
```

- [ ] **Step 3：创建 MessageBubble.vue**

创建 `src/components/chat/MessageBubble.vue`：
```vue
<template>
  <!-- 用户消息 -->
  <div v-if="message.role === 'user'" class="flex justify-end mb-3">
    <div class="max-w-[75%] px-4 py-2.5 bg-pink-100 rounded-2xl rounded-tr-sm text-sm text-gray-800">
      {{ message.content }}
      <div v-if="message.status === 'error'" class="mt-1 flex items-center gap-1 text-xs text-red-500">
        <AlertCircle :size="10" /> 发送失败
        <button @click="emit('retry')" class="underline">重试</button>
      </div>
    </div>
  </div>

  <!-- AI 消息 -->
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
import { AlertCircle } from 'lucide-vue-next'
import type { Message, ActionPayload } from '../../stores/chat'
import { useChatStore } from '../../stores/chat'
import ThinkingBlock from './ThinkingBlock.vue'
import ActionCard from './ActionCard.vue'

const props = defineProps<{ message: Message }>()
const emit = defineEmits<{ retry: []; 'open-modal': [action: ActionPayload] }>()

const store = useChatStore()
const projectName = computed(() => store.activeProject()?.name ?? '')
</script>
```

- [ ] **Step 4：创建 MessageList.vue**

创建 `src/components/chat/MessageList.vue`：
```vue
<template>
  <div ref="listEl" class="overflow-y-auto px-4 py-4">
    <!-- 重连提示横幅 -->
    <div
      v-if="store.wsStatus === 'disconnected'"
      class="sticky top-0 mb-3 py-1.5 px-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 text-center"
    >
      连接断开，正在重连…
    </div>
    <!-- Agent 运行状态条 -->
    <div
      v-if="store.agentRunning"
      class="sticky top-0 mb-3 py-1.5 px-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-600 text-center"
    >
      JClaw 正在与业务界面交互中…
    </div>

    <MessageBubble
      v-for="msg in store.activeSessionMessages()"
      :key="msg.id"
      :message="msg"
      @retry="() => chat.send(msg.content)"
      @open-modal="action => bridge.openModal(action.modal, action.data)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import { useIframeBridge } from '../../composables/useIframeBridge'
import { useWebSocket } from '../../composables/useWebSocket'
import MessageBubble from './MessageBubble.vue'

const store = useChatStore()
const ws = useWebSocket()
const chat = useChat(ws)
const bridge = useIframeBridge()
const listEl = ref<HTMLDivElement | null>(null)

watch(() => store.messages.length, async () => {
  await nextTick()
  listEl.value?.scrollTo({ top: listEl.value.scrollHeight, behavior: 'smooth' })
})
</script>
```

- [ ] **Step 5：提交**

```bash
git add src/components/chat/
git commit -m "feat: 添加消息气泡、思考块、操作卡片、消息列表"
```

---

## Task 9：输入栏 + 快捷按钮 + 文件上传

**Files:**
- Create: `src/components/ui/QuickActions.vue`, `src/components/ui/FileUpload.vue`, `src/components/chat/InputBar.vue`

- [ ] **Step 1：创建 FileUpload.vue**

创建 `src/components/ui/FileUpload.vue`：
```vue
<template>
  <span>
    <input ref="input" type="file" class="hidden" :accept="accept" @change="onChange" />
    <button @click="input?.click()" class="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
      <slot />
    </button>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const MAX = 10 * 1024 * 1024
defineProps<{ accept?: string }>()
const emit = defineEmits<{
  file: [{ name: string; mimeType: string; data: string }]
  error: [string]
}>()
const input = ref<HTMLInputElement | null>(null)

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > MAX) { emit('error', `文件过大（最大 10MB）：${file.name}`); return }
  const reader = new FileReader()
  reader.onload = () => {
    const data = (reader.result as string).split(',')[1]
    emit('file', { name: file.name, mimeType: file.type, data })
  }
  reader.readAsDataURL(file)
}
</script>
```

- [ ] **Step 2：创建 QuickActions.vue**

创建 `src/components/ui/QuickActions.vue`：
```vue
<template>
  <div class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
    <button
      v-for="a in QUICK_ACTIONS" :key="a.id"
      @click="emit('action', a.message)"
      class="shrink-0 flex items-center gap-1 px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
    >{{ a.label }} <ChevronRight :size="10" /></button>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { QUICK_ACTIONS } from '../../config/quickActions'
const emit = defineEmits<{ action: [message: string] }>()
</script>
```

- [ ] **Step 3：创建 InputBar.vue**

创建 `src/components/chat/InputBar.vue`：
```vue
<template>
  <div class="border-t border-gray-100 bg-white shrink-0">
    <QuickActions @action="text = $event" />
    <div class="px-4 pb-3">
      <div class="flex flex-col border border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-300 transition-colors">
        <textarea
          v-model="text"
          @keydown.enter.exact.prevent="submit"
          rows="2"
          placeholder="可以描述任务或提问任何问题"
          class="px-4 pt-3 text-sm text-gray-700 resize-none outline-none placeholder-gray-400 bg-white"
        />
        <div class="flex items-center justify-between px-3 pb-2 bg-white">
          <div class="flex gap-1">
            <FileUpload accept="image/*" @file="files.push($event)" @error="toast = $event">
              <Image :size="16" />
            </FileUpload>
            <FileUpload accept=".pdf,.txt" @file="files.push($event)" @error="toast = $event">
              <Paperclip :size="16" />
            </FileUpload>
          </div>
          <div class="flex items-center gap-2">
            <select v-model="store.activeProjectId" class="text-xs text-gray-500 outline-none bg-transparent border-0 cursor-pointer">
              <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button disabled class="p-1.5 text-gray-300 cursor-not-allowed"><Mic :size="16" /></button>
            <button
              @click="submit"
              :disabled="!text.trim() && files.length === 0"
              class="p-1.5 bg-blue-500 text-white rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
            ><Send :size="14" /></button>
          </div>
        </div>
      </div>
      <!-- 附件标签 -->
      <div v-if="files.length" class="flex flex-wrap gap-1.5 mt-2">
        <span v-for="(f, i) in files" :key="i"
          class="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
          <span class="truncate max-w-[100px]">{{ f.name }}</span>
          <button @click="files.splice(i, 1)" class="text-gray-400 hover:text-gray-600 text-sm leading-none">×</button>
        </span>
      </div>
      <p v-if="toast" class="mt-1 text-xs text-red-500">{{ toast }}</p>
      <p class="mt-1 text-xs text-gray-300 text-center">内容由AI生成，请注意甄别</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Image, Paperclip, Mic, Send } from 'lucide-vue-next'
import { useChatStore } from '../../stores/chat'
import { useChat } from '../../composables/useChat'
import { useWebSocket } from '../../composables/useWebSocket'
import QuickActions from '../ui/QuickActions.vue'
import FileUpload from '../ui/FileUpload.vue'

const store = useChatStore()
const ws = useWebSocket()
const chat = useChat(ws)
const text = ref('')
const files = ref<Array<{ name: string; mimeType: string; data: string }>>([])
const toast = ref('')

async function submit() {
  const t = text.value.trim()
  if (!t && files.value.length === 0) return
  toast.value = ''
  const att = [...files.value]
  text.value = ''
  files.value = []
  await chat.send(t, att)
}
</script>
```

- [ ] **Step 4：提交**

```bash
git add src/components/ui/QuickActions.vue src/components/ui/FileUpload.vue src/components/chat/InputBar.vue
git commit -m "feat: 添加输入栏、快捷按钮、文件上传"
```

---

## Task 10：App.vue 组装 + WS 初始化

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1：替换 App.vue**

替换 `src/App.vue` 全部内容：
```vue
<template>
  <div class="flex flex-col h-screen bg-gray-50 overflow-hidden">
    <TopBar />
    <div class="flex flex-1 overflow-hidden">
      <SidePanel class="w-60 shrink-0" />
      <ChatArea class="w-[480px] shrink-0 border-r border-gray-200" />
      <BusinessPanel class="flex-1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import TopBar from './components/layout/TopBar.vue'
import SidePanel from './components/layout/SidePanel.vue'
import ChatArea from './components/layout/ChatArea.vue'
import BusinessPanel from './components/layout/BusinessPanel.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useUsage } from './composables/useUsage'
import { useProjects } from './composables/useProjects'
import { useChatStore } from './stores/chat'

const store = useChatStore()
const ws = useWebSocket()
const { refresh: refreshUsage } = useUsage(ws)
const { init } = useProjects()

watch(ws.status, s => { store.wsStatus = s })

ws.on('auth-error', () => {
  alert('OpenClaw Token 无效，请在 .env.local 中配置 VITE_OPENCLAW_TOKEN')
})
ws.on('max-retries', () => { store.wsStatus = 'disconnected' })
ws.on('chat', (p: unknown) => {
  if ((p as { done?: boolean }).done) refreshUsage()
})

onMounted(() => {
  init()
  const token = import.meta.env.VITE_OPENCLAW_TOKEN as string
  const url = (import.meta.env.VITE_OPENCLAW_WS_URL as string) ?? 'ws://127.0.0.1:18789'
  if (token) {
    ws.connect(token, url)
  } else {
    alert('请在 .env.local 中配置 VITE_OPENCLAW_TOKEN')
  }
})
</script>
```

- [ ] **Step 2：删除多余文件**

```bash
rm src/components/HelloWorld.vue src/assets/vue.svg 2>/dev/null || true
```

- [ ] **Step 3：最终启动验证**

```bash
npm run dev
```

逐一对照验收标准手工验证：
```
□ 1. npm run dev 无报错
□ 2. OpenClaw 运行 → 顶部指示器绿色
□ 3. 发送消息 → 粉色用户气泡 + AI 流式回复
□ 4. AI 含思考 → "已完成思考" 块可折叠展开
□ 5. 切换项目标签 → 消息区清空，历史刷新
□ 6. 左侧面板按时间分组，点击切换会话
□ 7. 上传图片 → 附件标签显示，随消息发出
□ 8. 底部四个快捷按钮可点击，填入输入框
□ 9. 断开 OpenClaw → "连接断开"横幅出现
□ 10. 底部显示 ↑ ↓ $ ctx% 用量数据
□ 11. ctx > 80% → 数字变橙色
□ 12. AI 返回 autoOpen JSON → 右侧 iframe 弹窗预填
□ 13. 点击 ActionCard 按钮 → iframe 弹窗
□ 14. iframe 保存 → 消息追加"✅ 提交成功"
```

- [ ] **Step 4：最终提交**

```bash
git add -A
git commit -m "feat: 完成 JClaw 聊天系统一期全功能"
```

---

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_OPENCLAW_WS_URL` | OpenClaw WebSocket 地址 | `ws://127.0.0.1:18789` |
| `VITE_OPENCLAW_TOKEN` | OpenClaw 鉴权 Token | **必填** |
| `VITE_BUSINESS_SYSTEM_ORIGIN` | 业务系统 origin（postMessage 安全校验） | `http://localhost:5174` |
