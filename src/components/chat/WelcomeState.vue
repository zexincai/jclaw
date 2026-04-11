<template>
  <div class="flex-1 flex flex-col items-center justify-center min-h-0 bg-white px-4">
    <!-- 问候标题 -->
    <div class="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="mb-6 flex justify-center">
        <div class="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center p-1 border border-slate-100 rotate-3 hover:rotate-0 transition-transform duration-300">
          <img :src="logoUrl" class="w-full h-full rounded-2xl object-cover" />
        </div>
      </div>
      <h1 class="text-4xl font-bold text-slate-800 tracking-tight">
        Hi，我是<span class="text-slate-900">JClaw</span>
      </h1>
    </div>

    <!-- 欢迎卡片容器 -->
    <div class="w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in duration-500 delay-200">
      <!-- 快捷操作栏 -->
      <div class="flex items-center gap-3 px-6 pt-6 pb-2 overflow-x-auto scrollbar-none">
        <button
          v-for="action in WELCOME_ACTIONS"
          :key="action.label"
          @click="handleAction(action.label)"
          class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-full text-sm text-gray-600 font-medium transition-all group shrink-0"
        >
          <component :is="action.icon" :size="16" class="text-gray-400 group-hover:text-blue-500" />
          <span>{{ action.label }}</span>
          <ChevronRight :size="14" class="text-gray-300 group-hover:text-blue-300" />
        </button>
      </div>

      <!-- 输入框 -->
      <div class="px-2 pb-2">
        <InputBar is-welcome />
      </div>
    </div>

    <!-- 底部免责声明 -->
    <p class="mt-8 text-xs text-gray-400 font-light tracking-wide animate-in fade-in duration-1000 delay-500">
      内容由 AI 生成，请注意甄别！
    </p>
  </div>
</template>

<script setup lang="ts">
import { 
  ListTodo, 
  FileEdit, 
  Search, 
  LayoutPanelLeft, 
  ChevronRight 
} from 'lucide-vue-next'
import logoUrl from '../../assets/logo.jpg'
import InputBar from './InputBar.vue'
import { useChat } from '../../composables/useChat'

const chat = useChat()

const WELCOME_ACTIONS = [
  { label: '待办事项', icon: ListTodo },
  { label: '录入资料', icon: FileEdit },
  { label: '查询记录', icon: Search },
  { label: '汇总数据', icon: LayoutPanelLeft },
]

function handleAction(label: string) {
  // 模拟点击快捷操作：这里可以触发特定逻辑或自动填入输入框
  const textMap: Record<string, string> = {
    '待办事项': '帮我查看今天的待办事项',
    '录入资料': '我想录入一份施工日志',
    '查询记录': '查询最近的项目周报',
    '汇总数据': '汇总本月的劳务出勤数据',
  }
  const text = textMap[label] || label
  chat.send(text)
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
