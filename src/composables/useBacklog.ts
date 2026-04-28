import { ref } from 'vue'
import { type BacklogItemVo, searchBacklogPageList } from '../api/agent'

// TODO: 接口恢复后删除此 mock，恢复 searchBacklogPageList 调用
// const MOCK_BACKLOG: BacklogItemVo[] = [
//   { pkId: 1, title: '施工验收流程审批', businessTypeName: '施工验收', matterType: 1, handleStatus: 0, createTime: '2026-04-25 10:00:00', fkUserName: '张三', projectBidName: '示例标段A', roleName: '项目经理' },
//   { pkId: 2, title: '业主计量流程待办', businessTypeName: '业主计量', matterType: 2, handleStatus: 0, createTime: '2026-04-26 09:30:00', fkUserName: '李四', projectBidName: '示例标段B', roleName: '项目经理' },
//   { pkId: 3, title: '变更设计流程审批', businessTypeName: '设计变更', matterType: 4, handleStatus: 0, createTime: '2026-04-27 08:00:00', fkUserName: '王五', projectBidName: '示例标段A', roleName: '技术负责人' },
//   { pkId: 4, title: '分包合同审批流程', businessTypeName: '分包合同', matterType: 29, handleStatus: 0, createTime: '2026-04-27 11:00:00', fkUserName: '赵六', projectBidName: '示例标段C', roleName: '合同管理员' },
//   { pkId: 5, title: '供货合同审批流程', businessTypeName: '供货合同', matterType: 30, handleStatus: 0, createTime: '2026-04-24 15:00:00', fkUserName: '钱七', projectBidName: '示例标段B', roleName: '合同管理员' },
//   { pkId: 6, title: '月度进度审批流程', businessTypeName: '月度进度', matterType: 28, handleStatus: 0, createTime: '2026-04-27 14:00:00', fkUserName: '孙八', projectBidName: '示例标段A', roleName: '技术负责人' },
// ]

// 模块级单例
const backlogItems = ref<BacklogItemVo[]>([])
const backlogTotal = ref(0)
const backlogLoading = ref(false)

export function useBacklog() {
  async function fetchBacklog() {
    if (backlogLoading.value) return
    backlogLoading.value = true
    try {
      // TODO: 接口恢复后替换为：
      const res = await searchBacklogPageList() as any
      const data = res?.data ?? res
      const list: BacklogItemVo[] = data?.list ?? data?.records ?? []
      // await new Promise(resolve => setTimeout(resolve, 300)) // 模拟网络延迟
      // const list = MOCK_BACKLOG
      backlogItems.value = list.filter(item => item.handleStatus === 0)
      backlogTotal.value = list.length
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
