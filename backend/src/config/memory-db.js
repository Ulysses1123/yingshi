// 内存数据库 - 用于快速开发测试，无需安装 MySQL/Redis

// 示例门店数据
const stores = [
  { id: 1, store_name: '上海南京东路店', region: '华东区' },
  { id: 2, store_name: '杭州西湖店', region: '华东区' },
  { id: 3, store_name: '苏州观前街店', region: '华东区' },
  { id: 4, store_name: '北京朝阳店', region: '华北区' },
  { id: 5, store_name: '天津和平店', region: '华北区' },
  { id: 6, store_name: '广州天河店', region: '华南区' },
  { id: 7, store_name: '深圳南山店', region: '华南区' },
  { id: 8, store_name: '成都春熙路店', region: '西南区' },
  { id: 9, store_name: '重庆解放碑店', region: '西南区' },
  { id: 10, store_name: '测试门店', region: '测试区' },
];

// 示例摄像头数据（测试门店，使用真实设备）
const cameras = [
  // 测试门店 (4个摄像头，全部在线)
  { id: 1001, store_id: 10, camera_name: '01-正门口',   device_serial: 'BH3229101', channel_no: 1, validate_code: null },
  { id: 1002, store_id: 10, camera_name: '02-大厅',     device_serial: 'BH2263101', channel_no: 1, validate_code: null },
  { id: 1003, store_id: 10, camera_name: '03-货架区',   device_serial: 'BH7007439', channel_no: 1, validate_code: null },
  { id: 1004, store_id: 10, camera_name: '04-云储存测试', device_serial: 'BH3229506', channel_no: 1, validate_code: null, cloud_storage: true },
  { id: 1005, store_id: 10, camera_name: '05-仓库',     device_serial: 'BH2437709', channel_no: 1, validate_code: null },
];

// 内存 Token 缓存
const tokenCache = {
  token: null,
  expireAt: 0
};

export const memoryDB = {
  // 门店相关
  stores,
  cameras,
  
  // 获取所有门店按区域分组
  getStoresGroupedByRegion() {
    const regionMap = new Map();
    
    stores.forEach(store => {
      const region = store.region || '未分类';
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      regionMap.get(region).push({
        id: store.id,
        label: store.store_name,
        type: 'store'
      });
    });
    
    const result = [];
    let regionId = 1;
    regionMap.forEach((stores, regionName) => {
      result.push({
        id: `region-${regionId}`,
        label: regionName,
        type: 'region',
        children: stores
      });
      regionId++;
    });
    
    return result;
  },

  // 根据门店ID获取摄像头
  getCamerasByStoreId(storeId) {
    return cameras.filter(c => c.store_id === storeId);
  },

  // 检查门店是否存在
  storeExists(storeId) {
    return stores.some(s => s.id === storeId);
  },

  // Token 缓存操作
  getCachedToken() {
    const now = Date.now();
    if (tokenCache.token && tokenCache.expireAt > now) {
      return tokenCache.token;
    }
    return null;
  },

  setCachedToken(token, ttlSeconds) {
    tokenCache.token = token;
    tokenCache.expireAt = Date.now() + (ttlSeconds * 1000);
  },

  getTokenStatus() {
    const now = Date.now();
    const ttl = Math.floor((tokenCache.expireAt - now) / 1000);
    return {
      hasToken: !!tokenCache.token && tokenCache.expireAt > now,
      ttlSeconds: ttl > 0 ? ttl : 0,
      ttlDays: ttl > 0 ? (ttl / 86400).toFixed(2) : 0,
      tokenPreview: tokenCache.token ? `${tokenCache.token.substring(0, 20)}...` : null
    };
  },

  clearToken() {
    tokenCache.token = null;
    tokenCache.expireAt = 0;
  }
};

console.log('✅ 内存数据库已加载（无需 MySQL/Redis）');
console.log(`📊 门店数量: ${stores.length}`);
console.log(`📹 摄像头数量: ${cameras.length}`);
