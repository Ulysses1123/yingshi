// 内存数据库 - 用于快速开发测试，无需安装 MySQL/Redis

// 门店数据（来自 监控资产.xlsx）
const stores = [
  // ── 上海（19家） ──
  { id: 1, store_name: '南翔', region: '上海' },
  { id: 2, store_name: '周浦', region: '上海' },
  { id: 3, store_name: '唐镇', region: '上海' },
  { id: 4, store_name: '大场店', region: '上海' },
  { id: 5, store_name: '奉贤', region: '上海' },
  { id: 6, store_name: '延安西路', region: '上海' },
  { id: 7, store_name: '张江', region: '上海' },
  { id: 8, store_name: '徐汇', region: '上海' },
  { id: 9, store_name: '曹路', region: '上海' },
  { id: 10, store_name: '松江大学城', region: '上海' },
  { id: 11, store_name: '浦江由谷', region: '上海' },
  { id: 12, store_name: '莘庄', region: '上海' },
  { id: 13, store_name: '菊园', region: '上海' },
  { id: 14, store_name: '虹口', region: '上海' },
  { id: 15, store_name: '长寿路', region: '上海' },
  { id: 16, store_name: '闵行交大', region: '上海' },
  { id: 17, store_name: '陆家嘴', region: '上海' },
  { id: 18, store_name: '颛桥', region: '上海' },
  { id: 19, store_name: '黄埔', region: '上海' },
  { id: 20, store_name: '双桥', region: '上海' },
  { id: 21, store_name: '吴江', region: '苏州' },
  { id: 22, store_name: '木渎', region: '苏州' },
  { id: 23, store_name: '狮山', region: '苏州' },
  { id: 24, store_name: '相城店', region: '苏州' },
  { id: 25, store_name: '苏州站', region: '苏州' },
  // ── 其他/测试设备 ──
  { id: 26, store_name: '测试设备（C6CN）', region: '其他' },
  { id: 27, store_name: '测试设备（CTQ6N/H6c/XP1）', region: '其他' },
  { id: 28, store_name: 'CS 设备', region: '其他' },
];

// 摄像头数据（来自 监控资产.xlsx，以店内分区命名）
const cameras = [
  // ── 上海 ──
  // 南翔
  { id: 1001, store_id: 1, camera_name: 'A B区', device_serial: 'E37281584', channel_no: 1, validate_code: null },
  { id: 1002, store_id: 1, camera_name: 'A区', device_serial: 'BK4511463', channel_no: 1, validate_code: null },
  { id: 1003, store_id: 1, camera_name: '打包台', device_serial: 'BK3578228', channel_no: 1, validate_code: null },
  { id: 1004, store_id: 1, camera_name: '门口', device_serial: 'D10406003', channel_no: 1, validate_code: null },
  // 周浦
  { id: 1005, store_id: 2, camera_name: 'A B区', device_serial: 'E37281843', channel_no: 1, validate_code: null },
  { id: 1006, store_id: 2, camera_name: 'A C区', device_serial: 'BK4511184', channel_no: 1, validate_code: null },
  { id: 1007, store_id: 2, camera_name: '打包台', device_serial: 'BK3578371', channel_no: 1, validate_code: null },
  { id: 1008, store_id: 2, camera_name: '门口', device_serial: 'D10406093', channel_no: 1, validate_code: null },
  // 唐镇
  { id: 1009, store_id: 3, camera_name: '门口', device_serial: 'D10406233', channel_no: 1, validate_code: null },
  // 大场店
  { id: 1010, store_id: 4, camera_name: 'A B区', device_serial: 'E46759868', channel_no: 1, validate_code: null },
  { id: 1011, store_id: 4, camera_name: 'B区', device_serial: 'BK2284902', channel_no: 1, validate_code: null },
  { id: 1012, store_id: 4, camera_name: '打包台', device_serial: 'BH3229580', channel_no: 1, validate_code: null },
  { id: 1013, store_id: 4, camera_name: '门口', device_serial: 'D10404068', channel_no: 1, validate_code: null },
  // 奉贤
  { id: 1014, store_id: 5, camera_name: 'A区', device_serial: 'BK3042499', channel_no: 1, validate_code: null },
  { id: 1015, store_id: 5, camera_name: 'B C区', device_serial: 'E37281879', channel_no: 1, validate_code: null },
  { id: 1016, store_id: 5, camera_name: '打包台', device_serial: 'BH3228947', channel_no: 1, validate_code: null },
  { id: 1017, store_id: 5, camera_name: '门口', device_serial: 'D10405824', channel_no: 1, validate_code: null },
  // 延安西路
  { id: 1018, store_id: 6, camera_name: 'A B区', device_serial: 'BK2284756', channel_no: 1, validate_code: null },
  { id: 1019, store_id: 6, camera_name: 'C D区', device_serial: 'E83077529', channel_no: 1, validate_code: null },
  { id: 1020, store_id: 6, camera_name: '打包台', device_serial: 'BH3229578', channel_no: 1, validate_code: null },
  { id: 1021, store_id: 6, camera_name: '门口', device_serial: 'D10405611', channel_no: 1, validate_code: null },
  // 张江
  { id: 1022, store_id: 7, camera_name: 'A区', device_serial: 'E37234576', channel_no: 1, validate_code: null },
  { id: 1023, store_id: 7, camera_name: 'C区 A区', device_serial: 'BH6373593', channel_no: 1, validate_code: null },
  { id: 1024, store_id: 7, camera_name: '打包台', device_serial: 'BH3229260', channel_no: 1, validate_code: null },
  { id: 1025, store_id: 7, camera_name: '门口', device_serial: 'D00331312', channel_no: 1, validate_code: null },
  // 徐汇
  { id: 1026, store_id: 8, camera_name: 'A区 B区', device_serial: 'BH6373991', channel_no: 1, validate_code: null },
  { id: 1027, store_id: 8, camera_name: 'C区 D区', device_serial: 'BH7447759', channel_no: 1, validate_code: null },
  { id: 1028, store_id: 8, camera_name: '操作台', device_serial: 'BH3229294', channel_no: 1, validate_code: null },
  { id: 1029, store_id: 8, camera_name: '门口', device_serial: 'E51494924', channel_no: 1, validate_code: null },
  // 曹路
  { id: 1030, store_id: 9, camera_name: 'A B C区', device_serial: 'E37281948', channel_no: 1, validate_code: null },
  { id: 1031, store_id: 9, camera_name: '店内', device_serial: 'BK4511587', channel_no: 1, validate_code: null },
  { id: 1032, store_id: 9, camera_name: '打包台', device_serial: 'BK3578342', channel_no: 1, validate_code: null },
  { id: 1033, store_id: 9, camera_name: '门口', device_serial: 'D10406229', channel_no: 1, validate_code: null },
  // 松江大学城
  { id: 1034, store_id: 10, camera_name: 'A区 B区', device_serial: 'E40225285', channel_no: 1, validate_code: null },
  { id: 1035, store_id: 10, camera_name: '商品区', device_serial: 'BH2650324', channel_no: 1, validate_code: null },
  { id: 1036, store_id: 10, camera_name: '打包台', device_serial: 'BH3228995', channel_no: 1, validate_code: null },
  { id: 1037, store_id: 10, camera_name: '门口', device_serial: 'D00331570', channel_no: 1, validate_code: null },
  // 浦江由谷
  { id: 1038, store_id: 11, camera_name: 'A区', device_serial: 'BH6373999', channel_no: 1, validate_code: null },
  { id: 1039, store_id: 11, camera_name: 'B区', device_serial: 'BH3229638', channel_no: 1, validate_code: null },
  { id: 1040, store_id: 11, camera_name: 'C区', device_serial: 'E37234445', channel_no: 1, validate_code: null },
  { id: 1041, store_id: 11, camera_name: '门口', device_serial: 'D00331642', channel_no: 1, validate_code: null },
  // 莘庄
  { id: 1042, store_id: 12, camera_name: 'A C区', device_serial: 'BH6373941', channel_no: 1, validate_code: null },
  { id: 1043, store_id: 12, camera_name: 'B区', device_serial: 'E37225084', channel_no: 1, validate_code: null },
  { id: 1044, store_id: 12, camera_name: '打包台', device_serial: 'BH3229381', channel_no: 1, validate_code: null },
  { id: 1045, store_id: 12, camera_name: '门口', device_serial: 'BH2437461', channel_no: 1, validate_code: null },
  // 菊园
  { id: 1046, store_id: 13, camera_name: 'A B区', device_serial: 'E37281520', channel_no: 1, validate_code: null },
  { id: 1047, store_id: 13, camera_name: 'C区', device_serial: 'BK4511582', channel_no: 1, validate_code: null },
  { id: 1048, store_id: 13, camera_name: '打包台', device_serial: 'BK3578352', channel_no: 1, validate_code: null },
  { id: 1049, store_id: 13, camera_name: '门口', device_serial: 'D10405879', channel_no: 1, validate_code: null },
  // 虹口
  { id: 1050, store_id: 14, camera_name: 'A B C区', device_serial: 'BK2284911', channel_no: 1, validate_code: null },
  { id: 1051, store_id: 14, camera_name: '打包台', device_serial: 'BH3229561', channel_no: 1, validate_code: null },
  { id: 1052, store_id: 14, camera_name: '环境', device_serial: 'G11379100', channel_no: 1, validate_code: null },
  // 长寿路
  { id: 1053, store_id: 15, camera_name: '未分区', device_serial: 'BH3229621', channel_no: 1, validate_code: null },
  { id: 1054, store_id: 15, camera_name: 'A区 B区', device_serial: 'E37250588', channel_no: 1, validate_code: null },
  { id: 1055, store_id: 15, camera_name: 'D区 打包台', device_serial: 'BH6373804', channel_no: 1, validate_code: null },
  { id: 1056, store_id: 15, camera_name: '门口', device_serial: 'D00331818', channel_no: 1, validate_code: null },
  // 闵行交大
  { id: 1057, store_id: 16, camera_name: 'A B C区', device_serial: 'BK0533904', channel_no: 1, validate_code: null },
  { id: 1058, store_id: 16, camera_name: 'C区', device_serial: 'BK5792996', channel_no: 1, validate_code: null },
  { id: 1059, store_id: 16, camera_name: '打包台', device_serial: 'BK3577905', channel_no: 1, validate_code: null },
  { id: 1060, store_id: 16, camera_name: '门口', device_serial: 'D10405859', channel_no: 1, validate_code: null },
  // 陆家嘴
  { id: 1061, store_id: 17, camera_name: 'A区', device_serial: 'BH2437709', channel_no: 1, validate_code: null },
  { id: 1062, store_id: 17, camera_name: 'B区', device_serial: 'BH7007439', channel_no: 1, validate_code: null },
  { id: 1063, store_id: 17, camera_name: 'C区', device_serial: 'BH2263101', channel_no: 1, validate_code: null },
  { id: 1064, store_id: 17, camera_name: '打包台', device_serial: 'BH3229101', channel_no: 1, validate_code: null },
  // 颛桥
  { id: 1065, store_id: 18, camera_name: 'A B C区', device_serial: 'BH3228993', channel_no: 1, validate_code: null },
  { id: 1066, store_id: 18, camera_name: 'A区 B区', device_serial: 'BH6373785', channel_no: 1, validate_code: null },
  { id: 1067, store_id: 18, camera_name: 'C区 打包台', device_serial: 'E37246720', channel_no: 1, validate_code: null },
  { id: 1068, store_id: 18, camera_name: '门口', device_serial: 'D00331835', channel_no: 1, validate_code: null },
  // 黄埔
  { id: 1069, store_id: 19, camera_name: 'A区、B区', device_serial: 'BH6373879', channel_no: 1, validate_code: null },
  { id: 1070, store_id: 19, camera_name: 'C区、D区', device_serial: 'BH7464626', channel_no: 1, validate_code: null },
  { id: 1071, store_id: 19, camera_name: '打包台', device_serial: 'BH3229298', channel_no: 1, validate_code: null },
  { id: 1072, store_id: 19, camera_name: '门口', device_serial: 'E51494939', channel_no: 1, validate_code: null },

  // ── 苏州 ──
  // 双桥
  { id: 1073, store_id: 20, camera_name: 'A B区', device_serial: 'E83077960', channel_no: 1, validate_code: null },
  { id: 1074, store_id: 20, camera_name: 'C区', device_serial: 'BK3042608', channel_no: 1, validate_code: null },
  { id: 1075, store_id: 20, camera_name: '打包台', device_serial: 'BH3228920', channel_no: 1, validate_code: null },
  { id: 1076, store_id: 20, camera_name: '门口', device_serial: 'G33190387', channel_no: 1, validate_code: null },
  // 吴江店
  { id: 1077, store_id: 21, camera_name: 'A B区', device_serial: 'BK0531783', channel_no: 1, validate_code: null },
  { id: 1078, store_id: 21, camera_name: '打包台', device_serial: 'BK3578301', channel_no: 1, validate_code: null },
  { id: 1079, store_id: 21, camera_name: '环境', device_serial: 'BK5793429', channel_no: 1, validate_code: null },
  // 木渎
  { id: 1080, store_id: 22, camera_name: '打包台', device_serial: 'BK3577839', channel_no: 1, validate_code: null },
  // 狮山路
  { id: 1081, store_id: 23, camera_name: 'A区', device_serial: 'E37281748', channel_no: 1, validate_code: null },
  { id: 1082, store_id: 23, camera_name: 'C B区', device_serial: 'BK2285061', channel_no: 1, validate_code: null },
  { id: 1083, store_id: 23, camera_name: '打包台', device_serial: 'BH3229434', channel_no: 1, validate_code: null },
  { id: 1084, store_id: 23, camera_name: '门口', device_serial: 'D10405620', channel_no: 1, validate_code: null },
  // 相城店
  { id: 1085, store_id: 24, camera_name: 'A B C区', device_serial: 'E83077493', channel_no: 1, validate_code: null },
  { id: 1086, store_id: 24, camera_name: 'C区', device_serial: 'BK2284476', channel_no: 1, validate_code: null },
  { id: 1087, store_id: 24, camera_name: '打包台', device_serial: 'BH3229506', channel_no: 1, validate_code: null },
  { id: 1088, store_id: 24, camera_name: '门口', device_serial: 'D10405600', channel_no: 1, validate_code: null },
  // 苏州
  { id: 1089, store_id: 25, camera_name: 'A B C区', device_serial: 'E40204649', channel_no: 1, validate_code: null },
  { id: 1090, store_id: 25, camera_name: 'A C区', device_serial: 'BH6373990', channel_no: 1, validate_code: null },
  { id: 1091, store_id: 25, camera_name: '打包台', device_serial: 'BH3229563', channel_no: 1, validate_code: null },
  { id: 1092, store_id: 25, camera_name: '门口', device_serial: 'D00331659', channel_no: 1, validate_code: null },

  // ── 其他/测试设备 ──
  // C6CN
  { id: 1093, store_id: 26, camera_name: 'C6CN', device_serial: 'D00331594', channel_no: 1, validate_code: null },
  { id: 1094, store_id: 26, camera_name: 'C6CN', device_serial: 'D00331685', channel_no: 1, validate_code: null },
  { id: 1095, store_id: 26, camera_name: 'C6CN', device_serial: 'D10406198', channel_no: 1, validate_code: null },
  // CTQ6N / H6c / XP1
  { id: 1096, store_id: 27, camera_name: 'CTQ6N', device_serial: 'BK2284897', channel_no: 1, validate_code: null },
  { id: 1097, store_id: 27, camera_name: 'CTQ6N', device_serial: 'BK5793194', channel_no: 1, validate_code: null },
  { id: 1098, store_id: 27, camera_name: 'CTQ6N', device_serial: 'BK5793361', channel_no: 1, validate_code: null },
  { id: 1099, store_id: 27, camera_name: 'H6c', device_serial: 'BK0536664', channel_no: 1, validate_code: null },
  { id: 1100, store_id: 27, camera_name: 'H6c', device_serial: 'BK0528290', channel_no: 1, validate_code: null },
  { id: 1101, store_id: 27, camera_name: 'XP1', device_serial: 'E40185618', channel_no: 1, validate_code: null },
  // CS 设备
  { id: 1102, store_id: 28, camera_name: 'CTQ8H', device_serial: 'BH3229013', channel_no: 1, validate_code: null },
  { id: 1103, store_id: 28, camera_name: 'CTQ8H', device_serial: 'BK3578026', channel_no: 1, validate_code: null },
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
