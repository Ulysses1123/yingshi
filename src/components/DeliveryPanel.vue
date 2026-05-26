<template>
  <div class="delivery-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#e6a23c">
          <path d="M19 7h-3V6c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v1H5c-1.1 0-2 .9-2 2v1h18V9c0-1.1-.9-2-2-2zm-5 0h-4V6h4v1zM5 19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7H5v7z"/>
        </svg>
        配送事件
        <span v-if="orders.length" class="badge">{{ orders.length }}单</span>
      </div>
      <button class="close-btn" @click="$emit('close')" title="关闭配送面板">✕</button>
    </div>

    <!-- 加载 / 空状态 -->
    <div v-if="loading" class="panel-loading">加载配送信息...</div>
    <div v-else-if="!orders.length" class="panel-empty">暂无配送订单</div>

    <!-- 订单列表 -->
    <div v-else class="panel-body">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-header">
          <span class="order-id">订单 #{{ order.id }}</span>
          <span class="order-status" :class="order.status">{{ order.displayStatus }}</span>
        </div>

        <!-- 时间线 -->
        <div class="timeline">
          <div
            v-for="(event, i) in order.events"
            :key="i"
            class="timeline-item"
            :class="{ active: activeKey === `${order.id}-${i}` }"
            @click="handleJump(order, event)"
          >
            <div class="timeline-dot" :class="dotClass(event.state)"></div>
            <div v-if="i < order.events.length - 1" class="timeline-line"></div>
              <div class="timeline-info">
                <div class="timeline-state">
                  {{ event.state }}
                  <span v-if="event.driverName" class="driver-tag">{{ event.driverName }}</span>
                  <span class="click-hint">→ 跳转</span>
                </div>
                <div class="timeline-time">
                  {{ formatTime(event.time) }}
                  <span v-if="event.cameraHint" class="cam-tag">{{ event.cameraHint }}</span>
                </div>
              </div>
          </div>
        </div>

        <!-- 回放配送过程按钮 -->
        <div v-if="hasPlayableSegment(order)" class="order-footer">
          <button class="play-btn" @click="handlePlaySegment(order)">
            ▶ 回放配送过程
            <span class="range-label">
              ({{ formatTime(getFirstEvent(order).time) }} → {{ formatTime(getLastEvent(order).time) }})
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  orders: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activeKey: { type: String, default: '' },
})

const emit = defineEmits(['close', 'jump-to-time', 'play-segment'])

// ── 状态 → 圆点颜色 ──
function dotClass(state) {
  const map = {
    '待接单': 'waiting',
    '已下单': 'waiting',
    '骑手到店': 'arrived',
    '配送中': 'delivering',
    '已完成': 'completed',
    '已取消': 'cancelled',
  }
  return map[state] || ''
}

// ── ISO 时间 → HH:mm:ss ──
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// 判断该订单是否有可回放的配送过程（有配送中事件 = 有取货时间可跳转）
function hasPlayableSegment(order) {
  return order.events.some(e => e.state === '配送中')
}

function getFirstEvent(order) {
  // 优先用骑手到店作为起点，否则用最早配送事件
  const arrived = order.events.find(e => e.state === '骑手到店')
  if (arrived) return arrived
  return order.events.find(e => e.state === '配送中') || order.events[0]
}

function getLastEvent(order) {
  // 配送中事件作为终点；如果没有（仅已完成等），取最后一条事件
  const delivering = order.events.find(e => e.state === '配送中')
  if (delivering) {
    // 终点取最后一条事件（已完成），而非配送中，避免起止时间相同
    const last = order.events[order.events.length - 1]
    return last !== delivering ? last : delivering
  }
  return order.events[order.events.length - 1]
}

// ── 点击时间线 → 跳转到该事件时间点 ──
function handleJump(order, event) {
  emit('jump-to-time', {
    orderId: order.id,
    time: event.time,
    state: event.state,
  })
}

// ── 点击"回放配送过程" → 从骑手到店到配送中 ──
function handlePlaySegment(order) {
  const beginEvent = getFirstEvent(order)
  const endEvent = getLastEvent(order)
  if (!beginEvent || !endEvent) return
  emit('play-segment', {
    orderId: order.id,
    begin: beginEvent.time,
    end: endEvent.time,
  })
}
</script>

<style scoped>
.delivery-panel {
  width: 270px;
  min-width: 270px;
  background: #141414;
  border-left: 1px solid #2a2a2a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 头部 ── */
.panel-header {
  padding: 12px 14px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 13px;
  color: #e0e0e0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 11px;
  background: #e6a23c;
  color: #000;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}
.close-btn:hover { color: #ccc; background: #2a2a2a; }

/* ── 加载/空状态 ── */
.panel-loading,
.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #666;
}

/* ── 订单列表 ── */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ── 订单卡片 ── */
.order-card {
  margin: 0 8px 8px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  padding: 10px 12px;
  background: #1e1e1e;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-id { font-size: 12px; color: #e0e0e0; font-weight: 500; }
.order-status { font-size: 11px; color: #999; }
.order-status.delivered { color: #67c23a; }
.order-status.delivering { color: #409eff; }
.order-status.arrived { color: #67c23a; }
.order-status.pending { color: #e6a23c; }
.order-status.cancelled { color: #ff6b6b; }

/* ── 时间线 ── */
.timeline { padding: 6px 0; }

.timeline-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}
.timeline-item:hover { background: #222; }
.timeline-item:active { background: #2a2a2a; }
.timeline-item.active {
  background: #1a2a3c;
  border-left-color: #409eff;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  margin-right: 10px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.timeline-dot.arrived { background: #67c23a; }
.timeline-dot.delivering { background: #409eff; }
.timeline-dot.completed { background: #909399; }
.timeline-dot.waiting { background: #e6a23c; }
.timeline-dot.cancelled { background: #ff6b6b; }

.timeline-line {
  position: absolute;
  left: 15px;
  top: 18px;
  bottom: -6px;
  width: 2px;
  background: #2a2a2a;
}
.timeline-item:last-child .timeline-line { display: none; }

.timeline-info { flex: 1; min-width: 0; }

.timeline-state {
  font-size: 12px;
  color: #e0e0e0;
  font-weight: 500;
}
.click-hint {
  font-weight: 400;
  color: #555;
  font-size: 11px;
  margin-left: 4px;
  transition: color 0.15s;
}
.timeline-item:hover .click-hint { color: #409eff; }

.driver-tag {
  font-weight: 400;
  color: #409eff;
  font-size: 11px;
  margin-left: 4px;
}

.timeline-time {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cam-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: #1e1e1e;
  color: #666;
  border: 1px solid #2a2a2a;
}

/* ── 回放按钮 ── */
.order-footer {
  padding: 8px 12px;
  border-top: 1px solid #242424;
}

.play-btn {
  width: 100%;
  padding: 6px 0;
  border: 1px solid #409eff;
  border-radius: 4px;
  background: transparent;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.play-btn:hover {
  background: #409eff;
  color: #fff;
}
.play-btn .range-label { color: #999; }
.play-btn:hover .range-label { color: #ccc; }
</style>
