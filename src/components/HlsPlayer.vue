<template>
  <div class="hls-player">
    <div class="video-container">
      <video
        ref="videoEl"
        controls
        autoplay
        muted
        playsinline
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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Hls from 'hls.js'

const props = defineProps({
  url: { type: String, required: true },
  autoplay: { type: Boolean, default: true },
})

const emit = defineEmits(['error'])

const videoEl = ref(null)
const loading = ref(true)
const error = ref('')
let hls = null

function initPlayer() {
  const video = videoEl.value
  if (!video) return

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: false,
      lowLatencyMode: true,
    })

    hls.loadSource(props.url)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.autoplay) {
        video.play().catch(() => {})
      }
    })

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        loading.value = false
        error.value = `HLS 播放失败: ${data.type} - ${data.details}`
        emit('error', data)
        destroyHls()
      }
    })
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    video.src = props.url
    video.addEventListener('loadedmetadata', () => {
      if (props.autoplay) video.play().catch(() => {})
    })
  } else {
    loading.value = false
    error.value = '当前浏览器不支持 HLS 播放'
  }
}

function onLoaded() {
  loading.value = false
}

function retry() {
  error.value = ''
  loading.value = true
  destroyHls()
  initPlayer()
}

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

onMounted(initPlayer)

onBeforeUnmount(() => {
  destroyHls()
})
</script>

<style scoped>
.hls-player { width: 100%; }

.video-container {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
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

.error-overlay { gap: 16px; }

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
}

.retry-btn:hover { background: #66b1ff; }

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
