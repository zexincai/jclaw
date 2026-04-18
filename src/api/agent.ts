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
  current: number
  /** 每页大小 */
  size: number
  /** 总记录数 */
  total: number
  /** 列表数据 */
  records: T[]
}

// ==================== 智能体用户管理 - 请求参数接口 ====================

/**
 * 智能会话文件记录
 * @description 会话文件信息（请求参数）
 */
export interface ChatRecordFile {
  /** 文件类型 */
  fileType?: string
  /** 文件URL */
  fileUrl?: string
  /** 文件名称 */
  fileName?: string
}

/**
 * 新增智能体会话记录请求参数
 * @description 新增智能体会话记录表数据
 */
export interface EngAgentUserChatAdd {
  chatTitle: string
}
export interface EngAgentUserChatAddVo {
  chatTitle: string
  /** 状态码 */
  code: number
  /** 响应数据 */
  data: number
  /** 消息 */
  msg: string
}

/**
 * 新增智能体会话记录请求参数
 * @description 新增智能体会话记录表数据
 */
export interface EngAgentUserChatRecordAdd {
  /** 会话ID */
  fkChatId?: number
  /** 会话记录内容 */
  chatContent?: string
  /** 会话对象(用户：0, 智能体:1) */
  chatObject?: string
  /** 文件列表 */
  chatRecordFileList?: ChatRecordFile[]
}

// ==================== 智能体用户管理 - 响应数据接口 ====================

/**
 * 智能体用户信息
 * @description 智能体用户视图对象
 */
/**
 * 智能体用户信息
 * @description 智能体用户视图对象
 */
export interface EngAgentUserVo {
  /** 证件号码 */
  cardNum?: string
  /** 证件类型 */
  certType?: string
  /** 组织ID */
  fkOrgId?: number
  /** 组织名称 */
  orgName?: string
  /** 组织状态 */
  orgStatus?: number
  /** 组织类型 */
  orgType?: number
  /** 主键ID */
  pkId?: number
  /** 头像URL */
  portraitUrl?: string
  /** 真实姓名 */
  realName?: string
  /** 实名认证状态 */
  realNameVerify?: number
  /** 性别 */
  sex?: number
  /** 简称 */
  shortName?: string
  /** 手机号 */
  telephone?: string
}

// ==================== 智能体会话管理 - 响应数据接口 ====================

/**
 * 智能会话文件记录 VO
 * @description 会话文件视图对象
 */
export interface ChatRecordFileVO {
  /** 文件类型 */
  fileType?: string
  /** 文件URL */
  fileUrl?: string
  /** 主键ID */
  pkId?: number
  /** 文件名称 */
  fileName?: string
}

/**
 * 智能体会话记录 VO
 * @description 智能体会话记录视图对象
 */
export interface EngAgentUserChatRecordVO {
  /** 智能体会话ID（关联表 agent_user_chat） */
  fkChatId?: number
  /** 主键ID */
  pkId?: number
  kChatId?: number
  /** 会话记录内容 */
  chatContent?: string
  /** 会话对象(用户：0, 智能体:1) */
  chatObject?: string
  /** 文件列表 */
  chatRecordFileList?: ChatRecordFileVO[]
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
 * 新增智能体会话表数据
 * @summary 新增会话
 * @param params 记录参数
 */
export function addChat(params: EngAgentUserChatAdd) {
  return http.post<AjaxResult<EngAgentUserChatAddVo>>('/eng/agent/add', params)
}

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
export function getUserAccountChatList(chatTitle: string) {
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

// -------- IM 长连接 --------

/**
 * 获取IM长连接地址
 * @param sourceType 登录来源 1: PC端, 3: 智能体-pc端, 4: 智能体-PC安装版
 */
export interface ChatIMLongConnectionVO {
  modelType: number  // 1: 单机, 2: 集群
  wsAddr: string
}

export function getChatIMLongConnection(params: { sourceType: number }) {
  return http.get<AjaxResult<ChatIMLongConnectionVO>>('/eng/chat/getChatIMLongConnection', params)
}

/**
 * 版本信息 VO
 * @description 版本信息视图对象
 */
export interface EngVersionVo {
  /** 启用状态 (待更新: 1, 已更新: 2) */
  enableStatus?: number
  /** 强制更新 (否: 0, 是: 1) */
  forceStatus?: string
  /** 备注 */
  remark?: string
  /** 版本更新开始时间 */
  updateBeginTime?: string
  /** 更新内容 */
  updateContent?: string
  /** 版本更新结束时间 */
  updateEndTime?: string
  /** 当前版本号 */
  versionCode?: string
}

/**
 * 获取移动端版本信息
 * @summary 获取版本信息列表
 * @param mobileType PC端(PC端: 2, 智能体-PC端: 6, 智能体-移动端: 7)
 */
export function getMobileVersionInfo(mobileType: string) {
  return http.get<EngVersionVo[]>('/eng/version/getMobileVersionInfo', { mobileType })
}
