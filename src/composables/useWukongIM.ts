/**
 * 悟空IM SDK 封装 — 替代 OpenClaw WebSocket 连接
 * 连接地址通过 /eng/chat/getChatIMLongConnection 获取
 */
import { ref } from 'vue'
import {
  WKSDK,
  MessageText,
  Channel,
  ChannelTypePerson,
} from 'wukongimjssdk'
import { getChatIMLongConnection } from '../api/agent'

// sourceType: 3 = 智能体-pc端
const SOURCE_TYPE = 3

// ── 模块级单例状态 ──────────────────────────────
const status = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
let linkStatus = 0  // WKSDK 原始连接状态，1 = 已连接
let currentUserId = ''
let currentTelephone = ''
type IncomingMsgHandler = (message: unknown) => void
const messageHandlers = new Set<IncomingMsgHandler>()
// ────────────────────────────────────────────────

function _connectStatusListener(s: number, reasonCode: number) {
  linkStatus = s
  sessionStorage.setItem('wkLinkStatus', String(s))
  if (s === 1) {
    status.value = 'connected'
    console.log('[WukongIM] 连接成功')
  } else {
    status.value = 'disconnected'
    console.log('[WukongIM] 连接断开', reasonCode)
  }
}

function _messageListener(message: unknown) {
  console.log('[WukongIM] 收到原始消息', message)
  messageHandlers.forEach(h => h(message))
}

export function useWukongIM() {
  async function connect(userId: string, telephone: string, token: string) {
    try {
      if (linkStatus === 1) return
      status.value = 'connecting'
      const res = await getChatIMLongConnection({ sourceType: SOURCE_TYPE })
      const { modelType, wsAddr } = (res as any).data as { modelType: number; wsAddr: string }
      if (modelType === 2) {
        WKSDK.shared().config.provider.connectAddrCallback = async (callback: (addr: string) => void) => {
          callback(wsAddr)
        }
      } else {
        WKSDK.shared().config.addr = wsAddr
      }
      currentUserId = userId
      currentTelephone = telephone
      WKSDK.shared().config.uid = userId
      WKSDK.shared().config.token = token

      // 4. 注册监听器（幂等）
      WKSDK.shared().connectManager.addConnectStatusListener(_connectStatusListener)
      WKSDK.shared().chatManager.addMessageListener(_messageListener)

      // 5. 建立连接
      WKSDK.shared().connectManager.connect()
    } catch (err) {
      status.value = 'disconnected'
      console.error('[WukongIM] 连接失败', err)
    }
  }

  /** 断开连接并清理监听器 */
  function disconnect() {
    WKSDK.shared().chatManager.removeMessageListener(_messageListener)
    WKSDK.shared().connectManager.removeConnectStatusListener(_connectStatusListener)
    WKSDK.shared().connectManager.disconnect()
    linkStatus = 0
    currentTelephone = ''
    sessionStorage.removeItem('wkLinkStatus')
    status.value = 'disconnected'
  }

  function sendText(text: string, channelId: string) {
    const wkChannelId = `${channelId}@${currentTelephone}`
    console.log('[WukongIM] 发送消息 channelId:', wkChannelId, 'text:', text.slice(0, 50))
    const msg = new MessageText(text)
    const channel = new Channel(wkChannelId, ChannelTypePerson)
    WKSDK.shared().chatManager.send(msg, channel)
  }

  /**
   * 注册消息监听器，返回取消监听的函数
   */
  function onMessage(handler: IncomingMsgHandler) {
    messageHandlers.add(handler)
    return () => messageHandlers.delete(handler)
  }

  return { status, connect, disconnect, sendText, onMessage }
}
