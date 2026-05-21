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
    <!-- 电子放大按钮 -->
    <button
      v-if="enableZoom && !loading && !error"
      class="zoom-btn"
      :class="{ active: zoomActive }"
      :title="zoomActive ? `关闭放大 (${zoomLevel.toFixed(1)}x)` : '电子放大'"
      @click="toggleZoom"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
      </svg>
      <span v-if="zoomActive" class="zoom-level">{{ zoomLevel.toFixed(1) }}x</span>
    </button>
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
})

onBeforeUnmount(() => {
  destroyPlayer()
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

/* ── 电子放大按钮 ── */
.zoom-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
}

.zoom-btn:hover {
  background: rgba(64, 158, 255, 0.7);
  color: #fff;
}

.zoom-btn.active {
  background: rgba(64, 158, 255, 0.85);
  color: #fff;
}

.zoom-level {
  font-size: 11px;
  font-weight: 600;
  min-width: 28px;
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
