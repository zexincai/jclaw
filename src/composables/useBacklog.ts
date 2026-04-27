import { ref } from 'vue'
import { searchBacklogPageList, type BacklogItemVo } from '../api/agent'

// 模块级单例
const backlogItems = ref<BacklogItemVo[]>([])
const backlogTotal = ref(0)
const backlogLoading = ref(false)

export function useBacklog() {
  async function fetchBacklog() {
    if (backlogLoading.value) return
    backlogLoading.value = true
    try {
      const res = await searchBacklogPageList() as any
      const data = res?.data ?? res
      const list: BacklogItemVo[] = data?.list ?? data?.records ?? []
      backlogItems.value = list.filter(item => item.handleStatus === 0)
      backlogTotal.value = data?.total ?? backlogItems.value.length
    } catch {
      // 静默失败，不影响主流程
    } finally {
      backlogLoading.value = false
    }
  }

  function reset() {
    backlogItems.value = []
    backlogTotal.value = 0
    backlogLoading.value = false
  }

  return { backlogItems, backlogTotal, backlogLoading, fetchBacklog, reset }
}
