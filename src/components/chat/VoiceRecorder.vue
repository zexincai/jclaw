<template>
  <div class="flex items-center justify-between px-4 py-2 bg-blue-50/50 border border-blue-200 rounded-xl h-[56px] shadow-inner mb-2">
    <div class="flex items-center gap-3">
      <div class="relative flex items-center justify-center w-3 h-3">
        <div class="absolute w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-2 h-2 bg-red-500 rounded-full"></div>
      </div>
      <span class="text-sm font-medium text-blue-900 tracking-wider font-mono">{{ formattedTime }}</span>
      <span class="text-xs text-blue-500 ml-2 animate-pulse">正在录音...</span>
    </div>
    
    <div class="flex items-center gap-3">
      <button @click="cancel" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="取消">
        <X :size="18" />
      </button>
      <button @click="finish" class="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full shadow-md hover:bg-blue-600 hover:shadow-lg active:scale-95 transition-all focus:outline-none flex items-center gap-1.5">
        <Send :size="14" />
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Send, X } from 'lucide-vue-next'

const emit = defineEmits<{
  cancel: []
  finish: [file: File]
}>()

const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const recordingTime = ref(0)
let timer: any = null

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream)
    
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.value.push(e.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/mp3' })
      let ext = 'mp3'
      if (MediaRecorder.isTypeSupported('audio/webm')) ext = 'webm'
      const file = new File([audioBlob], `语音消息_${new Date().getTime()}.${ext}`, { type: `audio/${ext}` })
      emit('finish', file)
      stopStream(stream)
    }
    
    mediaRecorder.value.start()
    
    timer = setInterval(() => {
      recordingTime.value += 1
    }, 1000)
    
  } catch (err) {
    console.error('无法访问麦克风', err)
    alert('无法访问麦克风，请检查系统权限或是否处于 HTTPS/localhost 环境。')
    emit('cancel')
  }
}

const stopStream = (stream: MediaStream) => {
  stream.getTracks().forEach(track => {
    track.stop()
  })
}

const cancel = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    // 覆盖 onstop 处理逻辑以防发出 finish 事件
    mediaRecorder.value.onstop = () => {
      if (mediaRecorder.value && mediaRecorder.value.stream) {
         stopStream(mediaRecorder.value.stream)
      }
    }
    mediaRecorder.value.stop()
  }
  emit('cancel')
}

const finish = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  } else if (audioChunks.value.length > 0) {
     // 如果处于暂停或其他状态但有块数据
     mediaRecorder.value?.stop()
  }
}

const formattedTime = computed(() => {
  const m = Math.floor(recordingTime.value / 60).toString().padStart(2, '0')
  const s = (recordingTime.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onMounted(() => {
  startRecording()
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    // 组件销毁前保证录音停止
    mediaRecorder.value.onstop = () => {}
    mediaRecorder.value.stop()
  }
})
</script>
