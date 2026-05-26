import { Router } from 'express';
import StoreModel from '../models/store.model.js';
import { getDeliveryEvents } from '../config/delivery-db.js';
import JiashunService from '../services/jiashun.service.js';

const router = Router();

/**
 * 获取今天的日期字符串 yyyy-MM-dd
 */
function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * @route GET /api/v1/delivery/stores/:storeId/events
 * @desc 获取指定门店的配送事件（优先街顺 API，降级 mock）
 * @query date - 查询日期，格式 yyyy-MM-dd，默认今天
 * @access Public
 */
router.get('/stores/:storeId/events', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        code: 400,
        msg: '无效的门店ID',
        data: null,
      });
    }

    const storeExists = await StoreModel.exists(storeId);
    if (!storeExists) {
      return res.status(404).json({
        code: 404,
        msg: '门店不存在',
        data: null,
      });
    }

    const date = req.query.date || todayStr();

    // 优先使用街顺 API
    if (process.env.JS_APP_KEY && process.env.JS_APP_SECRET) {
      // 内部门店 ID → 街顺 store_id
      const jiashunStoreId = JiashunService.resolveStoreId(storeId);
      if (!jiashunStoreId) {
        // 该门店不在街顺平台，返回空
        console.log(`[配送] 门店 ${storeId} 无街顺映射，返回空`);
        return res.json({ code: 200, msg: 'success', data: { orders: [], storeId, date } });
      }
      try {
        console.log(`[配送] 门店 ${storeId} → 街顺 store_id=${jiashunStoreId}，日期: ${date}`);
        const data = await JiashunService.getStoreDeliveryEvents(jiashunStoreId, date);
        return res.json({ code: 200, msg: 'success', data });
      } catch (e) {
        console.warn(`[配送] 街顺 API 失败，降级到 mock:`, e.message);
        // 降级到 mock 数据
      }
    }

    // Mock 降级
    console.log(`[配送] 门店 ${storeId} 使用 mock 数据`);
    const orders = getDeliveryEvents(storeId);

    res.json({
      code: 200,
      msg: 'success (mock)',
      data: { orders, storeId, date },
    });
  } catch (error) {
    console.error('获取配送事件失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取配送事件失败: ' + error.message,
      data: null,
    });
  }
});

export default router;
