<template>
  <div class="monitor-container">
    <!-- 左侧：门店树 -->
    <div class="store-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">门店监控列表</span>
        <span class="sidebar-count">{{ storeCount }}家</span>
      </div>
      <div v-if="treeLoading" class="tree-loading">加载中...</div>
      <el-tree
        v-else
        ref="treeRef"
        :data="storeTreeData"
        node-key="id"
        :props="{ children: 'children', label: 'label' }"
        :highlight-current="true"
        :default-expand-all="true"
        expand-on-click-node
        @node-click="handleNodeClick"
        class="dark-tree"
      />
    </div>

    <!-- 右侧：主区域（视频 + 配送面板） -->
    <div class="main-area">
      <!-- 视频主内容 -->
      <div class="main-content">
        <div class="top-toolbar">
          <div class="toolbar-left">
            <span class="store-name">
              {{ currentStoreName || '未选择门店' }}
            </span>
            <span v-if="currentCameras.length" class="camera-count">
              {{ currentCameras.length }}路摄像头
            </span>
            <span v-if="apiLoading" class="loading-tag">加载中...</span>
          </div>
          <div class="toolbar-right">
            <div v-if="isPlayback && currentCameras.length" class="playback-time">
              <input
                type="date"
                :value="playbackDate"
                @change="setPlaybackDate($event.target.value)"
                class="date-input"
                title="选择回放日期"
              />
              <select
                v-model="playbackHour"
                class="hour-select"
                title="选择回放开始小时"
              >
                <option v-for="h in 24" :key="h-1" :value="h-1">
                  {{ String(h-1).padStart(2,'0') }}:00
                </option>
              </select>
              <button
                v-if="hasCloudStorageCamera"
                class="storage-toggle"
                :class="{ cloud: useCloudStorage }"
                @click="useCloudStorage = !useCloudStorage"
                :title="useCloudStorage ? '当前: 云存储' : '当前: 本地存储'"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:2px;vertical-align:-2px">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
                </svg>
                {{ useCloudStorage ? '云存储' : '本地' }}
              </button>
            </div>
            <input
              v-if="currentCameras.length"
              type="date"
              :value="deliveryDate"
              @change="deliveryDate = $event.target.value; loadDeliveryEvents(currentStoreId)"
              class="date-input"
              title="选择配送查询日期"
              style="width:130px"
            />
            <button
              v-if="currentCameras.length"
              class="delivery-toggle"
              :class="{ active: showDeliveryPanel }"
              @click="showDeliveryPanel = !showDeliveryPanel"
              title="配送事件"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:3px;vertical-align:-2px">
                <path d="M19 7h-3V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H5c-1.1 0-2 .9-2 2v1h18V9c0-1.1-.9-2-2-2zm-5 0h-4V6h4v1zM5 19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5v7z"/>
              </svg>
              配送
            </button>
            <div class="screen-toggle">
              <button
                :class="{ active: isSingleScreen }"
                @click="toggleScreen(true)"
              >
                <el-icon><FullScreen /></el-icon>
                单屏
              </button>
              <button
                :class="{ active: !isSingleScreen }"
                @click="toggleScreen(false)"
              >
                <el-icon><Grid /></el-icon>
                4分屏
              </button>
            </div>
            <button
              class="playback-btn"
              :class="{ active: isPlayback }"
              @click="togglePlayback"
              :disabled="!currentCameras.length"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="margin-right:3px;vertical-align:-2px">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7l6 3.5-6 3.5z"/>
              </svg>
              回放
            </button>
          </div>
        </div>

        <div ref="gridRef" class="video-grid" :class="isSingleScreen ? 'layout-1' : 'layout-4'">
          <div
            v-for="(slot, index) in visibleSlots"
            :key="slot.key"
            class="video-slot"
            :class="{ 'dblclick-fullscreen': !isSingleScreen }"
            @dblclick="!isSingleScreen && zoomToSingle(index)"
          >
            <div class="slot-header">
              <span class="slot-label">{{ slot.label }}</span>
              <span class="slot-status" :class="slot.connected ? 'online' : ''">
                {{ slot.connected ? (isPlayback ? '● 回放中' : '● 直播中') : '○ 未连接' }}
              </span>
            </div>
            <EzPlayer
              v-if="slot.camera"
              :key="playerKey(slot.camera, index)"
              :url="playerUrl(slot.camera)"
              :access-token="currentToken"
              :validate-code="slot.camera.validateCode"
              :enable-zoom="true"
              :is-playback-mode="isPlayback"
              :template="isPlayback ? 'pcRec' : 'pcLive'"
              @ready="onPlayerReady(index)"
              @error="onPlayerError(index, $event)"
            />
            <div v-else class="placeholder">
              <el-icon :size="48" color="#555"><VideoCameraFilled /></el-icon>
              <span>无信号</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧配送事件面板 -->
      <DeliveryPanel
        v-if="showDeliveryPanel && currentCameras.length"
        :orders="deliveryOrders"
        :loading="deliveryLoading"
        :active-key="activeDeliveryKey"
        @close="showDeliveryPanel = false"
        @jump-to-time="handleDeliveryJump"
        @play-segment="handleDeliveryPlaySegment"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FullScreen, Grid, VideoCameraFilled } from '@element-plus/icons-vue'
import { fetchStoreTree, fetchStoreCameras, fetchDeliveryEvents } from './api/index.js'
import EzPlayer from './components/EzPlayer.vue'
import DeliveryPanel from './components/DeliveryPanel.vue'

// ── 数据 ──
const storeTreeData = ref([])
const treeRef = ref(null)
const connectedFlags = ref({})
const treeLoading = ref(false)
const apiLoading = ref(false)

// 当前播放状态
const currentStoreName = ref('')
const currentStoreId = ref(null)
const currentToken = ref('')
const currentCameras = ref([])
const isSingleScreen = ref(false)
const gridRef = ref(null)

// 4分屏流缓存：从单屏切回4分屏时复用已加载的数据，避免重复 API 调用
const cachedStoreData = ref(null)  // { storeId, cameras, token }

// 回放模式
const isPlayback = ref(false)
const playbackDate = ref('')
const playbackHour = ref(0)
const useCloudStorage = ref(false)  // true=云存储回放, false=本地存储回放

// 配送事件（精确时间跳转）
const playbackExactParams = ref(null)  // { begin: 'yyyyMMddHHmmss', end: 'yyyyMMddHHmmss' } | null

// 配送面板
const showDeliveryPanel = ref(false)
const deliveryOrders = ref([])
const deliveryLoading = ref(false)
const activeDeliveryKey = ref('')
const deliveryDate = ref(todayStr())

// 门店总数（从树数据中计算）
const storeCount = computed(() => {
  let n = 0
  storeTreeData.value.forEach((r) => { if (r.children) n += r.children.length })
  return n
})

// 当前摄像头是否有支持云存储的
const hasCloudStorageCamera = computed(() =>
  currentCameras.value.some(c => c.hasCloudStorage)
)

// ── 页面加载时拉取门店树 ──
onMounted(async () => {
  treeLoading.value = true
  try {
    storeTreeData.value = await fetchStoreTree()
  } catch (e) {
    console.error('加载门店树失败:', e)
  } finally {
    treeLoading.value = false
  }
})

// ── 当前可见的槽位 ──
const visibleSlots = computed(() => {
  const cams = currentCameras.value
  if (!cams.length) return [{ key: 0, label: '', active: false, connected: false, camera: null }]

  const count = isSingleScreen.value ? 1 : Math.min(cams.length, 4)

  const slots = []
  for (let i = 0; i < count; i++) {
    const cam = cams[i]
    slots.push({
      key: i,
      label: cam?.name || `通道 ${i + 1}`,
      active: !!cam,
      camera: cam || null,
      connected: connectedFlags.value[i] || false,
    })
  }
  return slots
})

// ── 播放器事件 ──
const onPlayerReady = (index) => {
  connectedFlags.value[index] = true
}

const onPlayerError = (index, err) => {
  connectedFlags.value[index] = false
  console.error(`通道 ${index + 1} 播放错误:`, err)
}

// ── 回放 URL 构造 ──
function formatTimeParam(dateStr, hour) {
  const d = dateStr ? new Date(dateStr) : new Date()
  if (isNaN(d.getTime())) d.setTime(Date.now())
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(hour ?? 0).padStart(2, '0')
  return { begin: `${y}${m}${day}${h}0000`, end: `${y}${m}${day}235959` }
}

// 根据当前模式获取播放 URL
function playerUrl(camera) {
  if (!camera) return ''
  if (isPlayback.value) {
    let begin, end
    if (playbackExactParams.value) {
      // 配送事件精确跳转时间
      begin = playbackExactParams.value.begin
      end = playbackExactParams.value.end
    } else {
      // 普通小时级回放
      const params = formatTimeParam(playbackDate.value, playbackHour.value)
      begin = params.begin
      end = params.end
    }
    // 云存储优先（当用户选择云存储且摄像头支持时）
    const base = (useCloudStorage.value && camera.cloudRecUrl) ? camera.cloudRecUrl : camera.recUrl
    if (!base) return ''
    return base.includes('?') ? `${base}&begin=${begin}&end=${end}` : `${base}?begin=${begin}&end=${end}`
  }
  return isSingleScreen.value ? camera.hdUrl || '' : camera.sdUrl || ''
}

// 播放器 key（模式切换或回放时间变化时强制重建）
function playerKey(camera, index) {
  if (!camera) return `empty-${index}`
  const qual = isSingleScreen.value ? 'hd' : 'sd'
  const recType = isPlayback.value ? (useCloudStorage.value ? 'cloud' : 'rec') : qual
  const exactTag = playbackExactParams.value
    ? `-exact-${playbackExactParams.value.begin}`
    : ''
  const timeTag = isPlayback.value
    ? `${playbackDate.value || 'today'}-h${playbackHour.value}${exactTag}`
    : ''
  return `p-${camera.id}-${recType}-${timeTag}-${index}`
}

// 设置回放日期
function setPlaybackDate(value) {
  playbackDate.value = value
  connectedFlags.value = {}
}

// 切换直播/回放模式
const togglePlayback = () => {
  if (!currentCameras.value.length) return
  isPlayback.value = !isPlayback.value
  connectedFlags.value = {}
  resetExactPlayback()
  if (isPlayback.value && !playbackDate.value) {
    const today = new Date()
    playbackDate.value = today.toISOString().slice(0, 10)
    playbackHour.value = 0
  }
}

// ── 日期工具 ──
function todayStr() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ── 配送事件处理 ──

// 加载配送事件
async function loadDeliveryEvents(storeId) {
  if (!storeId) {
    deliveryOrders.value = []
    return
  }
  deliveryLoading.value = true
  try {
    const data = await fetchDeliveryEvents(storeId, deliveryDate.value)
    deliveryOrders.value = data.orders || []
  } catch (e) {
    console.error('加载配送事件失败:', e)
    deliveryOrders.value = []
  } finally {
    deliveryLoading.value = false
  }
}

/**
 * 点击时间线事件 → 跳转到精确时间
 * 所有摄像头切到回放模式，定位到该事件发生的秒级时间点
 */
function handleDeliveryJump({ time }) {
  const d = new Date(time)
  if (isNaN(d.getTime())) return
  const pad = (n) => String(n).padStart(2, '0')
  const begin = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  // End: 当前时间 + 5 分钟（给 SDK 充裕的定位范围）
  const endD = new Date(d.getTime() + 5 * 60000)
  const end = `${endD.getFullYear()}${pad(endD.getMonth()+1)}${pad(endD.getDate())}${pad(endD.getHours())}${pad(endD.getMinutes())}${pad(endD.getSeconds())}`

  playbackExactParams.value = { begin, end }
  // 同步日期/小时到事件时间
  playbackDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  playbackHour.value = d.getHours()

  if (!isPlayback.value) {
    isPlayback.value = true
  }
  connectedFlags.value = {}
}

/**
 * 点击"回放配送过程" → 从骑手到店到配送中
 */
function handleDeliveryPlaySegment({ begin: beginTime, end: endTime }) {
  const fmt = (iso) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  }
  const begin = fmt(beginTime)
  const end = fmt(endTime)
  if (!begin || !end) return

  playbackExactParams.value = { begin, end }
  const d = new Date(beginTime)
  playbackDate.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  playbackHour.value = d.getHours()

  if (!isPlayback.value) {
    isPlayback.value = true
  }
  connectedFlags.value = {}
}

// 重置精确回放参数
function resetExactPlayback() {
  playbackExactParams.value = null
}

// ── 点击树节点 ──
const handleNodeClick = async (data) => {
  console.log('TreeClick:', data?.type, data?.label, data?.id)

  // 区域节点 → 只展开收缩
  if (data?.type !== 'store') return

  // 已选中的同一门店且在4分屏 → 不重复操作
  if (currentStoreId.value === data.id && !isSingleScreen.value) return

  connectedFlags.value = {}
  isPlayback.value = false
  resetExactPlayback()

  // 从 API 拉取该门店的摄像头 + Token
  apiLoading.value = true
  try {
    const result = await fetchStoreCameras(data.id)

    isSingleScreen.value = false
    currentStoreId.value = data.id
    currentStoreName.value = data.label
    currentToken.value = result.accessToken
    currentCameras.value = result.cameras
    // 缓存摄像头数据，切分屏时复用
    cachedStoreData.value = { storeId: data.id, cameras: result.cameras, token: result.accessToken }

    // 自动加载该门店的配送事件
    loadDeliveryEvents(data.id)
    // 默认打开配送面板
    showDeliveryPanel.value = true
  } catch (e) {
    console.error('获取摄像头列表失败:', e)
    currentCameras.value = []
  } finally {
    apiLoading.value = false
  }
}

// ── 切换分屏 ──
const toggleScreen = async (single) => {
  if (isSingleScreen.value === single) return
  isSingleScreen.value = single
  connectedFlags.value = {}
  resetExactPlayback()

  // 从单屏切回4分屏：优先用缓存数据，避免重新加载
  if (!single && currentStoreId.value) {
    // 检查缓存是否命中
    if (cachedStoreData.value && cachedStoreData.value.storeId === currentStoreId.value) {
      currentCameras.value = cachedStoreData.value.cameras
      currentToken.value = cachedStoreData.value.token
      return
    }
    // 缓存未命中时才从 API 拉取
    apiLoading.value = true
    try {
      const result = await fetchStoreCameras(currentStoreId.value)
      currentToken.value = result.accessToken
      currentCameras.value = result.cameras
      // 更新缓存
      cachedStoreData.value = {
        storeId: currentStoreId.value,
        cameras: result.cameras,
        token: result.accessToken,
      }
    } catch (e) {
      console.error('切换分屏获取数据失败:', e)
    } finally {
      apiLoading.value = false
    }
  }
}

// ── 双击放大到单屏 ──
const zoomToSingle = async (slotIndex) => {
  if (isSingleScreen.value) return
  const cams = currentCameras.value
  if (!cams[slotIndex]) return

  // 重排：被双击的放到第1位
  const target = cams[slotIndex]
  currentCameras.value = [target, ...cams.filter((_, i) => i !== slotIndex && i < 4)]

  isSingleScreen.value = true
  connectedFlags.value = {}
  resetExactPlayback()
}
</script>

<style>
/* 全局重置 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.monitor-container {
  display: flex;
  height: 100vh;
  background: #0a0a0a;
  color: #e0e0e0;
}

/* ── 左侧门店树 ── */
.store-sidebar {
  width: 240px;
  min-width: 240px;
  background: #141414;
  border-right: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #2a2a2a;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
}

.sidebar-count {
  font-size: 12px;
  color: #888;
  background: #222;
  padding: 2px 8px;
  border-radius: 10px;
}

.tree-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 13px;
}

/* Element Plus Tree 暗色主题 */
.dark-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  --el-tree-node-hover-bg-color: #1e1e1e;
  --el-tree-node-content-bg-color: transparent;
  --el-fill-color-blank: transparent;
  --el-border-color-light: #2a2a2a;
  --el-text-color-regular: #ccc;
  --el-text-color-primary: #e0e0e0;
}

.dark-tree :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 6px;
}

.dark-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #1a2a3a;
  color: #409eff;
}

/* ── 右侧主区域（视频 + 配送面板） ── */
.main-area {
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
}

/* ── 视频主内容 ── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-width: 0;
}

/* ── 顶部工具栏 ── */
.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.store-name {
  font-size: 16px;
  font-weight: 600;
}

.camera-count {
  font-size: 12px;
  color: #888;
  background: #222;
  padding: 2px 8px;
  border-radius: 10px;
}

.loading-tag {
  font-size: 12px;
  color: #409eff;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playback-time {
  display: flex;
  gap: 4px;
}

.date-input {
  padding: 4px 8px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #ccc;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.date-input:focus {
  border-color: #409eff;
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.7);
  cursor: pointer;
}

.hour-select {
  padding: 4px 6px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #ccc;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.hour-select:focus {
  border-color: #409eff;
}

.storage-toggle {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.storage-toggle:hover {
  border-color: #409eff;
  color: #ccc;
}

.storage-toggle.cloud {
  border-color: #e6a23c;
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.playback-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.playback-btn:hover {
  color: #ccc;
}

.playback-btn.active {
  background: #e6a23c;
  color: #fff;
}

.playback-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── 配送事件切换按钮 ── */
.delivery-toggle {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.delivery-toggle:hover {
  color: #e6a23c;
}
.delivery-toggle.active {
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.screen-toggle {
  display: flex;
  gap: 2px;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 3px;
}

.screen-toggle button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.screen-toggle button.active {
  background: #409eff;
  color: #fff;
}

.screen-toggle button:not(.active):hover {
  color: #ccc;
}

/* ── 视频网格 ── */
.video-grid {
  flex: 1;
  display: grid;
  gap: 8px;
  min-height: 0;
}

.layout-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.layout-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-slot {
  position: relative;
  background: #1c1c1c;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.video-slot.dblclick-fullscreen {
  cursor: pointer;
}

.slot-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
  font-size: 12px;
  pointer-events: none;
}

.slot-label {
  color: #ccc;
  font-weight: 500;
}

.slot-status {
  color: #666;
}

.slot-status.online {
  color: #67c23a;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #555;
  font-size: 13px;
}
</style>
