const BASE_URL = '/api/v1/monitor'

/**
 * 通用请求封装（带指数退避重试）
 * @param {string} url 接口路径
 * @param {object} options fetch 选项
 * @param {number} retries 重试次数（默认2次）
 */
async function request(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(`${BASE_URL}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      const result = await response.json()
      if (result.code !== 200) {
        throw new Error(result.msg || '请求失败')
      }
      return result.data
    } catch (error) {
      if (i === retries) {
        console.error(`[API] ${url} 请求失败:`, error.message)
        throw error
      }
      console.warn(`[API] ${url} 第${i + 1}次重试...`)
      // 指数退避：第1次等1s，第2次等2s
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

/**
 * 获取门店树状菜单（按区域分组）
 * @returns {Promise<Array>} [{ id, label, type:'region', children: [{ id, label, type:'store' }] }]
 */
export async function fetchStoreTree() {
  return request('/store-tree')
}

/**
 * 获取指定门店的摄像头列表 + Token
 * @param {number} storeId 门店ID
 * @returns {Promise<{ accessToken: string, cameras: Array<{ id, name, hdUrl, sdUrl, validateCode }> }>}
 */
export async function fetchStoreCameras(storeId) {
  return request(`/stores/${storeId}/cameras`)
}

/**
 * 配送事件 API 基地址
 */
const DELIVERY_BASE = '/api/v1/delivery'

/**
 * 获取指定门店的配送事件列表
 * @param {number} storeId 门店ID
 * @param {string} [date] 查询日期，格式 yyyy-MM-dd，默认今天
 * @returns {Promise<{ orders: Array, storeId: number, date: string }>}
 */
export async function fetchDeliveryEvents(storeId, date) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  const qs = params.toString()
  const url = `${DELIVERY_BASE}/stores/${storeId}/events${qs ? '?' + qs : ''}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })
  const result = await res.json()
  if (result.code !== 200) throw new Error(result.msg || '获取配送事件失败')
  return result.data
}
