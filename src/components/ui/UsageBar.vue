<template>
  <div class="flex items-center gap-2 min-w-0">
    <div class="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-medium text-gray-500">
      {{ roleInitial }}
    </div>
    <span class="flex-1 text-xs text-gray-500 truncate min-w-0">{{ roleName }}</span>
    <button
      @click="showSettings = true"
      class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
      title="设置"
    >
      <Settings :size="14" />
    </button>
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Settings } from 'lucide-vue-next'
import { useAuth } from '../../composables/useAuth'
import SettingsModal from './SettingsModal.vue'

const auth = useAuth()
const showSettings = ref(false)

const roleName = computed(() => auth.currentRole.value?.roleName ?? '未登录')
const roleInitial = computed(() => roleName.value.slice(0, 1))
</script>
