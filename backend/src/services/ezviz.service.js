import axios from 'axios';
import redis from '../config/redis.js';
import { memoryDB } from '../config/memory-db.js';

// 判断是否使用内存缓存（Redis 连接失败时自动降级）
let useMemoryCache = false;

class EzvizService {
  // 延迟读取 process.env，避免模块导入时机问题
  static get YS_APP_KEY() { return process.env.YS_APP_KEY; }
  static get YS_APP_SECRET() { return process.env.YS_APP_SECRET; }
  static get TOKEN_CACHE_KEY() { return 'ezviz:access_token'; }
  static get TOKEN_CACHE_TTL() { return parseInt(process.env.TOKEN_CACHE_TTL || '432000'); }

  /**
   * 获取有效的萤石云 Token
   */
  static async getValidToken() {
    try {
      // 1. 优先从缓存获取 Token
      let cachedToken = null;

      if (!useMemoryCache) {
        try {
          cachedToken = await redis.get(EzvizService.TOKEN_CACHE_KEY);
        } catch (e) {
          useMemoryCache = true;
          console.log('⚠️  Redis 连接失败，使用内存缓存模式');
          cachedToken = memoryDB.getCachedToken();
        }
      } else {
        cachedToken = memoryDB.getCachedToken();
      }

      if (cachedToken) {
        console.log('✅ 从缓存获取 Token');
        return cachedToken;
      }

      // 2. 缓存不存在，调用萤石云接口获取新 Token
      console.log('🔄 缓存未命中，正在从萤石云获取新 Token...');
      return await this.fetchNewToken();

    } catch (error) {
      console.error('❌ 获取 Token 失败:', error.message);
      throw new Error('获取萤石云 Token 失败: ' + error.message);
    }
  }

  /**
   * 从萤石云接口获取新 Token
   */
  static async fetchNewToken() {
    if (!this.YS_APP_KEY || !this.YS_APP_SECRET) {
      throw new Error('未配置萤石云 AppKey 或 AppSecret');
    }

    try {
      const response = await axios.post(
        'https://open.ys7.com/api/lapp/token/get',
        `appKey=${encodeURIComponent(this.YS_APP_KEY)}&appSecret=${encodeURIComponent(this.YS_APP_SECRET)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10000
        }
      );

      const { code, msg, data } = response.data;

      if (code !== '200' && code !== 200) {
        throw new Error(`萤石接口返回错误: ${msg}`);
      }

      const newToken = data.accessToken;
      const expireTime = data.expireTime;

      // 3. 存入缓存
      if (!useMemoryCache) {
        try {
          await redis.setex(EzvizService.TOKEN_CACHE_KEY, EzvizService.TOKEN_CACHE_TTL, newToken);
        } catch (e) {
          useMemoryCache = true;
          memoryDB.setCachedToken(newToken, EzvizService.TOKEN_CACHE_TTL);
        }
      } else {
        memoryDB.setCachedToken(newToken, EzvizService.TOKEN_CACHE_TTL);
      }

      console.log('✅ 成功获取并缓存新 Token');
      console.log(`📅 Token 过期时间: ${new Date(expireTime).toLocaleString()}`);

      return newToken;

    } catch (error) {
      if (error.response) {
        console.error('萤石接口响应错误:', error.response.data);
        throw new Error(`萤石接口错误: ${error.response.data?.msg || error.message}`);
      }
      throw error;
    }
  }

  /**
   * 强制刷新 Token
   */
  static async refreshToken() {
    if (!useMemoryCache) {
      try {
        await redis.del(EzvizService.TOKEN_CACHE_KEY);
      } catch (e) {
        useMemoryCache = true;
        memoryDB.clearToken();
      }
    } else {
      memoryDB.clearToken();
    }

    console.log('🔄 已清除缓存，强制获取新 Token...');
    return await this.fetchNewToken();
  }

  /**
   * 获取 Token 缓存状态
   */
  static async getTokenStatus() {
    if (!useMemoryCache) {
      try {
        const ttl = await redis.ttl(EzvizService.TOKEN_CACHE_KEY);
        const token = await redis.get(EzvizService.TOKEN_CACHE_KEY);

        return {
          hasToken: !!token,
          ttlSeconds: ttl,
          ttlDays: ttl > 0 ? (ttl / 86400).toFixed(2) : 0,
          tokenPreview: token ? `${token.substring(0, 20)}...` : null,
          cacheMode: 'Redis'
        };
      } catch (e) {
        useMemoryCache = true;
      }
    }

    const status = memoryDB.getTokenStatus();
    return { ...status, cacheMode: 'Memory' };
  }
}

export default EzvizService;