常用方法 + 事件：

| 类别 | 示例                                                      | 说明                            |
| ---- | --------------------------------------------------------- | ------------------------------- |
| 核心 | `connect`、`health`、`status`                             | `connect` 必须是第一个          |
| 消息 | `send`、`poll`、`agent`、`agent.wait`                     | 有副作用的需要 `idempotencyKey` |
| 聊天 | `chat.history`、`chat.send`、`chat.abort`、`chat.inject`  | WebChat 使用这些                |
| 会话 | `sessions.list`、`sessions.patch`、`sessions.delete`      | 会话管理                        |
| 节点 | `node.list`、`node.invoke`、`node.pair.*`                 | Gateway 网关 WS + 节点操作      |
| 事件 | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown` | 服务器推送                      |
