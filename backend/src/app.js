import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import monitorRoutes from './routes/monitor.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量 - 尝试多个路径
const envPaths = [
  join(__dirname, '../.env'),
  join(process.cwd(), '.env'),
  '.env'
];

let loaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log('✅ 已加载环境变量:', envPath);
    loaded = true;
    break;
  }
}

if (!loaded) {
  console.warn('⚠️  未能加载 .env 文件');
}

// 调试：检查环境变量
console.log('🔧 环境变量检查:');
console.log('   YS_APP_KEY:', process.env.YS_APP_KEY ? '已配置 (' + process.env.YS_APP_KEY.substring(0, 8) + '...)' : '未配置');
console.log('   YS_APP_SECRET:', process.env.YS_APP_SECRET ? '已配置 (' + process.env.YS_APP_SECRET.substring(0, 8) + '...)' : '未配置');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    msg: '服务正常运行',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: {
        hasAppKey: !!process.env.YS_APP_KEY,
        hasAppSecret: !!process.env.YS_APP_SECRET
      }
    }
  });
});

// API 路由
app.use('/api/v1/monitor', monitorRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    msg: '接口不存在',
    data: null
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误: ' + err.message,
    data: null
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n🚀 萤石视频监控后端服务已启动');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📋 API 文档:`);
  console.log(`   - 健康检查: GET http://localhost:${PORT}/health`);
  console.log(`   - 门店树:   GET http://localhost:${PORT}/api/v1/monitor/store-tree`);
  console.log(`   - 摄像头:   GET http://localhost:${PORT}/api/v1/monitor/stores/:storeId/cameras`);
  console.log(`   - Token状态: GET http://localhost:${PORT}/api/v1/monitor/token/status`);
  console.log(`   - 刷新Token: POST http://localhost:${PORT}/api/v1/monitor/token/refresh`);
  console.log('');
});

export default app;
