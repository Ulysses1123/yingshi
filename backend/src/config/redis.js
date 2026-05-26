import Redis from 'ioredis';

let retryCount = 0
const MAX_RETRIES = 3

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    retryCount = times
    if (times > MAX_RETRIES) {
      console.log('⚠️  Redis 无法连接，已停止重试（应用正常运行，使用内存缓存）');
      return null  // null = 停止重试
    }
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true,  // 不自动连接，由业务代码按需触发
});

redis.on('connect', () => {
  console.log('✅ Redis 连接成功');
});

redis.on('error', () => {
  // 只在重试次数耗尽时打印一次，避免刷屏
  if (retryCount === MAX_RETRIES + 1) {
    console.error('❌ Redis 连接失败，应用已自动切换到内存缓存模式');
  }
});

export default redis;
