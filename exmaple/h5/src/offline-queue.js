/**
 * 离线队列与增量同步
 * - 离线消息队列（断网时暂存，恢复后自动发送）
 * - 增量消息同步（基于时间戳，避免重复拉取全量历史）
 * - 消息发送状态追踪
 */

import { wsClient, uuid } from './api-client.js'
import { saveMessage, saveMessages, getLocalMessages, clearSessionMessages } from './message-db.js'

const OFFLINE_QUEUE_KEY = 'clawapp-offline-queue'
const SYNC_STATE_KEY = 'clawapp-sync-state'

/** 获取离线队列 */
function getOfflineQueue() {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

/** 保存离线队列 */
function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

/** 获取同步状态 */
function getSyncState(sessionKey) {
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY)
    const states = data ? JSON.parse(data) : {}
    return states[sessionKey] || { lastMessageId: null, lastTimestamp: 0 }
  } catch { return { lastMessageId: null, lastTimestamp: 0 } }
}

/** 保存同步状态 */
function saveSyncState(sessionKey, state) {
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY)
    const states = data ? JSON.parse(data) : {}
    states[sessionKey] = state
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(states))
  } catch {}
}

/** 发送消息（支持离线队列） */
export async function sendMessage(sessionKey, content, attachments = null) {
  const message = {
    id: uuid(),
    sessionKey,
    content,
    attachments,
    timestamp: Date.now(),
    status: 'pending'  // pending/sending/sent/failed
  }

  // 先存本地
  await saveMessage({ ...message, role: 'user' })

  // 尝试发送
  if (wsClient.gatewayReady) {
    message.status = 'sending'
    try {
      await wsClient.chatSend(sessionKey, content, attachments)
      message.status = 'sent'
      // 更新同步状态
      const syncState = getSyncState(sessionKey)
      syncState.lastMessageId = message.id
      syncState.lastTimestamp = message.timestamp
      saveSyncState(sessionKey, syncState)
    } catch (e) {
      console.error('[offline] send failed:', e)
      message.status = 'failed'
      // 加入离线队列
      const queue = getOfflineQueue()
      queue.push(message)
      saveOfflineQueue(queue)
    }
  } else {
    // 未连接，加入离线队列
    message.status = 'queued'
    const queue = getOfflineQueue()
    queue.push(message)
    saveOfflineQueue(queue)
  }

  return message
}

/** 处理离线队列 */
export async function processOfflineQueue() {
  const queue = getOfflineQueue()
  if (!queue.length || !wsClient.gatewayReady) return

  const sent = []
  for (const msg of queue) {
    try {
      await wsClient.chatSend(msg.sessionKey, msg.content, msg.attachments)
      msg.status = 'sent'
      sent.push(msg.id)
      // 更新同步状态
      const syncState = getSyncState(msg.sessionKey)
      syncState.lastMessageId = msg.id
      syncState.lastTimestamp = msg.timestamp
      saveSyncState(msg.sessionKey, syncState)
    } catch (e) {
      console.error('[offline] retry failed:', e)
      msg.status = 'failed'
    }
  }

  // 移除已发送的消息
  const remaining = queue.filter(m => !sent.includes(m.id))
  saveOfflineQueue(remaining)

  return { processed: queue.length, sent: sent.length, remaining: remaining.length }
}

/** 增量获取消息历史 */
export async function fetchIncrementalHistory(sessionKey, limit = 50) {
  if (!wsClient.gatewayReady) {
    // 离线模式，返回本地缓存
    return await getLocalMessages(sessionKey, limit)
  }

  const syncState = getSyncState(sessionKey)
  const localMsgs = await getLocalMessages(sessionKey, limit)
  const localCount = localMsgs.length

  try {
    // 拉取服务器历史
    const history = await wsClient.chatHistory(sessionKey, limit)
    if (!history || !history.messages) return localMsgs

    const serverMsgs = history.messages
    let newMsgs = []

    if (syncState.lastMessageId) {
      // 增量模式：找上次同步点之后的 新消息
      const lastIdx = serverMsgs.findIndex(m => m.id === syncState.lastMessageId)
      if (lastIdx >= 0) {
        newMsgs = serverMsgs.slice(0, lastIdx)  // 上次同步点之前的是新消息（倒序）
      } else {
        // 没找到同步点，全量处理
        newMsgs = serverMsgs
      }
    } else {
      // 首次同步，保留本地没有的
      const localIds = new Set(localMsgs.map(m => m.id))
      newMsgs = serverMsgs.filter(m => !localIds.has(m.id))
    }

    // 保存新消息到本地
    if (newMsgs.length > 0) {
      await saveMessages(newMsgs)
      // 合并并排序
      const allMsgs = [...localMsgs, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp)
      // 更新同步状态
      if (serverMsgs.length > 0) {
        const latest = serverMsgs[0]  // 最新消息
        saveSyncState(sessionKey, {
          lastMessageId: latest.id,
          lastTimestamp: latest.timestamp
        })
      }
      return allMsgs.slice(-limit)
    }

    return localMsgs.slice(-limit)
  } catch (e) {
    console.error('[offline] fetch history error:', e)
    return localMsgs
  }
}

/** 获取离线队列状态 */
export function getOfflineQueueStatus() {
  const queue = getOfflineQueue()
  return {
    total: queue.length,
    pending: queue.filter(m => m.status === 'pending').length,
    failed: queue.filter(m => m.status === 'failed').length,
    queued: queue.filter(m => m.status === 'queued').length
  }
}

/** 清除离线队列 */
export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY)
}

/** 重置会话同步状态 */
export function resetSyncState(sessionKey) {
  try {
    const data = localStorage.getItem(SYNC_STATE_KEY)
    const states = data ? JSON.parse(data) : {}
    delete states[sessionKey]
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(states))
  } catch {}
}

// 监听连接状态，自动处理离线队列
let _offlineListener = null
export function initOfflineHandler() {
  if (_offlineListener) return
  _offlineListener = (status) => {
    if (status === 'ready') {
      processOfflineQueue()
    }
  }
  wsClient.onStatusChange(_offlineListener)
}
