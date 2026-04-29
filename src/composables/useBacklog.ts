import { ref } from 'vue'
import { type BacklogItemVo, searchBacklogPageList } from '../api/agent'

// 模块级单例
const typeTotals = ref<Record<number, number>>({ 0: 0, 1: 0, 2: 0 })
/** 按 messageType 缓存的列表 */
const typeItemsMap = ref<Record<number, BacklogItemVo[]>>({ 0: [], 1: [], 2: [] })
const typeItemsLoadingSet = ref<Set<number>>(new Set())
const totalsLoading = ref(false)
/** 已自动发送给 IM 的私下待办 pkId 集合（防重复发送） */
const sentPrivateIds = new Set<number>()

// 兼容旧字段
const backlogItems = ref<BacklogItemVo[]>([])
const backlogTotal = ref(0)
const backlogLoading = ref(false)

export function useBacklog() {
  /** 从响应体中提取列表，兼容直接数组和 PageInfo 两种格式 */
  function extractList(res: any): BacklogItemVo[] {
    const data = res?.data ?? res
    if (Array.isArray(data)) return data
    return data?.records ?? data?.list ?? []
  }

  /** 并发拉取三种类型的数量角标（顺带缓存列表） */
  async function fetchTypeTotals() {
    if (totalsLoading.value) return
    totalsLoading.value = true
    try {
      const results = await Promise.allSettled([
        searchBacklogPageList({ pageNum: 1, pageSize: 200, messageType: 0 }),
        searchBacklogPageList({ pageNum: 1, pageSize: 200, messageType: 1 }),
        searchBacklogPageList({ pageNum: 1, pageSize: 200, messageType: 2 }),
      ])
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const list = extractList(r.value)
          typeItemsMap.value = { ...typeItemsMap.value, [i]: list }
          typeTotals.value[i] = list.filter(item => item.mechanismType !== 1).length
        }
      })
    } catch {
      // 静默失败
    } finally {
      totalsLoading.value = false
    }
  }

  /** 拉取指定类型的待办列表（有缓存则跳过）*/
  async function fetchTypeItems(messageType: number, force = false) {
    if (!force && typeItemsMap.value[messageType]?.length) return
    if (typeItemsLoadingSet.value.has(messageType)) return
    typeItemsLoadingSet.value = new Set([...typeItemsLoadingSet.value, messageType])
    try {
      const res = await searchBacklogPageList({ pageNum: 1, pageSize: 9999, messageType }) as any
      const list = extractList(res)
      typeItemsMap.value = { ...typeItemsMap.value, [messageType]: list }
      typeTotals.value[messageType] = list.filter(item => item.mechanismType !== 1).length
    } catch {
      typeItemsMap.value = { ...typeItemsMap.value, [messageType]: [] }
    } finally {
      const next = new Set(typeItemsLoadingSet.value)
      next.delete(messageType)
      typeItemsLoadingSet.value = next
    }
  }

  /** 拉取全部三种类型 */
  async function fetchAllTypeItems() {
    await Promise.all([
      fetchTypeItems(0),
      fetchTypeItems(1),
      fetchTypeItems(2),
    ])
  }

  // 保留旧 fetchBacklog
  async function fetchBacklog() {
    await fetchTypeTotals()
    backlogTotal.value = Object.values(typeTotals.value).reduce((a, b) => a + b, 0)
  }

  /** 返回当前缓存中属于指定用户的、尚未自动发送的 mechanismType===1 待办项 */
  function getUnsentPrivateItems(userIds: string[]): BacklogItemVo[] {
    const all = [
      ...(typeItemsMap.value[0] ?? []),
      ...(typeItemsMap.value[1] ?? []),
      ...(typeItemsMap.value[2] ?? []),
    ]
    return all.filter(
      item =>
        item.mechanismType === 1 &&
        item.pkId != null &&
        !sentPrivateIds.has(item.pkId) &&
        userIds.includes(String(item.fkUserId)),
    )
  }

  function markPrivateItemsSent(ids: number[]) {
    ids.forEach(id => sentPrivateIds.add(id))
  }

  function reset() {
    typeTotals.value = { 0: 0, 1: 0, 2: 0 }
    typeItemsMap.value = { 0: [], 1: [], 2: [] }
    typeItemsLoadingSet.value = new Set()
    totalsLoading.value = false
    backlogItems.value = []
    backlogTotal.value = 0
    backlogLoading.value = false
    sentPrivateIds.clear()
  }

  function getTotalCount() {
    return Object.values(typeTotals.value).reduce((a, b) => a + b, 0)
  }

  return {
    typeTotals,
    typeItemsMap,
    typeItemsLoadingSet,
    getTotalCount,
    fetchTypeTotals,
    fetchTypeItems,
    fetchAllTypeItems,
    getUnsentPrivateItems,
    markPrivateItemsSent,
    // 旧接口保留
    backlogItems,
    backlogTotal,
    backlogLoading,
    fetchBacklog,
    reset,
  }
}
