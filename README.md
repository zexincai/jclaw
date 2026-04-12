# JClaw - AI 智能对话应用

基于 Vue 3 + TypeScript + Vite 构建的现代化 AI 对话应用，支持多项目管理、实时通信和业务系统集成。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **样式**: Tailwind CSS + @tailwindcss/typography
- **图标**: lucide-vue-next
- **实时通信**: WebSocket
- **文件上传**: 腾讯云 COS (cos-js-sdk-v5)
- **其他**: Markdown 渲染 (marked)、二维码生成 (qrcodejs2-fixes)

## 项目结构

```
app-jw/
├── src/
│   ├── api/                    # API 接口层
│   │   ├── agent.ts           # Agent 相关接口
│   │   ├── auth.ts            # 认证接口
│   │   ├── chatQuick.ts       # 快捷对话接口
│   │   └── login.ts           # 登录接口
│   │
│   ├── assets/                 # 静态资源
│   │   └── headPortrait/      # 头像资源
│   │
│   ├── components/             # 组件库
│   │   ├── chat/              # 聊天相关组件
│   │   │   ├── ActionCard.vue          # 操作卡片
│   │   │   ├── ActionTagButton.vue     # 操作标签按钮
│   │   │   ├── InputBar.vue            # 输入框
│   │   │   ├── MarkdownContent.vue     # Markdown 渲染
│   │   │   ├── MessageBubble.vue       # 消息气泡
│   │   │   ├── MessageList.vue         # 消息列表
│   │   │   ├── ThinkingBlock.vue       # 思考中状态
│   │   │   ├── VoiceRecorder.vue       # 语音录制
│   │   │   └── WelcomeState.vue        # 欢迎页
│   │   │
│   │   ├── layout/            # 布局组件
│   │   │   ├── BusinessPanel.vue       # 业务面板 (iframe)
│   │   │   ├── ChatArea.vue            # 聊天区域
│   │   │   ├── ProjectSwitcher.vue     # 项目切换器
│   │   │   ├── SidePanel.vue           # 侧边栏
│   │   │   └── TopBar.vue              # 顶部栏
│   │   │
│   │   ├── modals/            # 弹窗组件
│   │   │   └── RealNameAuthModal.vue   # 实名认证弹窗
│   │   │
│   │   ├── ui/                # 通用 UI 组件
│   │   │   ├── AudioPlayer.vue         # 音频播放器
│   │   │   ├── FileUpload.vue          # 文件上传
│   │   │   ├── QuickActions.vue        # 快捷操作
│   │   │   ├── SettingsModal.vue       # 设置弹窗
│   │   │   └── UsageBar.vue            # 使用量进度条
│   │   │
│   │   ├── GlobalLoading.vue  # 全局加载状态
│   │   └── SliderCaptcha.vue  # 滑块验证码
│   │
│   ├── composables/            # 组合式函数
│   │   ├── useAuth.ts         # 认证逻辑
│   │   ├── useChat.ts         # 聊天逻辑
│   │   ├── useIframeBridge.ts # iframe 通信桥接
│   │   ├── useProjects.ts     # 项目管理
│   │   ├── useUsage.ts        # 使用量统计
│   │   └── useWebSocket.ts    # WebSocket 连接
│   │
│   ├── config/                 # 配置文件
│   │   └── quickActions.ts    # 快捷操作配置
│   │
│   ├── stores/                 # Pinia 状态管理
│   │   └── chat.ts            # 聊天状态
│   │
│   ├── utils/                  # 工具函数
│   │   ├── avatar.ts          # 头像处理
│   │   ├── device.ts          # 设备信息
│   │   ├── loading.ts         # 加载状态管理
│   │   ├── request.ts         # HTTP 请求封装
│   │   └── upload.ts          # 文件上传 (COS)
│   │
│   ├── views/                  # 页面视图
│   │   └── LoginView.vue      # 登录页
│   │
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 应用入口
│   └── style.css              # 全局样式
│
├── public/                     # 公共资源
│   └── mock/                  # Mock 数据
│
├── mock-server/                # Mock 服务器
├── docs/                       # 文档目录
├── exmaple/                    # 示例代码
│
├── index.html                  # HTML 入口
├── vite.config.ts             # Vite 配置
├── tailwind.config.js         # Tailwind 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖

总代码量: ~6500 行 (Vue + TypeScript)
```

## 核心功能

### 1. 用户认证
- 登录/注册系统
- 滑块验证码
- 实名认证
- Token 管理
- 设备配对验证

### 2. 多项目管理
- 项目切换
- 项目列表管理
- 项目相关会话隔离

### 3. AI 对话
- 实时消息流式传输 (WebSocket)
- Markdown 渲染支持
- 代码高亮
- 思考过程展示
- 语音输入
- 文件上传 (图片、文档)
- 快捷操作面板
- 会话历史管理

### 4. 业务系统集成
- iframe 嵌入业务系统
- 跨域消息通信 (postMessage)
- 双向数据交互
- 面板展开/收起

### 5. 使用量统计
- 实时使用量展示
- 进度条可视化
- 配额管理

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 环境变量

创建 `.env.local` 文件配置以下变量:

```env
# API 基础地址
VITE_API_BASE_URL=

# WebSocket 地址
VITE_OPENCLAW_WS_URL=ws://127.0.0.1:18789

# OpenClaw Token
VITE_OPENCLAW_TOKEN=

# 业务系统地址
VITE_BUSINESS_SYSTEM_URL=
VITE_BUSINESS_SYSTEM_ORIGIN=

# 腾讯云 COS 配置
VITE_COS_SECRET_ID=
VITE_COS_SECRET_KEY=
VITE_COS_BUCKET=
VITE_COS_REGION=
```

## 架构特点

- **组合式 API**: 使用 Vue 3 Composition API 实现逻辑复用
- **类型安全**: 全面的 TypeScript 类型定义
- **响应式设计**: Tailwind CSS 实现现代化 UI
- **模块化**: 清晰的目录结构和职责分离
- **实时通信**: WebSocket 实现低延迟消息传输
- **状态管理**: Pinia 管理全局状态
- **文件上传**: 集成腾讯云 COS 对象存储

## 浏览器支持

现代浏览器 (Chrome, Firefox, Safari, Edge 最新版本)

## License

Private
