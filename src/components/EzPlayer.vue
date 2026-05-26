<template>
  <div class="ez-player">
    <div v-if="loading" class="overlay">
      <div class="spinner"></div>
      <span>正在连接视频流...</span>
    </div>
    <div v-if="error" class="overlay error-overlay">
      <span class="error-text">{{ error }}</span>
      <button class="retry-btn" @click="retry">重试</button>
    </div>
    <div v-if="noRecording" class="overlay no-recording-overlay">
      <span class="no-recording-text">所选时段无录像，当前为直播画面</span>
    </div>
    <div :id="containerId" class="video-container"></div>

    <!-- 底部工具栏 -->
    <div v-if="!loading && !error" class="player-toolbar">
      <!-- 静音 -->
      <button
        class="toolbar-btn"
        :class="{ active: isMuted }"
        :title="isMuted ? '取消静音' : '静音'"
        @click="toggleMute"
      >
        <svg v-if="isMuted" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </button>

      <!-- 电子放大 -->
      <button
        v-if="enableZoom"
        class="toolbar-btn"
        :class="{ active: zoomActive }"
        :title="zoomActive ? `关闭放大 (${zoomLevel.toFixed(1)}x)` : '电子放大'"
        @click="toggleZoom"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
        </svg>
        <span v-if="zoomActive" class="toolbar-level">{{ zoomLevel.toFixed(1) }}x</span>
      </button>

      <!-- 全屏 -->
      <button
        class="toolbar-btn"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <svg v-if="isFullscreen" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { EZUIKitPlayer } from 'ezuikit-js'

const props = defineProps({
  url: { type: String, required: true },
  accessToken: { type: String, required: true },
  width: { type: [Number, String], default: '100%' },
  height: { type: [Number, String], default: '100%' },
  template: { type: String, default: 'pcLive' },
  validateCode: { type: String, default: '' },
  enableZoom: { type: Boolean, default: false },
  isPlaybackMode: { type: Boolean, default: false },
})

const emit = defineEmits(['error', 'ready', 'update:enableZoom'])

const containerId = `ez-player-${Math.random().toString(36).slice(2, 9)}`
const loading = ref(true)
const error = ref('')
const zoomActive = ref(false)
const zoomLevel = ref(1)
const noRecording = ref(false)
const isMuted = ref(false)
const isFullscreen = ref(false)
let player = null

function initPlayer() {
  try {
    loading.value = true
    error.value = ''
    noRecording.value = false
    // 验证码注入，避免萤石SDK弹窗
    let url = props.url
    if (props.validateCode) {
      url += url.includes('?') ? '&' : '?'
      url += `validateCode=${props.validateCode}`
    }

    const opts = {
      id: containerId,
      url,
      accessToken: props.accessToken,
      template: props.template,
      // 回放模式启用倍速播放
      ...(props.isPlaybackMode ? {
        speedOptions: {
          list: [
            { label: '0.5x', value: 0.5 },
            { label: '1x', value: 1 },
            { label: '2x', value: 2 },
            { label: '4x', value: 4 },
            { label: '8x', value: 8 },
          ],
        },
      } : {}),
      handleError: (e) => {
        const msg = e?.message || e || '视频流连接失败'
        console.error('EZUIKit 播放错误:', e)
        loading.value = false
        // 回放模式下，识别"未找到录像"错误并显示友好提示
        if (props.isPlaybackMode && (msg.includes('录像') || msg.includes('record') || msg.includes('420003'))) {
          noRecording.value = true
          error.value = ''  // 不显示为错误
          return
        }
        error.value = msg
        emit('error', e)
      },
    }

    // Only set dimensions if explicitly provided as numbers or strings with units
    if (typeof props.width === 'number' || props.width !== '100%') {
      opts.width = props.width
    }
    if (typeof props.height === 'number' || props.height !== '100%') {
      opts.height = props.height
    }

    player = new EZUIKitPlayer(opts)

    // streamInfoCB fires when stream data arrives
    if (player.eventEmitter) {
      player.eventEmitter.on(EZUIKitPlayer.EVENTS.streamInfoCB, (info) => {
        loading.value = false
        emit('ready', info)
      })

      // 电子放大事件
      player.eventEmitter.on(EZUIKitPlayer.EVENTS.zoom.openZoom, () => {
        zoomActive.value = true
      })
      player.eventEmitter.on(EZUIKitPlayer.EVENTS.zoom.closeZoom, () => {
        zoomActive.value = false
        zoomLevel.value = 1
      })
      player.eventEmitter.on(EZUIKitPlayer.EVENTS.zoom.onZoomChange, (info) => {
        zoomLevel.value = parseFloat(info.zoom) || 1
      })
    }

    // Fallback: hide loading after 5 seconds
    setTimeout(() => {
      if (loading.value) loading.value = false
    }, 5000)
  } catch (e) {
    loading.value = false
    error.value = `初始化失败: ${e.message}`
    console.error('EZUIKit 初始化错误:', e)
    emit('error', e)
  }
}

function toggleZoom() {
  if (!player) return
  if (zoomActive.value) {
    player.closeZoom()
  } else {
    player.enableZoom()
  }
}

function toggleMute() {
  if (!player) return
  isMuted.value = !isMuted.value
  try {
    player.setVolume?.(isMuted.value ? 0 : 100)
  } catch (_) {
    // ignore if SDK doesn't support setVolume
  }
}

function toggleFullscreen() {
  const el = document.getElementById(containerId)?.parentElement
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function retry() {
  error.value = ''
  loading.value = true
  destroyPlayer()
  initPlayer()
}

function destroyPlayer() {
  if (player) {
    try {
      player.stop?.()
      player.destroy?.()
    } catch (_) {
      // ignore
    }
    player = null
  }
}

onMounted(() => {
  initPlayer()
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  destroyPlayer()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.ez-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.video-container {
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.7);
  font-size: 14px;
  color: #ccc;
}

.error-overlay {
  gap: 16px;
}

.error-text {
  color: #ff6b6b;
  max-width: 80%;
  text-align: center;
}

.retry-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #66b1ff;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── 底部工具栏 ── */
.player-toolbar {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
}

.toolbar-btn:hover {
  background: rgba(64, 158, 255, 0.7);
  color: #fff;
}

.toolbar-btn.active {
  background: rgba(64, 158, 255, 0.85);
  color: #fff;
}

.toolbar-level {
  font-size: 11px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

/* ── 回放无录像提示 ── */
.no-recording-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  pointer-events: none;
}

.no-recording-text {
  background: rgba(0, 0, 0, 0.65);
  color: #e6a23c;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(230, 162, 60, 0.3);
  white-space: nowrap;
}
</style>
