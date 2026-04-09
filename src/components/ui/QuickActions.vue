<template>
  <div class="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-50">
    <div v-for="a in QUICK_ACTIONS" :key="a.id" class="relative shrink-0">
      <button
        :ref="el => setButtonRef(a.id, el)"
        @click="toggle(a)"
        class="flex items-center gap-1 px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap"
        :class="{ 'bg-gray-50': openId === a.id }"
      >
        {{ a.label }}
        <ChevronRight :size="10" />
      </button>
    </div>
  </div>

  <Teleport to="body">
    <template v-for="a in QUICK_ACTIONS" :key="a.id">
      <div
        v-if="a.messageList && openId === a.id && popupPos"
        :style="{ position: 'fixed', top: popupPos.top + 'px', left: popupPos.left + 'px', zIndex: 9999 }"
        class="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-max"
      >
        <button
          v-for="sub in a.messageList"
          :key="sub.id + sub.label"
          @click="selectSub(sub.message!)"
          class="block w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap"
        >
          {{ sub.label }}
        </button>
      </div>
    </template>

    <div v-if="openId" class="fixed inset-0" style="z-index: 9998" @click="openId = null" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { QUICK_ACTIONS, type QuickAction } from '../../config/quickActions'

const emit = defineEmits<{ action: [message: string] }>()
const openId = ref<string | null>(null)
const popupPos = ref<{ top: number; left: number } | null>(null)
const buttonRefs = new Map<string, HTMLElement>()

function setButtonRef(id: string, el: unknown) {
  if (el) buttonRefs.set(id, el as HTMLElement)
  else buttonRefs.delete(id)
}

function toggle(a: QuickAction) {
  if (a.messageList) {
    if (openId.value === a.id) {
      openId.value = null
      popupPos.value = null
    } else {
      const btn = buttonRefs.get(a.id)
      if (btn) {
        const rect = btn.getBoundingClientRect()
        popupPos.value = { top: rect.top - 40, left: rect.right + 4 }
      }
      openId.value = a.id
    }
  } else if (a.message) {
    emit('action', a.message)
  }
}

function selectSub(message: string) {
  openId.value = null
  popupPos.value = null
  emit('action', message)
}
</script>
