# WebSocket 对接 OpenClaw Gateway

## 连接地址

```
ws://127.0.0.1:18789
```

---

## 完整握手流程

### 第 1 步：收到服务端质询

连接建立后，Gateway 会立即推送一个质询 nonce（非本地连接需要签名）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "abc123", "ts": 1737264000000 }
}
```

### 第 2 步：客户端发送 connect 请求

**这是第一帧，必须最先发送：**

```json
{
  "type": "req",
  "id": "req-001",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "my-app",
      "version": "1.0.0",
      "platform": "web",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "YOUR_GATEWAY_TOKEN" },
    "locale": "zh-CN",
    "userAgent": "my-app/1.0.0",
    "device": {
      "id": "stable-device-fingerprint",
      "publicKey": "...",
      "signature": "...",
      "signedAt": 1737264000000,
      "nonce": "abc123"
    }
  }
}
```

> **本地 loopback 连接（127.0.0.1）可以自动批准**，`device.signature` 可以简化。

### 第 3 步：收到握手成功响应

```json
{
  "type": "res",
  "id": "req-001",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "policy": { "tickIntervalMs": 15000 },
    "auth": {
      "deviceToken": "dt_xxx",
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    }
  }
}
```

**保存 `deviceToken`**，下次连接直接用它作为 `auth.token`，无需重新配对。

---

## 帧格式（握手后）

```
请求：{ "type": "req", "id": "唯一ID", "method": "方法名", "params": {} }
响应：{ "type": "res", "id": "同上ID", "ok": true, "payload": {} }
事件：{ "type": "event", "event": "事件名", "payload": {}, "seq": 1 }
```

---

## 常用方法示例

**发送消息给智能体：**

```json
{
  "type": "req",
  "id": "req-002",
  "method": "agent",
  "params": {
    "message": "你好，帮我写个 hello world",
    "agentId": "main",
    "idempotencyKey": "unique-key-001"
  }
}
```

**查询健康状态：**

```json
{
  "type": "req",
  "id": "req-003",
  "method": "health",
  "params": {}
}
```

**智能体响应事件（流式）：**

```json
{ "type": "event", "event": "agent", "payload": { "runId": "...", "status": "streaming", "delta": "..." } }
{ "type": "event", "event": "agent", "payload": { "runId": "...", "status": "done", "summary": "..." } }
```

---

## 两种更简单的替代方案

如果不想实现完整 WS 协议，可以用：

### 方案 A：OpenAI 兼容 HTTP API

需先在配置中启用：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true }
      }
    }
  }
}
```

```bash
curl http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw:main","messages":[{"role":"user","content":"你好"}]}'
```

### 方案 B：流式 SSE

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw","stream":true,"messages":[{"role":"user","content":"你好"}]}'
```

---

## 关键注意点

| 事项 | 说明 |
|------|------|
| 首帧 | 必须是 `connect`，其他帧会导致连接关闭 |
| 协议版本 | 当前为 `3`，需声明 `minProtocol` + `maxProtocol` |
| 有副作用的方法 | `agent`、`send` 等需要提供 `idempotencyKey` 防重放 |
| 设备令牌 | 首次配对后持久化，后续直接复用 |
| 本地连接 | `127.0.0.1` 可自动批准，无需完整签名流程 |

---

## 角色与作用域

| 角色 | 说明 |
|------|------|
| `operator` | 控制平面客户端（CLI / Web UI / 自动化脚本） |
| `node` | 能力宿主（camera / screen / canvas / 语音） |

常用 operator 作用域：

- `operator.read` — 读取状态、会话、健康
- `operator.write` — 发送消息、触发智能体
- `operator.admin` — 管理配置
- `operator.approvals` — 审批 exec 请求
- `operator.pairing` — 管理设备配对
