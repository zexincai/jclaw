<template>
  <!-- 全屏遮罩，强制拦截，不可关闭 -->
  <div
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="() => {}"
  >
    <!-- 弹窗主体 -->
    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
      <!-- 顶部渐变装饰 -->
      <div class="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <!-- 标题区 -->
      <div class="px-7 pt-6 pb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <ShieldCheck class="text-indigo-600" :size="20" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900">个人实名认证</h2>
            <p class="text-xs text-gray-400 mt-0.5">您的账号需要完成实名认证才能继续使用系统</p>
          </div>
        </div>

        <!-- 步骤指示器 -->
        <div class="flex items-center gap-2 mt-5">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="flex items-center gap-2"
          >
            <div
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                'bg-gray-100 text-gray-400'
              ]"
            >
              <Check v-if="step > i + 1" :size="13" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              :class="[
                'text-xs font-medium transition-colors',
                step === i + 1 ? 'text-indigo-600' : step > i + 1 ? 'text-green-600' : 'text-gray-400'
              ]"
            >{{ s }}</span>
            <div v-if="i < steps.length - 1" class="w-8 h-px bg-gray-200 mx-1" />
          </div>
        </div>
      </div>

      <div class="px-7 pb-7">
        <!-- Step 1: 填写个人信息 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 1" key="step1" class="space-y-4">
            <!-- 姓名 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">真实姓名 <span class="text-red-400">*</span></label>
              <input
                v-model.trim="form.name"
                type="text"
                placeholder="请输入真实姓名"
                class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-300"
              />
            </div>

            <!-- 证件类型 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">证件类型 <span class="text-red-400">*</span></label>
              <div class="relative">
                <select
                  v-model="form.certType"
                  class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="" disabled>请选择证件类型</option>
                  <option value="CRED_PSN_CH_IDCARD">中国大陆居民身份证</option>
                  <option value="CRED_PSN_CH_HONGKONG">香港来往大陆通行证</option>
                  <option value="CRED_PSN_CH_MACAO">澳门来往大陆通行证</option>
                  <option value="CRED_PSN_CH_TWCARD">台湾来往大陆通行证</option>
                  <option value="CRED_PSN_PASSPORT">护照</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" :size="15" />
              </div>
            </div>

            <!-- 证件号码 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">证件号码 <span class="text-red-400">*</span></label>
              <input
                v-model.trim="form.certNo"
                type="text"
                placeholder="请输入证件号码"
                class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-300"
              />
            </div>

            <!-- 手机号 (只读) -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1.5">手机号码</label>
              <input
                :value="telephone"
                type="text"
                disabled
                class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <!-- 错误提示 -->
            <p v-if="errorMsg" class="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle :size="13" />{{ errorMsg }}
            </p>

            <!-- 操作按钮 -->
            <button
              @click="submitInfo"
              :disabled="submitting"
              class="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-medium transition-all shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 v-if="submitting" class="animate-spin" :size="15" />
              <span>{{ submitting ? '提交中...' : '开始认证' }}</span>
            </button>
          </div>
        </transition>

        <!-- Step 2: 扫码人脸认证 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 2" key="step2" class="flex flex-col items-center py-2">
            <p class="text-sm text-gray-500 mb-1 text-center">
              请使用 <span class="font-medium text-gray-700">微信</span> 扫一扫
            </p>
            <p class="text-xs text-gray-400 mb-4 text-center">完成个人实名认证</p>

            <!-- 二维码容器 -->
            <div class="relative p-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50">
              <div ref="qrContainer" id="realname-qrcode" class="w-[220px] h-[220px] flex items-center justify-center">
                <!-- 加载中占位 -->
                <div v-if="qrLoading" class="flex flex-col items-center gap-2 text-indigo-400">
                  <Loader2 class="animate-spin" :size="28" />
                  <span class="text-xs">生成二维码中...</span>
                </div>
              </div>
              <!-- 扫码成功遮罩 -->
              <div v-if="qrScanned" class="absolute inset-0 rounded-2xl bg-white/95 flex flex-col items-center justify-center gap-2">
                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 class="text-green-500" :size="28" />
                </div>
                <p class="text-sm font-medium text-gray-700">扫描成功</p>
                <p class="text-xs text-gray-400">请在手机上根据提示操作</p>
              </div>
              <!-- 过期遮罩 -->
              <div v-if="qrExpired" class="absolute inset-0 rounded-2xl bg-white/95 flex flex-col items-center justify-center gap-2">
                <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <RefreshCcw class="text-gray-500" :size="22" />
                </div>
                <p class="text-sm font-medium text-gray-700">二维码已过期</p>
                <button @click="refreshQR" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">点击刷新</button>
              </div>
            </div>

            <p class="text-xs text-gray-400 mt-4 text-center">二维码有效期约 5 分钟</p>

            <!-- 错误提示 -->
            <p v-if="errorMsg" class="text-xs text-red-500 flex items-center gap-1.5 mt-3">
              <AlertCircle :size="13" />{{ errorMsg }}
            </p>

            <!-- 返回修改信息 -->
            <button
              @click="backToForm"
              class="mt-4 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft :size="12" />返回修改信息
            </button>
          </div>
        </transition>

        <!-- Step 3: 认证成功 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 3" key="step3" class="flex flex-col items-center py-6">
            <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5 animate-bounce-in">
              <CheckCircle2 class="text-green-500" :size="44" />
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">实名认证成功！</h3>
            <p class="text-sm text-gray-500 text-center">您已完成实名认证，正在为您进入系统...</p>
            <div class="mt-6 flex items-center gap-2 text-indigo-500">
              <Loader2 class="animate-spin" :size="16" />
              <span class="text-sm">加载中</span>
            </div>
          </div>
        </transition>

        <!-- Step 4: 认证失败 -->
        <transition name="fade-slide" mode="out-in">
          <div v-if="step === 4" key="step4" class="flex flex-col items-center py-6">
            <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <XCircle class="text-red-400" :size="44" />
            </div>
            <h3 class="text-base font-semibold text-gray-900 mb-2">认证失败</h3>
            <p class="text-sm text-gray-500 text-center mb-6">{{ failMsg || '人脸认证未通过，请重新尝试' }}</p>
            <button
              @click="retry"
              class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-200"
            >
              重新认证
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, nextTick } from 'vue'
// @ts-ignore
import QRCode from 'qrcodejs2-fixes'
import {
  ShieldCheck, Check, ChevronDown, AlertCircle, Loader2,
  CheckCircle2, RefreshCcw, ArrowLeft, XCircle
} from 'lucide-vue-next'
import { noTokenFaceSwiping, userFaceDistinguishState, addQRCode } from '../../api/auth'

const props = defineProps<{
  telephone: string
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

// ── State ──────────────────────────────────────────────────────────
const steps = ['填写信息', '扫码认证', '完成']
const step = ref<1 | 2 | 3 | 4>(1)

const form = ref({
  name: '',
  certType: '',
  certNo: '',
})

const errorMsg = ref('')
const failMsg = ref('')
const submitting = ref(false)

// QR code state
const qrLoading = ref(false)
const qrScanned = ref(false)
const qrExpired = ref(false)

let qrInstance: any = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let expireTimer: ReturnType<typeof setTimeout> | null = null

let authUrl = ''
let faceDistinguishId = ''

// ── Helpers ────────────────────────────────────────────────────────
function clearTimers() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  if (expireTimer) { clearTimeout(expireTimer); expireTimer = null }
}

// ── Step 1: 校验并提交信息 ──────────────────────────────────────────
async function submitInfo() {
  errorMsg.value = ''

  if (!form.value.name) return (errorMsg.value = '请输入真实姓名')
  if (!form.value.certType) return (errorMsg.value = '请选择证件类型')
  if (!form.value.certNo) return (errorMsg.value = '请输入证件号码')

  // 身份证格式校验
  if (form.value.certType === 'CRED_PSN_CH_IDCARD') {
    const reg18 = /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    const reg15 = /^[1-9]\d{5}\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{2}[0-9Xx]$/
    if (!reg18.test(form.value.certNo) && !reg15.test(form.value.certNo)) {
      return (errorMsg.value = '请输入正确的身份证号码')
    }
  }

  submitting.value = true
  try {
    const res = await noTokenFaceSwiping({
      name: form.value.name,
      certType: form.value.certType,
      cardNum: form.value.certNo,
      certNo: form.value.certNo,
      telephone: props.telephone,
      distinguishType: '1',
      type: 0,
    })
    const data = (res as any).data
    authUrl = data.faceSwipingUrl
    faceDistinguishId = data.userFaceDistinguishId

    step.value = 2
    await nextTick()
    await generateQR()
    startPolling()
    startExpireTimer()
  } catch (e: any) {
    errorMsg.value = e?.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

// ── Step 2: 生成二维码 ─────────────────────────────────────────────
async function generateQR() {
  qrLoading.value = true
  qrScanned.value = false
  qrExpired.value = false

  try {
    const res = await addQRCode()
    const unique = (res as any).data
    const location = window.location.origin
    const data = encodeURIComponent(JSON.stringify(authUrl))
    const text = `${location}/h5/#/pages/h5/scanCodeTran?type=2&unique=${unique}&data=${data}`

    await nextTick()
    const el = document.getElementById('realname-qrcode')
    if (!el) return

    el.innerHTML = ''
    qrInstance = new QRCode(el, {
      width: 220,
      height: 220,
      text,
      correctLevel: QRCode.CorrectLevel.H,
    })
    // 移除 title 提示
    if (qrInstance._el) qrInstance._el.title = ''
  } finally {
    qrLoading.value = false
  }
}

// ── 轮询认证结果 ──────────────────────────────────────────────────
function startPolling() {
  clearTimers()
  pollTimer = setInterval(async () => {
    try {
      const res = await userFaceDistinguishState({ distinguishType: 0, pkId: faceDistinguishId })
      const data = (res as any).data
      if (data.status === 2) {
        // 成功
        clearTimers()
        step.value = 3
        setTimeout(() => emit('success'), 1500)
      } else if (data.status === 1) {
        // 已扫码未确认
        qrScanned.value = true
      } else if (data.status === 3) {
        // 失败
        clearTimers()
        failMsg.value = data.errorInfo || '人脸认证未通过'
        step.value = 4
      }
    } catch {
      // 网络错误不中断轮询
    }
  }, 3000)
}

// ── 5分钟后标记二维码过期 ─────────────────────────────────────────
function startExpireTimer() {
  expireTimer = setTimeout(() => {
    clearTimers()
    if (step.value === 2) qrExpired.value = true
  }, 5 * 60 * 1000)
}

// ── 刷新二维码 ────────────────────────────────────────────────────
async function refreshQR() {
  qrExpired.value = false
  await generateQR()
  startPolling()
  startExpireTimer()
}

// ── 返回修改信息 ──────────────────────────────────────────────────
function backToForm() {
  clearTimers()
  step.value = 1
  errorMsg.value = ''
}

// ── 重新认证 (从失败回到Step1) ────────────────────────────────────
function retry() {
  clearTimers()
  step.value = 1
  errorMsg.value = ''
  failMsg.value = ''
}

// ── 清理 ──────────────────────────────────────────────────────────
onUnmounted(() => clearTimers())
</script>

<style scoped>
/* 弹窗入场动画 */
.animate-modal-in {
  animation: modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.92) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* 成功图标弹出 */
.animate-bounce-in {
  animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes bounce-in {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}

/* 步骤切换过渡 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.22s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
