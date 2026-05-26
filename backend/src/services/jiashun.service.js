import axios from 'axios';
import crypto from 'crypto';

/**
 * 街顺（外卖帮）即时零售服务开放平台 API 代理
 *
 * 文档: https://www.waisongbang.com/apiDoc/
 *
 * 签名规则（通用模式，如与实际不符请调整 generateSign）:
 *   1. 收集所有请求参数（系统级 + 业务级），排除 sign 字段
 *   2. 按 key 字母序排列
 *   3. 拼接为 key+value（无分隔符）
 *   4. 末尾追加 app_secret
 *   5. MD5 → 大写
 */
class JiashunService {
  // ── 环境变量（延迟读取，避免模块导入时机问题） ──
  static get JS_APP_KEY()    { return process.env.JS_APP_KEY; }
  static get JS_APP_SECRET() { return process.env.JS_APP_SECRET; }
  static get JS_API_BASE()   { return process.env.JS_API_BASE || 'https://e.waisongbang.com/OpenApi'; }
  static get JS_THIRD_PARTNER_ID() { return process.env.JS_THIRD_PARTNER_ID || null; }

  /**
   * 内部门店 ID → 街顺 store_id 映射
   * key: 萤石系统的内部门店ID，value: 街顺平台的 store_id
   */
  static get STORE_ID_MAP() {
    return {
      1: 1360353,   // 南翔 → 上海-图拉斯专卖店（南翔店）
      2: 1331189,   // 周浦 → 上海-图拉斯专卖店（周浦店）
      4: 1200306,   // 大场店 → 上海-图拉斯专卖店(大场店)
      5: 1300501,   // 奉贤 → 上海-图拉斯专卖店（奉贤店）
      6: 1200308,   // 延安西路 → 上海-图拉斯专卖店(延安西路店)
      7: 1178658,   // 张江 → 上海-图拉斯专卖店(张江店)
      8: 1166035,   // 徐汇 → 上海-图拉斯专卖店(徐汇店)
      9: 1330103,   // 曹路 → 上海-图拉斯专卖店(曹路店)
      10: 1186074,  // 松江大学城 → 上海-图拉斯专卖店(松江大学城店)
      11: 1186076,  // 浦江由谷 → 上海-图拉斯专卖店(浦江店)
      12: 1173956,  // 莘庄 → 上海-图拉斯专卖店(莘庄店)
      13: 1360352,  // 菊园 → 上海-图拉斯专卖店（菊园店）
      14: 1200307,  // 虹口 → 上海-图拉斯专卖店(虹口店)
      15: 1184679,  // 长寿路 → 上海-图拉斯专卖店(长寿路店)
      17: 1142045,  // 陆家嘴 → 上海-图拉斯专卖店(陆家嘴店)
      18: 1186075,  // 颛桥 → 上海-图拉斯专卖店(颛桥店)
      19: 1165529,  // 黄埔 → 上海-图拉斯专卖店(黄浦店)
      20: 1302957,  // 双桥 → 上海-图拉斯专卖店（双桥路店）
      25: 1183719,  // 苏州站 → 苏州-图拉斯专卖店(苏州站店)
    };
  }

  /**
   * 将内部门店 ID 解析为街顺 store_id
   * @param {number} internalId  萤石系统内部门店ID
   * @returns {number|null}
   */
  static resolveStoreId(internalId) {
    return this.STORE_ID_MAP[internalId] || null;
  }

  // ── 工具方法 ──

  /** 秒级时间戳 */
  static getTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * 计算签名
   * @param {Object} params 请求参数（不含 sign）
   * @returns {string} 小写 MD5 签名
   *
   * 签名规则（经测试验证）:
   *   1. 收集所有请求参数（系统级 + 业务级），排除 sign 字段
   *   2. 按 key 字母序排列
   *   3. 拼接为 key+value（无分隔符）
   *   4. 末尾追加 app_secret
   *   5. MD5 → 小写
   */
  static generateSign(params) {
    const sortedKeys = Object.keys(params)
      .filter(k => k !== 'sign')
      .sort();
    const raw = sortedKeys.map(k => `${k}${params[k]}`).join('');
    return crypto
      .createHash('md5')
      .update(raw + this.JS_APP_SECRET)
      .digest('hex')
      .toLowerCase();   // <-- 小写！经测试验证
  }

  /**
   * 构建系统级参数（不含业务参数和 sign）
   */
  static baseParams() {
    const params = {
      app_key: this.JS_APP_KEY,
      timestamp: this.getTimestamp(),
      version: '1.0',
    };
    if (this.JS_THIRD_PARTNER_ID) {
      params.third_partner_id = parseInt(this.JS_THIRD_PARTNER_ID, 10);
    }
    return params;
  }

  /**
   * 发送街顺 API 请求
   * @param {string} path  接口路径，如 '/order/list'
   * @param {Object} bizParams 业务参数
   * @returns {Promise<Object>} API 响应的 data 字段
   */
  static async request(path, bizParams = {}) {
    if (!this.JS_APP_KEY || !this.JS_APP_SECRET) {
      throw new Error('未配置街顺 API 密钥 (JS_APP_KEY / JS_APP_SECRET)');
    }

    const body = {
      ...this.baseParams(),
      ...bizParams,
    };
    body.sign = this.generateSign(body);

    const url = `${this.JS_API_BASE}${path}`;
    console.log(`[街顺] POST ${url}`);

    try {
      const response = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      const { code, msg, data } = response.data;
      if (code !== 0 && code !== '0') {
        throw new Error(`街顺接口返回错误 [${code}]: ${msg}`);
      }
      if (data === null || data === undefined) {
        throw new Error(`街顺接口返回空数据: ${msg || 'unknown'}`);
      }
      return data;
    } catch (error) {
      if (error.response) {
        const body = error.response.data;
        throw new Error(`街顺 API 错误 [${error.response.status}]: ${JSON.stringify(body)}`);
      }
      throw error;
    }
  }

  // ── 业务接口 ──

  /**
   * 获取订单列表（支持分页，自动翻页直到取完）
   * @param {number} jiashunStoreId  街顺平台的 store_id
   * @param {string} startDate  yyyy-MM-dd
   * @param {string} endDate    yyyy-MM-dd
   * @returns {Promise<Array>} 订单列表
   */
  static async getOrderList(jiashunStoreId, startDate, endDate) {
    const allOrders = [];
    let page = 1;
    const pageSize = 200; // 最大分页大小
    let hasMore = true;

    while (hasMore) {
      const data = await this.request('/order/list', {
        store_id: jiashunStoreId,
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize,
      });

      const list = data.lists || data.list || [];
      allOrders.push(...list);

      // 判断是否还有下一页
      const total = data.total || 0;
      hasMore = allOrders.length < total && list.length === pageSize;
      page++;

      if (!hasMore) break;
    }

    console.log(`[街顺] 门店 ${jiashunStoreId} ${startDate} 共获取 ${allOrders.length} 个订单`);
    return allOrders;
  }

  /**
   * 获取单个订单的配送时间线（配送日志）
   * 文档: https://www.waisongbang.com/apiDoc/#/delivery/logs
   *
   * 响应 data 是数组（可能为空），每个元素是一条配送运单记录，
   * 每条记录含 timeline 数组，包含 骑手到店/配送中/已完成 等事件。
   *
   * @param {string} platformOrderId
   * @returns {Promise<Array>} 配送记录数组
   */
  static async getDeliveryRecords(platformOrderId) {
    return this.request(`/deliver/records/${platformOrderId}`);
  }

  /**
   * 获取门店某天的配送事件
   *
   * 策略：
   *   1. 从 /order/list 获取当天订单列表
   *   2. 对每个订单尝试调用 /deliver/records/{id} 获取配送时间线
   *   3. 有配送记录的 → 从 timeline 提取 骑手到店/配送中 事件
   *   4. 无配送记录的 → 从订单字段（deliver_status / pickup_time）推导
   *
   * @param {number} jiashunStoreId  街顺平台的 store_id（非内部门店ID）
   * @param {string} date  yyyy-MM-dd
   * @returns {Promise<{ orders: Array, storeId: number, date: string }>}
   */
  static async getStoreDeliveryEvents(jiashunStoreId, date) {
    if (!this.JS_APP_KEY || !this.JS_APP_SECRET) {
      throw new Error('未配置街顺 API 密钥，无法查询配送事件');
    }

    // 1. 获取当天订单列表
    const rawOrders = await this.getOrderList(jiashunStoreId, date, date);

    // 2. 逐个获取配送时间线（并行）
    const enriched = await Promise.all(
      rawOrders.map(async (order) => {
        try {
          const records = await this.getDeliveryRecords(order.platform_order_id);
          // records 是数组，找最新一条有效的配送记录
          const activeRecord = this.findActiveDeliveryRecord(records);
          if (activeRecord) {
            return this.transformOrderWithTimeline(order, activeRecord);
          }
        } catch (e) {
          console.warn(`[街顺] 配送日志查询失败 (${order.platform_order_id}):`, e.message);
        }
        // 降级：从订单字段推导
        return this.transformOrder(order);
      })
    );

    return { orders: enriched, storeId: jiashunStoreId, date };
  }

  /**
   * 从配送记录数组中找最新一条有效的（已完成 > 配送中 > 待取货）
   */
  static findActiveDeliveryRecord(records) {
    if (!Array.isArray(records) || records.length === 0) return null;
    // 按 state 优先级：已完成(4) > 配送中(3) > 待取货(2)
    const priority = [4, 3, 2, 1, 5, 0];
    for (const p of priority) {
      const found = records.find(r => r.state === p);
      if (found) return found;
    }
    return records[records.length - 1]; // 兜底取最后一条
  }

  /**
   * 使用配送记录 timeline 转换订单（有精确事件时间）
   */
  static transformOrderWithTimeline(order, deliveryRecord) {
    const timeline = deliveryRecord.timeline || [];
    const targetStates = ['骑手到店', '配送中'];

    const events = timeline
      .filter(e => targetStates.includes(e.state_name))
      .map(e => ({
        state: e.state_name,
        time: this.toISO(e.created),
        cameraHint: null,
        driverName: e.driver_name || null,
        driverPhone: e.driver_phone || null,
      }));

    // 如果 timeline 没有目标事件，补一个 order_time 作为基础
    if (events.length === 0 && order.order_time) {
      events.unshift({
        state: '已下单',
        time: this.toISO(order.order_time),
        cameraHint: null,
      });
    }

    const statusInfo = this.deriveStatus(order);

    return {
      id: order.platform_order_id,
      status: statusInfo.status,
      displayStatus: statusInfo.displayStatus,
      events,
      platformName: order.platform_name || '',
      wayName: deliveryRecord.way_name || order.deliver_type_desc || '',
      driverName: deliveryRecord.driver_name || null,
      driverPhone: deliveryRecord.driver_phone || null,
      orderTime: order.order_time || null,
      orderAmount: order.order_amount || 0,
    };
  }

  /**
   * 将订单数据转换为前端 DeliveryPanel 格式（从订单字段推导事件）
   *
   * 使用场景：/deliver/records 无数据时的降级方案
   * 事件推导：
   *   - deliver_status >= 2 → 骑手到店（用 order_time 近似）
   *   - deliver_status >= 3 + order_pickup_time → 配送中
   *   - deliver_status >= 4 + order_finish_time → 已完成
   */
  static transformOrder(order) {
    const events = [];

    // 骑手到店（骑手已接单/已到店，用下单时间近似）
    if (order.deliver_status >= 2 && order.order_time) {
      events.push({
        state: '骑手到店',
        time: this.toISO(order.order_time),
        cameraHint: null,
      });
    }

    // 配送中（骑手取货出发）
    if (order.deliver_status >= 3 && order.order_pickup_time) {
      events.push({
        state: '配送中',
        time: this.toISO(order.order_pickup_time),
        cameraHint: null,
      });
    }

    // 已完成
    if (order.deliver_status >= 4 && order.order_finish_time) {
      events.push({
        state: '已完成',
        time: this.toISO(order.order_finish_time),
        cameraHint: null,
      });
    }

    const statusInfo = this.deriveStatus(order);

    return {
      id: order.platform_order_id,
      status: statusInfo.status,
      displayStatus: statusInfo.displayStatus,
      events,
      platformName: order.platform_name || '',
      wayName: order.deliver_type_desc || '',
      driverName: null,
      driverPhone: null,
      orderTime: order.order_time || null,
      orderAmount: order.order_amount || 0,
    };
  }

  /**
   * 从订单 deliver_status 推导状态
   */
  static deriveStatus(order) {
    if (order.deliver_status !== undefined && order.deliver_status !== null) {
      const map = {
        1: { status: 'pending', displayStatus: '待接单' },
        2: { status: 'arrived', displayStatus: '骑手到店' },
        3: { status: 'delivering', displayStatus: '配送中' },
        4: { status: 'delivered', displayStatus: '已送达' },
        5: { status: 'cancelled', displayStatus: '已取消' },
      };
      return map[order.deliver_status] || { status: 'unknown', displayStatus: `状态${order.deliver_status}` };
    }
    return { status: 'pending', displayStatus: '待接单' };
  }

  /**
   * 时间格式转换: "2022-07-01 16:03:43" → ISO 8601
   */
  static toISO(dateStr) {
    if (!dateStr) return null;
    // "2022-07-01 16:03:43" → "2022-07-01T16:03:43"
    const t = dateStr.replace(' ', 'T');
    return new Date(t).toISOString();
  }
}

export default JiashunService;
