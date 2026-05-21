import { Router } from 'express';
import StoreModel from '../models/store.model.js';
import CameraModel from '../models/camera.model.js';
import EzvizService from '../services/ezviz.service.js';

const router = Router();

/**
 * @route GET /api/v1/monitor/store-tree
 * @desc 获取门店树状菜单（按区域分组）
 * @access Public
 */
router.get('/store-tree', async (req, res) => {
  try {
    const treeData = await StoreModel.getAllGroupedByRegion();
    
    res.json({
      code: 200,
      msg: 'success',
      data: treeData
    });
  } catch (error) {
    console.error('获取门店树失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取门店列表失败: ' + error.message,
      data: null
    });
  }
});

/**
 * @route GET /api/v1/monitor/stores/:storeId/cameras
 * @desc 获取指定门店的所有摄像头（包含 Token 和播放地址）
 * @access Public
 */
router.get('/stores/:storeId/cameras', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);

    // 验证门店ID
    if (isNaN(storeId) || storeId <= 0) {
      return res.status(400).json({
        code: 400,
        msg: '无效的门店ID',
        data: null
      });
    }

    // 检查门店是否存在
    const storeExists = await StoreModel.exists(storeId);
    if (!storeExists) {
      return res.status(404).json({
        code: 404,
        msg: '门店不存在',
        data: null
      });
    }

    // 并行获取 Token 和摄像头列表
    const [accessToken, cameras] = await Promise.all([
      EzvizService.getValidToken(),
      CameraModel.getCamerasWithUrls(storeId)
    ]);

    // 检查是否有摄像头
    if (cameras.length === 0) {
      return res.status(404).json({
        code: 404,
        msg: '该门店暂无摄像头',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: 'success',
      data: {
        accessToken,
        cameras
      }
    });

  } catch (error) {
    console.error('获取摄像头列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取摄像头列表失败: ' + error.message,
      data: null
    });
  }
});

/**
 * @route GET /api/v1/monitor/token/status
 * @desc 获取 Token 缓存状态（用于监控）
 * @access Public
 */
router.get('/token/status', async (req, res) => {
  try {
    const status = await EzvizService.getTokenStatus();
    res.json({
      code: 200,
      msg: 'success',
      data: status
    });
  } catch (error) {
    console.error('获取 Token 状态失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取 Token 状态失败: ' + error.message,
      data: null
    });
  }
});

/**
 * @route POST /api/v1/monitor/token/refresh
 * @desc 强制刷新 Token
 * @access Public
 */
router.post('/token/refresh', async (req, res) => {
  try {
    const newToken = await EzvizService.refreshToken();
    res.json({
      code: 200,
      msg: 'Token 刷新成功',
      data: {
        tokenPreview: newToken.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    console.error('刷新 Token 失败:', error);
    res.status(500).json({
      code: 500,
      msg: '刷新 Token 失败: ' + error.message,
      data: null
    });
  }
});

export default router;
