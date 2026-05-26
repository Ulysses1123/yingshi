import { memoryDB } from '../config/memory-db.js';
import pool from '../config/database.js';

// 判断是否使用内存模式（数据库连接失败时自动降级）
// 默认使用内存模式（安全），仅当 MySQL 连接成功时才切换到数据库
let useMemory = true;

// 测试数据库连接
pool.getConnection()
  .then(conn => {
    useMemory = false;
    conn.release();
    console.log('✅ 使用 MySQL 数据库');
  })
  .catch(() => {
    console.log('⚠️  MySQL 连接失败，使用内存数据库模式');
  });

class StoreModel {
  /**
   * 获取所有门店，按区域分组
   */
  static async getAllGroupedByRegion() {
    if (useMemory) {
      return memoryDB.getStoresGroupedByRegion();
    }

    const [stores] = await pool.query(
      'SELECT id, store_name, region FROM stores ORDER BY region, id'
    );
    
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
  }

  /**
   * 根据ID获取门店信息
   */
  static async getById(storeId) {
    if (useMemory) {
      const store = memoryDB.stores.find(s => s.id === storeId);
      return store ? { id: store.id, store_name: store.store_name, region: store.region } : null;
    }

    const [rows] = await pool.query(
      'SELECT id, store_name, region FROM stores WHERE id = ?',
      [storeId]
    );
    return rows[0] || null;
  }

  /**
   * 检查门店是否存在
   */
  static async exists(storeId) {
    if (useMemory) {
      return memoryDB.storeExists(storeId);
    }

    const [rows] = await pool.query(
      'SELECT 1 FROM stores WHERE id = ? LIMIT 1',
      [storeId]
    );
    return rows.length > 0;
  }
}

export default StoreModel;
