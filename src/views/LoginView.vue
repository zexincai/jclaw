<template>
  <div class="login-root flex h-screen overflow-hidden">
    <!-- 噪点纹理叠层 -->
    <div class="noise-overlay" />

    <!-- 左侧：品牌面板 -->
    <div class="brand-panel hidden lg:flex flex-col relative w-[52%] overflow-hidden">
      <!-- 背景几何装饰 -->
      <div class="geo-circle-1" />
      <div class="geo-circle-2" />
      <div class="dot-grid" />

      <!-- 品牌内容 -->
      <div class="relative z-10 flex flex-col h-full px-16 py-14">
        <div class="flex items-center gap-3">
          <img :src="logoUrl" class="w-10 h-10 rounded-xl object-cover shadow-lg shadow-red-900/20 shadow-red-500/20" />
          <span class="font-mono text-[11px] tracking-[0.3em] uppercase text-white/80">JClaw</span>
        </div>

        <!-- 核心标语 -->
        <div class="flex-1 flex flex-col justify-center">
          <p class="eyebrow">// Enterprise Intelligence Platform</p>
          <h1 class="brand-heading">
            驱动项目<br />
            <em>智能</em>决策
          </h1>
          <p class="brand-sub">
            专为建筑施工行业打造的数字化管控中枢，<br />
            实时掌握项目利润、物料与进度的全局动态。
          </p>

          <!-- 分隔线 -->
          <div class="divider" />
        </div>

        <!-- 底部 -->
        <p class="font-mono text-[10px] tracking-widest text-white/20 uppercase">
          © 2026 JClaw Enterprise · All rights reserved
        </p>
      </div>
    </div>

    <!-- 右侧：登录表单 -->
    <div class="form-panel flex flex-1 items-center justify-center px-10 py-14">
      <div class="w-full max-w-[340px]">

        <!-- 移动端 Logo -->
        <div class="flex items-center gap-2.5 mb-12 lg:hidden">
          <img :src="logoUrl" class="w-9 h-9 rounded-lg object-cover" />
          <span class="font-mono text-[11px] tracking-[0.3em] uppercase" style="color: #c8bfaf;">JClaw</span>
        </div>

        <!-- 表单头部 -->
        <div class="mb-10">
          <p class="eyebrow-form">// Secure Access</p>
          <h2 class="form-heading">欢迎回来</h2>
          <p class="form-sub">使用您的企业账号登录</p>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="space-y-7">
          <div class="field">
            <label>手机号</label>
            <input maxlength="11" v-model="phoneNumber" type="tel" placeholder="请输入手机号" :disabled="loading" />
          </div>

          <div class="field">
            <label>验证码</label>
            <div class="flex gap-3">
              <input v-model="smsCode" maxlength="4" type="text" placeholder="输入验证码" :disabled="loading"
                class="flex-1" />
              <button type="button" class="code-btn" :disabled="!!countdown || !phoneNumber || loading"
                @click="handleGetCode">
                {{ countdown ? `${countdown}s` : '获取验证码' }}
              </button>
            </div>
          </div>

          <!-- 错误 -->
          <div v-if="error" class="error-bar">
            <span class="font-mono">⚠</span> {{ error }}
          </div>

          <!-- 提交 -->
          <div class="pt-1">
            <button type="submit" :disabled="loading || !phoneNumber || !smsCode" class="submit-btn">
              <span v-if="!loading">登录系统</span>
              <span v-else class="flex items-center justify-center gap-2.5">
                <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                身份验证中
              </span>
            </button>
          </div>
        </form>

        <!-- 滑块验证码 -->
        <SliderCaptcha :visible="captchaVisible" :captcha-data="captchaData" @close="captchaVisible = false"
          @refresh="fetchCaptcha" @success="onCaptchaSuccess" />

        <!-- 底部标识 -->
        <p class="mt-12 font-mono text-[10px] tracking-widest" style="color: #4a4540;">
          TLS 1.3 加密 · 数据安全保障
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import logoUrl from '../assets/logo.jpg'
import { useAuth } from '../composables/useAuth'
import { getCaptchaApi, sendSmsCodeApi } from '../api/login'
import SliderCaptcha from '../components/SliderCaptcha.vue'
import { loading as globalLoading } from '../utils/loading'

const auth = useAuth()
const phoneNumber = ref('')
const smsCode = ref('')
const loading = ref(false)
const error = ref('')

// 自动缓存手机号以保证 deviceId 稳定性 (绑定到单设备)
watch(phoneNumber, (val) => {
  if (val && /^[1][3-9]\d{9}$/.test(val)) {
    localStorage.setItem('jclaw_last_phone', val)
  }
})

// 验证码逻辑
const captchaVisible = ref(false)
const captchaData = ref<any>(null)
const countdown = ref(0)
const smsUuid = ref('')
let timer: any = null

async function fetchCaptcha() {
  globalLoading.show('Secure Validation')
  try {
    captchaData.value = await getCaptchaApi()
  } catch (e: any) {
    error.value = e.message || '获取验证码失败'
  } finally {
    globalLoading.hide()
  }
}

async function handleGetCode() {
  if (!phoneNumber.value) {
    error.value = '请输入手机号'
    return
  }
  error.value = ''
  await fetchCaptcha()
  captchaVisible.value = true
}

async function onCaptchaSuccess(distance: number) {
  try {
    globalLoading.show('Verifying')
    const data = await sendSmsCodeApi(phoneNumber.value, captchaData.value.uuid, distance)
    smsUuid.value = data?.data
    captchaVisible.value = false
    startCountdown()
  } catch (e: any) {
    error.value = e.message || '发送验证码失败'
    // 失败通常意味着位置不准，刷新一波
    await fetchCaptcha()
  } finally {
    globalLoading.hide()
  }
}

function startCountdown() {
  countdown.value = 60
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)
}

async function handleLogin() {
  if (!phoneNumber.value || !smsCode.value) return
  globalLoading.show('Authenticating')
  error.value = ''
  try {
    await auth.loginByMobile(phoneNumber.value, smsCode.value, smsUuid.value)
  } catch (e: any) {
    error.value = e.message || '登录失败，请重试'
  } finally {
    globalLoading.hide()
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* ── 根容器 ── */
.login-root {
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}

/* ── 噪点纹理 ── */
.noise-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px;
}

/* ── 左侧品牌面板 ── */
.brand-panel {
  background: linear-gradient(148deg, #1c2b3a 0%, #162030 40%, #1a2a3d 70%, #0e1c2c 100%);
}

.geo-circle-1 {
  position: absolute;
  top: -120px;
  left: -80px;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(185, 28, 28, 0.18) 0%, transparent 65%);
  pointer-events: none;
}

.geo-circle-2 {
  position: absolute;
  bottom: -60px;
  right: -60px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(30, 58, 138, 0.2) 0%, transparent 65%);
  pointer-events: none;
}

.dot-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* ── 品牌文字 ── */
.logo-mark {
  width: 36px;
  height: 36px;
  background: #b91c1c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.5), 0 4px 16px rgba(185, 28, 28, 0.3);
}

.logo-mark span {
  color: white;
  font-weight: 700;
  font-size: 15px;
}

.eyebrow {
  font-family: 'Courier New', Courier, monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #b91c1c;
  margin-bottom: 20px;
}

.brand-heading {
  font-family: Georgia, 'Songti SC', STSong, serif;
  font-size: 66px;
  font-weight: 300;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #f0ebe3;
  margin-bottom: 20px;
}

.brand-heading em {
  font-style: normal;
  color: #ef4444;
}

.brand-sub {
  font-size: 22px;
  line-height: 1.8;
  color: rgba(240, 235, 227, 0.45);
  margin-bottom: 32px;
}

.divider {
  width: 48px;
  height: 1px;
  background: linear-gradient(to right, rgba(185, 28, 28, 0.8), transparent);
  margin-bottom: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-family: 'Courier New', Courier, monospace;
  font-size: 22px;
  font-weight: 300;
  color: #f0ebe3;
  letter-spacing: -0.03em;
}

.stat-num sup {
  font-size: 11px;
  opacity: 0.6;
  vertical-align: super;
}

.stat-label {
  font-size: 11px;
  color: rgba(240, 235, 227, 0.35);
  letter-spacing: 0.05em;
}

/* ── 右侧表单面板 ── */
.form-panel {
  background: #f5f0ea;
}

.eyebrow-form {
  font-family: 'Courier New', Courier, monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #b91c1c;
  margin-bottom: 14px;
}

.form-heading {
  font-family: Georgia, 'Songti SC', STSong, serif;
  font-size: 40px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: #1c1813;
  margin-bottom: 6px;
}

.form-sub {
  font-size: 18px;
  color: #9a8f82;
}

/* ── 输入字段 ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9a8f82;
}

.field input {
  width: 100%;
  padding: 10px 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid #c8bfaf;
  font-size: 18px;
  color: #1c1813;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.field input::placeholder {
  color: #c2b8ac;
}

.field input:focus {
  border-bottom-color: #b91c1c;
}

.field input:disabled {
  opacity: 0.5;
}

/* ── 错误提示 ── */
.error-bar {
  font-size: 12px;
  color: #b91c1c;
  border-left: 2px solid #b91c1c;
  padding-left: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── 提交按钮 ── */
.submit-btn {
  width: 100%;
  padding: 13px;
  background: #1c1813;
  color: #f5f0ea;
  font-family: 'Courier New', Courier, monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:not(:disabled):hover {
  background: #b91c1c;
}

.submit-btn:not(:disabled):active {
  transform: scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.code-btn {
  padding: 0 16px;
  background: #1C2B45;
  border: 1px solid #c8bfaf;
  border-radius: 3px;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.code-btn:hover:not(:disabled) {
  border-color: #b91c1c;
  color: #b91c1c;
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #365386;
}
</style>
