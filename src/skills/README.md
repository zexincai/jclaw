# JClaw Skill 文件格式规范

## 概述

Skill 文件是以 `.md` 格式存储的 AI 技能定义文档，注入到每条消息的 `<system>` 块中，指导 AI 识别用户意图、自动调用业务 API，并以标准格式返回结果（含 `<pcAction>` 平台交互标签）。

---

## 文件位置

```
src/skills/
├── README.md               ← 本规范文档
├── construction-diary.md   ← 施工日志技能（示例）
├── quality-hazard.md       ← 质量隐患技能
└── cost-management.md      ← 成本管理技能
```

---

## 文件结构

```
---
name: <技能唯一标识，kebab-case>
version: "<语义化版本号>"
description: <一句话描述>
author: <作者>
tags: [<标签1>, <标签2>]
---

## 触发意图

## 认证

## 工具定义

## 响应规范
```

---

## 各节说明

### frontmatter（必填）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 技能唯一 ID，kebab-case，如 `construction-diary` |
| `version` | string | ✅ | 语义化版本，如 `"1.0"` |
| `description` | string | ✅ | 一句话描述技能用途 |
| `author` | string | ❌ | 编写人 |
| `tags` | string[] | ❌ | 分类标签，如 `[施工, 日志]` |

---

### `## 触发意图`

列出触发本技能的用户意图关键词和示例语句。AI 匹配到这些意图时激活本技能。

**格式：**
```md
## 触发意图

当用户表达以下意图时，激活本技能：

**关键词**：施工日志、施工记录、今日施工、日志查询、日志填写

**示例语句**：
- "帮我查一下施工日志"
- "今天的施工情况怎么样"
- "我要填写施工日志"
- "查看最近的施工记录"
```

---

### `## 认证`

说明如何从 `<system>` 块中提取 token 并携带到 API 请求中。

**格式（固定模板）：**
```md
## 认证

从当前消息 `<system>` 块中提取 `用户令牌` 字段的值，作为所有 API 请求的认证凭证：

```http
Authorization: Bearer {用户令牌}
Content-Type: application/json
```

> 注意：令牌值已在每次对话的系统上下文中提供，无需向用户询问。
```

---

### `## 工具定义`

定义本技能包含的所有可调用工具（API）。每个工具一个子节。

**工具节格式：**
```md
### 工具名称（动词+名词）

- **触发条件**：用户意图描述，什么情况下调用此工具
- **方法**：`GET` / `POST` / `PUT` / `DELETE`
- **地址**：`{BASE_URL}/api/path`
- **请求参数**（可选）：
  ```json
  {
    "param1": "说明",
    "param2": "说明（可选）"
  }
  ```
- **成功响应处理**：说明如何使用返回数据
- **失败响应处理**：说明出错时如何告知用户
- **交互动作**（可选）：是否附带 `<pcAction>` 标签
```

**BASE_URL 约定：**

在 skill 文件顶部或认证节中声明：
```md
> BASE_URL：`http://your-api-server.com`
```

---

### `## 响应规范`

规定 AI 回复的格式要求，包括自然语言描述、数据展示方式和 `<pcAction>` 标签使用规则。

**格式：**
```md
## 响应规范

### 文字回复
- 先用自然语言概括结果，再列出关键数据
- 数据列表超过 5 条时只展示前 5 条，说明"共 N 条，点击下方按钮查看全部"
- 不得在回复中暴露 token 或其他敏感字段

### 平台交互标签
需要引导用户进入业务系统操作时，在回复末尾附加对应平台的标签：

**PC 端：**
```xml
<pcAction>{"label":"操作按钮文字","menuPath":"/menu/path","menuButtonCode":"buttonCode","operateType":0}</pcAction>
```

**移动端：**
```xml
<appAction>{"label":"操作按钮文字","menuPath":"/menu/path","menuButtonCode":"buttonCode","operateType":0}</appAction>
```

**桌面端（Electron）：**
```xml
<deskAction>{"label":"操作按钮文字","menuPath":"/menu/path","menuButtonCode":"buttonCode","operateType":0}</deskAction>
```

### pcAction 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `label` | string | 按钮显示文字，简短动宾结构，如"查看施工日志" |
| `menuPath` | string | 业务系统菜单路径 |
| `menuButtonCode` | string | 菜单按钮功能码 |
| `operateType` | number | 操作类型：`0`=查看，`1`=新增，`2`=编辑，`3`=删除 |
```

---

## 完整示例

参见 [`construction-diary.md`](./construction-diary.md)

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-04-09 | 初始规范 |
