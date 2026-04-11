/**
 * 建网科技工程管理系统 - 智能体模块 API
 * 基于 Swagger 文档自动生成
 */

import { http } from '../utils/request'

// ==================== 通用响应体 ====================

/**
 * 通用响应封装
 * @description 统一响应格式
 */
export interface AjaxResult<T = any> {
  /** 状态码 */
  code: number
  /** 响应数据 */
  data: T
  /** 消息 */
  msg: string
}

/**
 * 分页响应
 * @description 分页数据封装
 */
export interface PageInfo<T = any> {
  /** 当前页 */
  pageNum: number
  /** 每页大小 */
  pageSize: number
  /** 总记录数 */
  total: number
  /** 列表数据 */
  list: T[]
}

// ==================== 智能体用户管理 - 请求参数接口 ====================

/**
 * 新增智能体会话记录请求参数
 * @description 新增智能体会话记录表数据
 */
export interface EngAgentUserChatRecordAdd {
  /** 会话ID */
  fkChatId?: number
  /** 会话记录内容 */
  recordContent?: string
  /** 会话记录角色（user/assistant） */
  recordRole?: string
}

// ==================== 智能体用户管理 - 响应数据接口 ====================

/**
 * 智能体用户信息
 * @description 智能体用户视图对象
 */
export interface EngAgentUserVo {
  /** 用户头像 */
  avatar?: string
  /** 用户ID */
  id?: number
  /** 昵称 */
  nickname?: string
  /** 组织ID */
  orgId?: number
  /** 组织名称 */
  orgName?: string
  /** 组织类型 */
  orgType?: number
  /** 手机号 */
  phone?: string
  /** 备注 */
  remark?: string
  /** 盐值 */
  salt?: string
  /** 用户状态 */
  status?: number
  /** 用户类型 */
  userType?: number
  /** 用户名 */
  username?: string
}

// ==================== 智能体会话管理 - 响应数据接口 ====================

/**
 * 智能体会话记录 VO
 * @description 智能体会话记录视图对象
 */
export interface EngAgentUserChatRecordVO {
  /** 创建时间 */
  createTime?: string
  /** 创建人 */
  createUser?: string
  /** 智能体会话ID（关联表 agent_user_chat） */
  fkChatId?: number
  /** 主键ID */
  pkId?: number
  /** 会话记录内容 */
  recordContent?: string
  /** 会话记录角色（user/assistant） */
  recordRole?: string
  /** 更新时间 */
  updateTime?: string
  /** 更新人 */
  updateUser?: string
}

/**
 * 智能体会话 VO
 * @description 智能体会话视图对象
 */
export interface EngAgentUserChatVO {
  /** 会话标题 */
  chatTitle?: string
  /** 创建时间 */
  createTime?: string
  /** 创建人 */
  createUser?: string
  /** 主键ID */
  pkId?: number
  /** 更新时间 */
  updateTime?: string
  /** 更新人 */
  updateUser?: string
}

// ==================== API 接口 ====================

// -------- 智能体会话管理 --------

/**
 * 新增智能体会话记录表数据
 * @summary 新增会话记录
 * @param params 记录参数
 */
export function addChatRecordData(params: EngAgentUserChatRecordAdd) {
  return http.post<AjaxResult<object>>('/eng/agent/addChatRecordData', params)
}

/**
 * 删除智能体会话表
 * @summary 删除会话
 * @param pkId 主键ID
 */
export function deleteAgent(pkId: string) {
  return http.delete<AjaxResult<object>>('/eng/agent/delete', { pkId })
}

/**
 * 根据条件查询智能体会话表
 * @summary 获取会话列表
 * @param chatTitle 会话标题（可选）
 */
export function getUserAccountChatList(chatTitle?: string) {
  return http.get<AjaxResult<EngAgentUserChatVO[]>>('/eng/agent/getUserAccountChatList', { chatTitle })
}

/**
 * 根据会话ID获取会话数据（分页）
 * @summary 分页查询会话记录
 * @param params 查询参数
 */
export function chatRecordDataSearchPage(params: {
  /** 查询开始时间 */
  beginTime?: string
  /** 查询结束时间 */
  endTime?: string
  /** 智能体会话ID（关联表 agent_user_chat） */
  fkChatId: number
  /** 前面的操作时间 */
  frontTime?: string
  /** 当前页 */
  pageNum: number
  /** 记录数 */
  pageSize: number
}) {
  return http.get<AjaxResult<PageInfo<EngAgentUserChatRecordVO>>>('/eng/agent/chatRecordDataSearchPage', params)
}

// -------- 智能体用户管理 --------

/**
 * 获取当前登陆者个人信息
 * @summary 获取当前用户信息
 */
export function getPersonalUserInfo() {
  return http.get<AjaxResult<EngAgentUserVo>>('/eng/agentUser/personal/info')
}
