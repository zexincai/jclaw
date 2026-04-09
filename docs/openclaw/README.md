# OpenClaw 文档总结

## 一、项目概述

**OpenClaw** 是一个**多渠道 AI 智能体 Gateway 网关**，可在任何操作系统上运行。它将聊天应用（WhatsApp、Telegram、Discord 等）连接到 **Pi** 编程智能体，支持本地或远程部署。

核心理念：**单个 Gateway 进程** = 所有渠道 + 会话管理的唯一事实来源。

---

## 二、架构

```
Chat apps + plugins
        ↓
    Gateway (WebSocket, 18789)
        ↓
  ┌─────────────┐
  │  Pi agent   │
  │  CLI        │
  │  Web UI     │
  │  macOS app  │
  │  iOS/Android│
  └─────────────┘
```

- 传输协议：**WebSocket（JSON 帧）**
- 第一帧必须是 `connect`，携带设备身份
- Canvas 主机默认端口：**18793**

---

## 三、快速开始（3 步）

```bash
# 1. 安装
npm install -g openclaw@latest

# 2. 新手引导
openclaw onboard --install-daemon

# 3. 连接渠道 + 启动
openclaw channels login        # WhatsApp 扫码
openclaw gateway --port 18789  # 启动网关
```

访问 `http://127.0.0.1:18789/` 打开 Web 控制界面。

---

## 四、支持渠道（20+）

| 类型 | 渠道 |
|------|------|
| **内置** | WhatsApp、Telegram、Discord、Slack、Signal、iMessage (BlueBubbles)、Google Chat |
| **插件** | Mattermost、飞书、LINE、Matrix、Nostr、MS Teams、Twitch、Zalo 等 |
| **内置界面** | WebChat（浏览器）、macOS 菜单栏 App |

---

## 五、多智能体路由

每个**智能体（Agent）**拥有独立的：
- 工作区（文件/记忆）
- 认证配置文件
- 会话存储

**路由规则优先级**（最具体的优先）：

1. `peer` 精确匹配（私信/群组 ID）
2. `guildId` / `teamId`
3. `accountId` 精确匹配
4. 渠道级匹配
5. 默认智能体

**典型场景：**

```json5
// 两个 WhatsApp 账号 → 两个智能体
{
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ]
}
```

---

## 六、配置文件 `~/.openclaw/openclaw.json`

支持 **JSON5** 格式（注释 + 尾逗号）。主要配置项：

| 配置块 | 用途 |
|--------|------|
| `channels.*` | 各渠道 token、白名单、群组策略 |
| `agents.list` | 多智能体定义（工作区、沙箱、工具限制） |
| `agents.defaults` | 模型、沙箱、心跳、上下文裁剪 |
| `bindings` | 消息路由规则 |
| `session` | 会话作用域、重置策略 |
| `gateway` | 端口、认证、热重载 |
| `models.providers` | 自定义 LLM 提供商（LiteLLM、本地模型等） |
| `tools` | 工具允许/拒绝策略、沙箱配置 |
| `hooks` | Webhook 端点（Gmail 等） |

**最小配置：**

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

---

## 七、安全机制

- **配对审批**：未知私信发送者收到短代码，需手动批准
- **白名单**：`allowFrom` 控制允许触发的号码
- **Docker 沙箱**：对非主会话进行文件系统隔离
- **工具策略**：按智能体配置 allow/deny 工具列表
- **Gateway Token**：WS 连接认证

---

## 八、支持的 AI 提供商

- **Anthropic**（Claude Opus/Sonnet）— 推荐
- **OpenAI**（GPT 系列）
- **Z.AI**（GLM-4.7）
- **MiniMax M2.1**
- **Kimi / Moonshot**
- **OpenRouter**（聚合多模型）
- **本地模型**（通过 LM Studio）
- 支持模型故障转移（`fallbacks`）

---

## 九、移动节点（iOS/Android）

通过 WebSocket 配对，支持：
- Canvas（可交互 HTML 界面）
- 相机、音频
- 语音唤醒
- 位置信息

---

## 十、关键 CLI 命令

```bash
openclaw onboard          # 初始化向导
openclaw gateway          # 启动网关
openclaw status --all     # 全量状态报告
openclaw health           # 健康检查
openclaw doctor           # 诊断配置问题
openclaw channels login   # WhatsApp 扫码登录
openclaw pairing list     # 查看待审批的配对
openclaw agents add work  # 添加新智能体
```
