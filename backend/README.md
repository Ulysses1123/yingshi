# 萤石视频监控后端服务

基于 Node.js + Express + MySQL + Redis 的视频监控后端服务，支持动态资产管理 + Token 缓存中转架构。

## 功能特性

- ✅ **门店树状菜单 API** - 按区域分组返回门店列表
- ✅ **摄像头流地址 API** - 返回 Token + 高清/流畅双码流地址
- ✅ **Token 自动缓存** - Redis 缓存萤石云 Token，避免频繁调用接口
- ✅ **双码流支持** - 单屏使用高清(hdUrl)，4分屏使用流畅(sdUrl)节省带宽
- ✅ **验证码自动下发** - 前端无需弹窗输入设备密码

## 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.x | Web 框架 |
| MySQL2 | 3.x | 数据库连接 |
| ioredis | 5.x | Redis 客户端 |
| axios | 1.x | HTTP 请求 |

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填写你的配置
```

### 3. 初始化数据库

```bash
# 确保 MySQL 和 Redis 已启动
npm run init-db
```

### 4. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

## API 接口文档

### 1. 获取门店树状菜单

```http
GET /api/v1/monitor/store-tree
```

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "region-1",
      "label": "华东区",
      "type": "region",
      "children": [
        {
          "id": 1,
          "label": "上海南京东路店",
          "type": "store"
        }
      ]
    }
  ]
}
```

### 2. 获取门店摄像头列表

```http
GET /api/v1/monitor/stores/:storeId/cameras
```

**响应示例：**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "accessToken": "ra.debff7xf3mgcps0j2m1ac76bd745p1pq-...",
    "cameras": [
      {
        "id": 101,
        "name": "前台收银",
        "hdUrl": "ezopen://open.ys7.com/BC7900686/1.live",
        "sdUrl": "ezopen://open.ys7.com/BC7900686/1.sub",
        "validateCode": "ABCDEF",
        "deviceSerial": "BC7900686",
        "channelNo": 1
      }
    ]
  }
}
```

### 3. Token 状态监控

```http
GET /api/v1/monitor/token/status
```

### 4. 强制刷新 Token

```http
POST /api/v1/monitor/token/refresh
```

## 数据库表结构

### stores（门店表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键自增 |
| store_name | VARCHAR(100) | 门店名称 |
| region | VARCHAR(50) | 所属区域 |

### cameras（摄像头表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键自增 |
| store_id | INT | 所属门店ID（索引） |
| camera_name | VARCHAR(50) | 监控位置名称 |
| device_serial | VARCHAR(50) | 萤石设备序列号 |
| channel_no | INT | 通道号 |
| validate_code | VARCHAR(10) | 设备验证码 |

## 架构说明

### Token 缓存策略

1. **缓存位置**: Redis (`ezviz:access_token`)
2. **缓存时长**: 5天（432000秒）
3. **Token 有效期**: 萤石云 Token 有效期7天，我们提前2天刷新，确保服务不中断
4. **获取逻辑**: 先查缓存 → 缓存命中直接返回 → 缓存未命中调用萤石接口 → 写入缓存

### 双码流设计

- **高清地址 (hdUrl)**: `ezopen://.../1.live` - 单屏模式使用
- **流畅地址 (sdUrl)**: `ezopen://.../1.sub` - 4分屏模式使用，节省门店上行带宽

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| PORT | 否 | 服务端口，默认3000 |
| DB_HOST | 是 | MySQL 主机地址 |
| DB_USER | 是 | MySQL 用户名 |
| DB_PASSWORD | 是 | MySQL 密码 |
| DB_NAME | 是 | 数据库名 |
| REDIS_HOST | 是 | Redis 主机地址 |
| YS_APP_KEY | 是 | 萤石云 AppKey |
| YS_APP_SECRET | 是 | 萤石云 AppSecret |
| TOKEN_CACHE_TTL | 否 | Token缓存时间（秒），默认432000（5天） |

## 安全建议

1. **生产环境** 请配置防火墙，仅允许前端服务器 IP 访问后端 API
2. **萤石云凭证** (YS_APP_KEY, YS_APP_SECRET) 绝对不能暴露给前端
3. **建议启用 HTTPS**，防止 Token 被中间人截获
4. **Redis 建议设置密码**，并限制访问 IP
