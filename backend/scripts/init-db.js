import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yingshi_monitor'
};

// 建表 SQL
const createTablesSQL = `
-- 门店表（50条记录）
CREATE TABLE IF NOT EXISTS \`stores\` (
  \`id\` INT NOT NULL AUTO_INCREMENT COMMENT '门店自增ID',
  \`store_name\` VARCHAR(100) NOT NULL COMMENT '门店名称',
  \`region\` VARCHAR(50) DEFAULT '华东区' COMMENT '所属区域，方便前端树状分类',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 摄像头资产表（约200条记录）
CREATE TABLE IF NOT EXISTS \`cameras\` (
  \`id\` INT NOT NULL AUTO_INCREMENT COMMENT '摄像头自增ID',
  \`store_id\` INT NOT NULL COMMENT '所属门店ID',
  \`camera_name\` VARCHAR(50) NOT NULL COMMENT '监控位置(如: 前台收银, 正门口, 后厨区)',
  \`device_serial\` VARCHAR(50) NOT NULL COMMENT '萤石设备序列号(9位大写字母/数字，如BC7900686)',
  \`channel_no\` INT NOT NULL DEFAULT 1 COMMENT '通道号(单路设备填1，多路路NVR填对应通道)',
  \`validate_code\` VARCHAR(10) DEFAULT NULL COMMENT '设备视频加密密码(机身6位大写字母，防前端报错弹窗)',
  PRIMARY KEY (\`id\`),
  KEY \`idx_store_id\` (\`store_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// 示例数据
const sampleDataSQL = `
-- 插入示例区域和门店数据
INSERT INTO \`stores\` (\`id\`, \`store_name\`, \`region\`) VALUES
(1, '上海南京东路店', '华东区'),
(2, '杭州西湖店', '华东区'),
(3, '苏州观前街店', '华东区'),
(4, '北京朝阳店', '华北区'),
(5, '天津和平店', '华北区'),
(6, '广州天河店', '华南区'),
(7, '深圳南山店', '华南区'),
(8, '成都春熙路店', '西南区'),
(9, '重庆解放碑店', '西南区'),
(10, '测试门店', '测试区');

-- 插入示例摄像头数据
INSERT INTO \`cameras\` (\`store_id\`, \`camera_name\`, \`device_serial\`, \`channel_no\`, \`validate_code\`) VALUES
-- 上海南京东路店 (4个摄像头)
(1, '前台收银', 'BC7900686', 1, 'ABCDEF'),
(1, '正门口', 'BC7900686', 2, 'ABCDEF'),
(1, '后厨区', 'BC7900686', 3, 'ABCDEF'),
(1, '货架区', 'BC7900686', 4, 'ABCDEF'),

-- 杭州西湖店 (3个摄像头)
(2, '前台收银', 'BC7900777', 1, 'XYZWMS'),
(2, '正门口', 'BC7900777', 2, 'XYZWMS'),
(2, '仓库', 'BC7900777', 3, 'XYZWMS'),

-- 北京朝阳店 (4个摄像头)
(4, '门口', 'BC7900888', 1, 'QWERTY'),
(4, '货架区', 'BC7900888', 2, 'QWERTY'),
(4, '收银', 'BC7900888', 3, 'QWERTY'),
(4, '仓库', 'BC7900888', 4, 'QWERTY'),

-- 测试门店 (4个摄像头)
(10, '01-正门口', 'BH3229101', 1, 'TEST01'),
(10, '02-大厅', 'BH2263101', 1, 'TEST02'),
(10, '03-货架区', 'BH7007439', 1, 'TEST03'),
(10, '04-仓库', 'BH2437709', 1, 'TEST04');
`;

async function initDatabase() {
  let connection;
  try {
    console.log('🔄 正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    console.log('🔄 正在创建数据表...');
    await connection.query(createTablesSQL);
    console.log('✅ 数据表创建成功');

    // 检查是否已有数据
    const [stores] = await connection.query('SELECT COUNT(*) as count FROM stores');
    if (stores[0].count === 0) {
      console.log('🔄 正在插入示例数据...');
      await connection.query(sampleDataSQL);
      console.log('✅ 示例数据插入成功');
    } else {
      console.log('ℹ️ 数据库中已有数据，跳过示例数据插入');
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log(`📊 当前门店数量: ${stores[0].count}`);
    
    const [cameras] = await connection.query('SELECT COUNT(*) as count FROM cameras');
    console.log(`📹 当前摄像头数量: ${cameras[0].count}`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
