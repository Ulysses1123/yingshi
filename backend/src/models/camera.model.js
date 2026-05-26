import { memoryDB } from '../config/memory-db.js';
import pool from '../config/database.js';

// 判断是否使用内存模式
// 默认使用内存模式（安全），仅当 MySQL 连接成功时才切换到数据库
let useMemory = true;

pool.getConnection()
  .then(conn => {
    useMemory = false;
    conn.release();
  })
  .catch(() => {
    // 保持内存模式
  });

class CameraModel {
  /**
   * 根据门店ID获取所有摄像头
   */
  static async getByStoreId(storeId) {
    if (useMemory) {
      return memoryDB.getCamerasByStoreId(storeId);
    }

    const [rows] = await pool.query(
      `SELECT 
        id,
        camera_name,
        device_serial,
        channel_no,
        validate_code
      FROM cameras 
      WHERE store_id = ?
      ORDER BY id`,
      [storeId]
    );
    return rows;
  }

  /**
   * 获取摄像头详情
   */
  static async getById(cameraId) {
    if (useMemory) {
      const camera = memoryDB.cameras.find(c => c.id === cameraId);
      if (!camera) return null;
      const store = memoryDB.stores.find(s => s.id === camera.store_id);
      return { ...camera, store_name: store?.store_name };
    }

    const [rows] = await pool.query(
      `SELECT 
        c.*,
        s.store_name
      FROM cameras c
      JOIN stores s ON c.store_id = s.id
      WHERE c.id = ?`,
      [cameraId]
    );
    return rows[0] || null;
  }

  /**
   * 生成 ezopen 直播 URL
   */
  static generateEzopenUrl(camera, isHD = true) {
    const suffix = isHD ? '.hd.live' : '.live';
    return `ezopen://open.ys7.com/${camera.device_serial}/${camera.channel_no}${suffix}`;
  }

  /**
   * 生成 ezopen 回放 URL
   * @param {object} camera 摄像头对象
   * @param {string} [begin] 开始时间 yyyyMMddHHmmss
   * @param {string} [end] 结束时间 yyyyMMddHHmmss
   * @param {boolean} [isCloud=false] 是否云存储回放
   */
  static generatePlaybackUrl(camera, begin, end, isCloud = false) {
    const suffix = isCloud ? '.cloud.rec' : '.rec';
    let url = `ezopen://open.ys7.com/${camera.device_serial}/${camera.channel_no}${suffix}`;
    if (begin && end) {
      url += `?begin=${begin}&end=${end}`;
    }
    return url;
  }

  /**
   * 获取门店摄像头完整数据（包含生成的URL）
   */
  static async getCamerasWithUrls(storeId) {
    const cameras = await this.getByStoreId(storeId);
    
    return cameras.map(camera => ({
      id: camera.id,
      name: camera.camera_name,
      hdUrl: this.generateEzopenUrl(camera, true),
      sdUrl: this.generateEzopenUrl(camera, false),
      recUrl: this.generatePlaybackUrl(camera, null, null, false),
      cloudRecUrl: this.generatePlaybackUrl(camera, null, null, true),
      hasCloudStorage: !!camera.cloud_storage,
      validateCode: camera.validate_code,
      deviceSerial: camera.device_serial,
      channelNo: camera.channel_no
    }));
  }
}

export default CameraModel;
