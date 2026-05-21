<template>
  <div class="flv-player">
    <div class="video-container">
      <video
        ref="videoEl"
        class="video"
        controls
        autoplay
        muted
        @loadedmetadata="onLoaded"
      ></video>
      <div v-if="loading" class="overlay">
        <div class="spinner"></div>
        <span>正在连接视频流...</span>
      </div>
      <div v-if="error" class="overlay error-overlay">
        <span class="error-text">{{ error }}</span>
        <button class="retry-btn" @click="retry">重试</button>
      </div>
    </div>

    <div v-if="stats && showStats" class="stats-bar">
      <span>分辨率: {{ stats.width }}x{{ stats.height }}</span>
      <span>帧率: {{ stats.fps }}fps</span>
      <span>码率: {{ stats.speed }}KB/s</span>
      <span>延迟: {{ stats.latency }}s</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  url: { type: String, required: true },
  enableStats: { type: Boolean, default: false },
})

const emit = defineEmits(['error', 'stats'])

const videoEl = ref(null)
const loading = ref(true)
const error = ref('')
const stats = ref(null)
const showStats = ref(false)

let player = null
let statsTimer = null

function createPlayer() {
  const mpegts = window.flvjs
  if (!mpegts || !mpegts.isSupported()) {
    error.value = '当前浏览器不支持 flv.js，请使用 Chrome、Firefox 或 Edge。'
    emit('error', error.value)
    return
  }

  const video = videoEl.value
  if (!video) return

  player = mpegts.createPlayer(
    {
      type: 'flv',
      url: props.url,
      isLive: true,
    },
    {
      enableWorker: false,
      enableStashBuffer: false,
      stashInitialSize: 128,
      autoCleanupSourceBuffer: true,
      autoCleanupMaxBackwardDuration: 60,
      autoCleanupMinBackwardDuration: 40,
      fixAudioTimestampGap: true,
    }
  )

  player.attachMediaElement(video)
  player.load()

  player.on(mpegts.Events.ERROR, (e) => {
    loading.value = false
    error.value = `视频流加载失败: ${e}`

    emit('error', e)
  })

  player.on(mpegts.Events.STATISTICS_INFO, (s) => {
    stats.value = {
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
      fps: s.currentFps ?? s.fps ?? 0,
      speed: s.currentDataSpeed != null
        ? (s.currentDataSpeed / 1024).toFixed(0)
        : s.speed != null
          ? Math.round(s.speed)
          : 0,
      latency: s.endToEndLatency ? Math.round(s.endToEndLatency / 1000) : '-',
    }
    if (props.enableStats) {
      emit('stats', stats.value)
    }
  })

  player.on(mpegts.Events.MEDIA_INFO, () => {
    showStats.value = true
  })

  video.play().catch(() => {
    // autoplay may be blocked; user can click play manually
  })
}

function onLoaded() {
  loading.value = false
}

function retry() {
  error.value = ''
  loading.value = true
  destroyPlayer()
  createPlayer()
}

function destroyPlayer() {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
  if (player) {
    try {
      player.destroy()
    } catch (_) {
      // ignore
    }
    player = null
  }
}

onMounted(() => {
  createPlayer()
})

onBeforeUnmount(() => {
  destroyPlayer()
})
</script>

<style scoped>
.flv-player {
  width: 100%;
}

.video-container {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.overlay {
  position: absolute;
  inset: 0;
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

.stats-bar {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  background: #252525;
  font-size: 12px;
  color: #aaa;
  flex-wrap: wrap;
}
</style>
