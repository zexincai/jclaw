<template>
  <div 
    class="voice-message" 
    :class="{ 'right': align === 'right', 'playing': isPlaying }"
    @click="togglePlay"
  >
    <!-- 左侧对齐样式 -->
    <div v-if="align === 'left'" class="left-content">
      <div class="wave-wrapper">
        <div v-for="i in 3" :key="i" class="wave-bar" :class="{'wave-bar-play':isPlaying}" :style="waveStyle(i)"></div>
      </div>
      <span class="duration">{{ duration }}"</span>
    </div>

    <!-- 右侧对齐样式 -->
    <div v-else class="right-content">
      <span class="duration">{{ duration }}"</span>
      <div class="wave-wrapper">
        <div v-for="i in 3" :key="i" class="wave-bar" :class="{'wave-bar-play':isPlaying}" :style="waveStyle(i)"></div>
      </div>
    </div>

    <!-- 未读红点 -->
    <!-- <div v-if="!read && align === 'left'" class="unread-dot"></div> -->
  </div>
</template>

<script>
export default {
  props: {
    src: { type: String, required: true },    // 语音文件URL
    read: { type: Boolean, default: false },   // 是否已读
    align: { type: String, default: 'left' }   // 对齐方向 left/right
  },
  data() {
    return {
      isPlaying: false,
      audio: null,
      duration:0
    }
  },
  mounted(){
    this.audio = new Audio(this.src)
    let that = this
    this.audio.addEventListener('loadedmetadata', function() {
      that.duration = parseInt(that.audio.duration);
      // duration 即为mp3的时长，单位为秒
    });
  },
  watch:{
    src(val){
      this.audio.src = val
      this.audio.load()
    },
  },
  methods: {
    togglePlay() {
      if (!this.audio) {
        this.audio = new Audio(this.src)
        let that = this
        this.audio.addEventListener('loadedmetadata', function() {
          that.duration = parseInt(that.audio.duration);
          // duration 即为mp3的时长，单位为秒
        });
        this.audio.onended = () => {
          this.isPlaying = false
          if (!this.read) this.$emit('read')
        }
      }

      this.isPlaying ? this.audio.pause() : this.audio.play()
      this.isPlaying = !this.isPlaying
    },
    waveStyle(i) {
      if (!this.isPlaying) return {}
      return {
        height: `${Math.random() * 60 + 40}%`,
        animationDelay: `${i * 0.2}s`
      }
    }
  },
  beforeDestroy() {
    if (this.audio) {
      this.audio.pause()
      this.audio = null
    }
  }
}
</script>

<style scoped>
.voice-message {
  position: relative;
  display: inline-block;
  max-width: 200px;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  background-color: #f4f5f8;
}

/* 左侧样式 */
.left-content {
  display: flex;
  align-items: center;
}
.voice-message.left {
  background: #f4f5f8;
  border: 1px solid #e5e5e5;
  margin-left: 15px;
}
.voice-message.left.playing {
  background: rgba(242, 242, 242, 0.8);
}

/* 右侧样式 */
.right-content {
  display: flex;
  align-items: center;
}
.voice-message.right {
  /* background: #95ec69; */
  background-color: #D6E6FF;
  /* margin-right: 15px; */
}
.voice-message.right.playing {
  /* background: #85d85c; */
  background-color: #D6E6FF;
}

/* 波形动画 */
.wave-wrapper {
  display: flex;
  align-items: center;
  height: 20px;
  gap: 2px;
}
.wave-bar {
  width: 3px;
  background: currentColor;
  height: 80%;
}
.wave-bar-play{
    transition: height 0.3s;
    animation: wave 0.8s ease-in-out infinite;
}
@keyframes wave {
  0%, 100% { height: 40%; }
  50% { height: 80%; }
}

.duration {
  font-size: 12px;
  color: #666;
  margin: 0 8px;
}

/* 未读红点 */
.unread-dot {
  position: absolute;
  top: -4px;
  right: -8px;
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
}
</style>