<template>
  <div class="chat">
    <div title="聊天" class="chatIcon" @mousedown="handleMouseDown">
      <img src="@/assets/aiImg.png" alt="" draggable="false">
      <!-- <div class="icon-container"> -->
        <!-- <img src="https://cos.jianbiyou.com/minio/prod20250320/ai-jxy.png" alt="" class="imgs"> -->
        <!-- <div class="icon-list" :class="{animal:animalShow}" :style="{ transform: `translateX(${-activeIndex * 50}%)` }"> -->
        <!-- <div class="icon-list">
          <img src="@/assets/aiImg.png" alt="" draggable="false">
        </div>
      </div> -->
      <!-- <div class="red-dot" v-if="redDot"></div> -->
    </div>
    <chatDialog ref="chatDialog" @linkAgain="getAddr" @hasNew="hasNew"></chatDialog>
  </div>
</template>

<script>
// import this.$wukong from 'wukongimjssdk'
import chatDialog from './chatDialog.vue'
export default {
  components: { chatDialog },
  data() {
    return {
      redDot: false,
      activeIndex: 0,
      interval: null,
      animalShow:false,
      isDragging: false,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      dragTimer: null,
      dragDelay: 300, // 300毫秒延迟
      mouseDownTime: 0, // 添加这个属性
    }
  },
  mounted() {
    this.startCarousel();
  },
  beforeDestroy() {
    if (this.interval) clearInterval(this.interval);
  },
  methods: {
    startCarousel() {
      this.interval = setInterval(() => {
        this.animalShow = true
        this.activeIndex ++;
        if(this.activeIndex == 2){
        setTimeout(() => {
          this.animalShow = false
          this.activeIndex = 0; // 重置到第一张图片
        }, 600);
      }
      }, 3000); // 3秒切换一次
    },
    handleOpen() {
      console.log('触发')
      this.$refs.chatDialog.open()
    },
    hasNew(e) {
      console.log('触发', e)

      this.redDot = e
    },
    getAddr() {
      this.$refs.chatDialog.getAddr()
    },
    // 断开
    disconnect() {
      this.$refs.chatDialog.disconnect()
    },
    handleMouseDown(e) {
      if (this.dragTimer) clearTimeout(this.dragTimer);
      
      this.startX = e.clientX;
      this.startY = e.clientY;
      const chatIcon = e.currentTarget;
      const rect = chatIcon.getBoundingClientRect();
      this.startLeft = rect.left;
      this.startTop = rect.top;
      
      // 重置移动标志
      this.hasMoved = false;
      this.mouseDownTime = Date.now();
      
      // 添加全局鼠标事件监听
      document.addEventListener('mousemove', this.handleGlobalMouseMove,{ passive: false });
      document.addEventListener('mouseup', this.handleGlobalMouseUp,{ passive: false });
      
      this.dragTimer = setTimeout(() => {
        this.isDragging = true;
        chatIcon.style.cursor = 'move';
      }, this.dragDelay);
    },
    
    handleGlobalMouseMove(e) {
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      
      // 如果移动距离超过5px，标记为已移动
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.hasMoved = true;
      }
      
      if (!this.isDragging) return;
      
      e.preventDefault();
      
      let newLeft = this.startLeft + dx;
      let newTop = this.startTop + dy;
      
      const chatIcon = document.querySelector('.chatIcon');
      const iconWidth = chatIcon.offsetWidth;
      const iconHeight = chatIcon.offsetHeight;
      
      newLeft = Math.max(0, Math.min(window.innerWidth - iconWidth, newLeft));
      newTop = Math.max(0, Math.min(window.innerHeight - iconHeight, newTop));
      
      chatIcon.style.left = `${newLeft}px`;
      chatIcon.style.top = `${newTop}px`;
    },
    
    handleGlobalMouseUp(e) {
      const now = Date.now();
      const pressDuration = now - this.mouseDownTime;
      
      if (this.dragTimer) clearTimeout(this.dragTimer);
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', this.handleGlobalMouseMove);
      document.removeEventListener('mouseup', this.handleGlobalMouseUp);
      
      const chatIcon = document.querySelector('.chatIcon');
      if (chatIcon) chatIcon.style.cursor = 'pointer';
      
      // 只有在没有移动且按下时间不超过300毫秒时才触发点击事件
      if (!this.hasMoved && !this.isDragging && pressDuration < 300) {
        this.handleOpen();
      }
      
      this.isDragging = false;
    },
    }
}
</script>

<style lang="scss" scoped>
// .chat {
//   position: fixed;
//   right: 10px;
//   bottom: 130px;
//   display: flex;
//   z-index: 1000;
// }
.chatIcon {
  position: fixed;
  left: calc(100vw - 70px); // 初始位置调整为右侧
  top: calc(100vh - 190px); // 初始位置调整为底部
  display: flex;
  z-index: 2000;
  // border: 1px solid rgba(235, 235, 235, 1);
  // border-radius: 50%;
  // background: #fff;
  // height: 60px;
  // width: 60px;
  // position: relative;
  cursor: pointer;
  // line-height: 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 49px;
  font-family: 'PFMedium';
  opacity: 0.9;
  img{
    height: 80px;
  }
  &:hover {
    opacity: 1;
  }
  .red-dot {
    position: absolute;
    right: -2px;
    top: 0;
    width: 8px;
    height: 8px;
    background-color: red;
    border-radius: 50%;
    opacity: 1;
  }
}
.icon-container {
  width: 40px;
  height: 40px;
  overflow: hidden;
  position: relative;
}

.icon-list {
  display: flex;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  // width: 200%;  // 新增容器宽度
  
  img {
    flex-shrink: 0;
    // width: 30px;  // 调整图片宽度
    height: 40px;
    opacity: 1;
  }
}
.animal{
  transition: transform 0.5s ease-in-out;
}
</style>
