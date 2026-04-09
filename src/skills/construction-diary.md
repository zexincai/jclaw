---
name: construction-diary
version: "1.0"
description: 施工日志查询、填写与管理
author: JClaw
tags: [施工, 日志, 现场管理]
---

# 施工日志技能

## 触发意图

当用户表达以下意图时，激活本技能：

**关键词**：施工日志、施工记录、今日施工、日志查询、日志填写、施工情况、现场记录

**示例语句**：
- "帮我查一下施工日志"
- "今天的施工情况怎么样"
- "我要填写施工日志"
- "查看最近的施工记录"
- "昨天有没有提交日志"
- "本周施工进度如何"

---

## 认证

从当前消息 `<system>` 块中提取 `用户令牌` 字段的值，作为所有 API 请求的认证凭证：

```http
Authorization: Bearer {用户令牌}
Content-Type: application/json
```

> BASE_URL：`http://localhost:3001`
>
> 注意：令牌已在每次对话的系统上下文中提供，无需向用户询问。

---

## 工具定义

### 查询施工日志列表

- **触发条件**：用户想查看施工日志列表、询问近期施工情况、查询某日期的施工记录
- **方法**：`GET`
- **地址**：`{BASE_URL}/api/construction-diary/list`
- **请求参数**：
  ```json
  {
    "pageNum": 1,
    "pageSize": 5,
    "startDate": "可选，格式 YYYY-MM-DD",
    "endDate": "可选，格式 YYYY-MM-DD"
  }
  ```
- **成功响应处理**：
  提取 `data.records` 数组，展示每条记录的 `diaryDate`（日期）、`weatherCondition`（天气）、`workContent`（施工内容摘要，截取前 50 字），并在末尾附加查看全部的 `<pcAction>` 标签。
- **失败响应处理**：
  告知用户"暂时无法获取施工日志，请稍后重试或点击下方按钮进入系统查看"，并附加 `<pcAction>` 标签。
- **交互动作**：附带查看列表的平台标签

**示例回复格式：**
```
为您查询到最近 5 条施工日志：

1. 2026-04-08（晴）基础承台浇筑施工，完成 3 号楼 B1 层...
2. 2026-04-07（多云）钢筋绑扎施工，完成 2 号楼标准层...
...

如需查看全部记录，点击下方按钮进入系统：
<pcAction>{"label":"查看施工日志","menuPath":"/construction/diary","menuButtonCode":"diary_list","operateType":0}</pcAction>
<appAction>{"label":"查看施工日志","menuPath":"/construction/diary","menuButtonCode":"diary_list","operateType":0}</appAction>
<deskAction>{"label":"查看施工日志","menuPath":"/construction/diary","menuButtonCode":"diary_list","operateType":0}</deskAction>
```

---

### 查询单条施工日志详情

- **触发条件**：用户提到某个具体日期的日志、询问某天施工详情
- **方法**：`GET`
- **地址**：`{BASE_URL}/api/construction-diary/{id}`
- **请求参数**：路径参数 `id`（日志 ID）；若用户未提供 ID，先调用列表接口获取
- **成功响应处理**：
  以结构化方式展示 `diaryDate`、`weatherCondition`、`temperature`、`workContent`、`personnelCount`、`machineUsage`、`safetyRecord` 等字段，关键数字加粗。
- **失败响应处理**：
  告知用户未找到该记录，建议查看列表。
- **交互动作**：附带查看详情和编辑的平台标签

**示例回复格式：**
```
**2026-04-08 施工日志**

- 天气：晴，气温 18-26°C
- 施工内容：3 号楼 B1 层基础承台混凝土浇筑
- 作业人员：**42 人**
- 机械设备：混凝土泵车 2 台、振捣棒 6 组
- 安全记录：无异常，完成班前安全交底

<pcAction>{"label":"查看日志详情","menuPath":"/construction/diary/detail","menuButtonCode":"diary_detail","operateType":0}</pcAction>
```

---

### 新增施工日志

- **触发条件**：用户想填写、新增、提交今日施工日志
- **方法**：此操作需要表单填写，**不直接调用 API**，引导用户进入业务系统填写
- **交互动作**：直接返回新增入口的平台标签，无需 HTTP 请求

**示例回复格式：**
```
好的，点击下方按钮进入施工日志填写页面：

<pcAction>{"label":"新增施工日志","menuPath":"/construction/diary/add","menuButtonCode":"diary_add","operateType":1}</pcAction>
<appAction>{"label":"新增施工日志","menuPath":"/construction/diary/add","menuButtonCode":"diary_add","operateType":1}</appAction>
<deskAction>{"label":"新增施工日志","menuPath":"/construction/diary/add","menuButtonCode":"diary_add","operateType":1}</deskAction>
```

---

### 统计施工日志填报情况

- **触发条件**：用户询问日志填报率、本月/本周是否有漏报、填报统计
- **方法**：`GET`
- **地址**：`{BASE_URL}/api/construction-diary/statistics`
- **请求参数**：
  ```json
  {
    "year": "当前年份，如 2026",
    "month": "当前月份，如 4"
  }
  ```
- **成功响应处理**：
  展示 `totalDays`（应填天数）、`submittedDays`（已填天数）、`missingDates`（漏填日期列表），计算填报率并评价（≥95% 为优秀，80-95% 为良好，<80% 需提醒）。
- **失败响应处理**：
  告知统计数据暂时无法获取。
- **交互动作**：无需平台标签，纯数据展示

**示例回复格式：**
```
**本月（4月）施工日志填报统计：**

- 应填天数：22 天
- 已填天数：20 天
- 填报率：**90.9%**（良好）
- 漏填日期：4月3日、4月5日

建议及时补填漏报日志。
```

---

## 响应规范

### 文字回复
- 先用自然语言概括结果，再展示关键数据
- 数字和关键指标使用 `**加粗**` 突出显示
- 列表数据最多展示 5 条，超出时说明"共 N 条"
- 不得在回复中暴露 token 值或接口地址
- 遇到接口报错时给出友好提示，并提供平台标签作为备选入口

### 平台交互标签规则
- 查询类操作：`operateType: 0`
- 新增类操作：`operateType: 1`
- 编辑类操作：`operateType: 2`
- 删除类操作：`operateType: 3`
- 同时输出三端标签（`<pcAction>`、`<appAction>`、`<deskAction>`），客户端自动提取当前平台对应标签
- 标签始终放在回复**末尾**，不要插入在文字中间
