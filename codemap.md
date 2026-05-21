# yingshi — 萤石视频监控播放器 架构地图

## 项目概览

萤石(EZVIZ)视频监控播放器，用于多门店视频监控的 Web SPA。前端 Vue 3 + 暗色主题，后端 Node.js/Express 代理萤石云 API，支持 Redis + 内存两级缓存降级。

## 目录结构

```
yingshi/
├── src/                          # Vue 3 前端 (Vite, :5173)
│   ├── main.js                   # App bootstrap，全局注册 Element Plus
│   ├── App.vue                   # 根组件 — 门店树 + 视频墙 + 播放/回放管理
│   ├── api/index.js              # API 客户端（带指数退避重试）
│   └── components/
│       ├── EzPlayer.vue          # EZUIKit 播放器封装（含电子放大）
│       ├── HlsPlayer.vue         # HLS 播放器（hls.js + Safari 原生）
│       └── FlvPlayer.vue         # FLV 播放器（flv.js + 统计面板）
├── backend/                      # Express API 服务 (:3000)
│   ├── src/
│   │   ├── app.js                # Express 入口
│   │   ├── config/
│   │   │   ├── database.js       # MySQL 连接池
│   │   │   ├── redis.js          # ioredis 客户端
│   │   │   └── memory-db.js      # 内存降级 + 种子数据
│   │   ├── models/
│   │   │   ├── store.model.js    # 门店数据模型
│   │   │   └── camera.model.js   # 摄像头模型 + URL 生成
│   │   ├── services/
│   │   │   └── ezviz.service.js  # Token 获取/缓存/刷新
│   │   └── routes/
│   │       └── monitor.routes.js # /api/v1/monitor/* 路由
│   ├── scripts/
│   │   └── init-db.js            # MySQL 建表 + 种子数据
│   └── .env.example
├── index.html                    # SPA 入口
├── vite.config.js                # Vite 配置 + /api 代理
├── package.json
└── CLAUDE.md                     # AI 工作指南
```

## 核心架构

### 前端 (src/)

- **无路由、无状态管理** — 单页应用，所有状态在 `App.vue` 中用 `ref()`/`computed()` 管理
- **Composition API** (`<script setup>`) 贯穿全项目
- **Element Plus 全局注册** — 便利的内部工具风格（牺牲 tree-shaking）
- **数据流**: `App.vue` → `api/index.js` (fetch + 重试) → Vite 代理 → `localhost:3000`
- **播放器生命周期**: 点击门店 → `fetchStoreCameras(id)` → Vue 响应式挂载 `<EzPlayer>`
- **单屏/4分屏** (`isSingleScreen`): CSS Grid `.layout-1` / `.layout-4`
- **回放模式** (`isPlayback`): 切换至 `.rec` URL + 时间范围参数（`begin`/`end`），时间变化时 `playerKey` 自动更新强制重建播放器
- **回放无录像提示**: `isPlaybackMode` prop + `noRecording` ref，SDK 返回 420003 时显示"所选时段无录像，当前为直播画面"
- **电子放大** (`enableZoom`): 调用 SDK `player.enableZoom()`/`closeZoom()`

### 后端 (backend/)

- **优雅降级**: MySQL/Redis 不可用时自动切换到内存数据，零外部依赖可运行
- **Token 缓存**: Redis 缓存萤石云 Token (5天 TTL)，Redis 不可用时降级到进程内存
- **ezopen URL**: `CameraModel` 负责生成直播(`.hd.live`/`.live`)和回放(`.rec`) URL
- **内存种子数据**: 10 家门店、4路摄像头（真实萤石设备序列号）

### API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/v1/monitor/store-tree` | 区域→门店树 |
| `GET /api/v1/monitor/stores/:storeId/cameras` | Token + 摄像头列表 (hdUrl/sdUrl/recUrl) |
| `GET /api/v1/monitor/token/status` | Token 缓存状态 |
| `POST /api/v1/monitor/token/refresh` | 强制刷新 Token |
| `GET /health` | 健康检查 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 (Composition API) |
| UI 组件 | Element Plus |
| 视频 SDK | ezuikit-js (EZUIKitPlayer) |
| 构建工具 | Vite 6 |
| 后端 | Express + ESM |
| 数据库 | MySQL (降级: process memory) |
| 缓存 | Redis (降级: process memory) |
| 代理 | Vite dev proxy → :3000 |

## 关键设计决策

- **无路由/Pinia**: 足够简单，不增加复杂度
- **全局 Element Plus**: 内部工具优先于包体积
- **优雅降级**: 任何外部服务不可用都不影响核心功能
- **响应式播放器**: Vue 的 `v-for` + `:key` 驱动播放器挂载/销毁，无需手动管理
- **验证码注入**: `validateCode` 拼入 ezopen URL，避免 SDK 密码弹窗
