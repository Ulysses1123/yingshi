// 模拟配送事件数据 — 模拟街顺 API 响应
// 按门店生成今日配送订单 + 事件时间线

// 哪些门店有"门口"摄像头 → 事件可关联到该摄像头
const DOOR_STORE_IDS = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  12, 13, 15, 16, 18, 19, 20, 23, 24, 25
]);

// 确定性伪随机（保证每次页面刷新数据一致）
function seeded(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 取系统当前"今天"的参考时间，但用 storeId 做偏移保证每个门店不同
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 为指定门店生成配送订单列表
 * @param {number} storeId
 * @returns {Array<{ id, status, displayStatus, events: Array<{ state, time, cameraHint }> }>}
 */
export function getDeliveryEvents(storeId) {
  const rand = seeded(storeId * 7 + 13);
  const today = getToday();
  const hasDoor = DOOR_STORE_IDS.has(storeId);
  const numOrders = 2 + Math.floor(rand() * 2); // 2~3 单

  const orders = [];
  for (let i = 0; i < numOrders; i++) {
    const orderId = 10000 + storeId * 100 + i;
    const baseMinute = Math.floor(rand() * 540) + 120; // 02:00 ~ 11:00 之间的分钟偏移
    const baseTime = new Date(today.getTime() + baseMinute * 60000);

    const events = [];

    // 待接单（骑手到店前 3~8 分钟）
    const waitMin = 3 + Math.floor(rand() * 6);
    const waitTime = new Date(baseTime.getTime() - waitMin * 60000);
    events.push({ state: '待接单', time: waitTime.toISOString(), cameraHint: null });

    // 骑手到店
    events.push({
      state: '骑手到店',
      time: baseTime.toISOString(),
      cameraHint: hasDoor ? '门口' : null,
    });

    // 配送中（到店后 5~25 秒）
    const deliveryDelaySec = 5 + Math.floor(rand() * 20);
    const deliveryTime = new Date(baseTime.getTime() + deliveryDelaySec * 1000);
    events.push({
      state: '配送中',
      time: deliveryTime.toISOString(),
      cameraHint: hasDoor ? '门口' : null,
    });

    // 决定订单状态
    const statusRoll = rand();
    let status, displayStatus;
    if (i === 0) {
      // 第一单总是完整的已送达
      status = 'delivered';
      displayStatus = '已送达';
    } else if (statusRoll < 0.5 || i === numOrders - 1) {
      status = 'delivering';
      displayStatus = '配送中';
    } else {
      status = 'delivered';
      displayStatus = '已送达';
    }

    if (status === 'delivered') {
      // 配送后 2~8 分钟完成
      const completeDelay = (2 + Math.floor(rand() * 6)) * 60000;
      events.push({
        state: '已完成',
        time: new Date(deliveryTime.getTime() + completeDelay).toISOString(),
        cameraHint: null,
      });
    }

    orders.push({ id: orderId, status, displayStatus, events });
  }

  return orders;
}
