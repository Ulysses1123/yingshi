# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

萤石视频监控播放器 (EZVIZ Video Surveillance Player) — a Vue 3 SPA for multi-store video monitoring with a Node.js/Express backend. The frontend provides a dark-themed UI with a store/camera tree navigator and a video wall (single-screen and 4-screen layouts). The backend proxies EZVIZ cloud API calls, manages token caching (Redis with in-memory fallback), and stores camera/merchant assets in MySQL (also with in-memory fallback).

## Repository Structure

```
yingshi/
├── src/                    # Vue 3 frontend (Vite, :5173)
│   ├── main.js             # App bootstrap, registers Element Plus globally
│   ├── App.vue             # Root component — tree sidebar + video grid + player lifecycle
│   ├── api/index.js        # API client (fetch wrapper with exponential backoff retry)
│   └── components/         # Video player wrappers: EzPlayer, HlsPlayer, FlvPlayer
├── backend/                # Express API server (:3000)
│   ├── src/
│   │   ├── app.js          # Express app entry point
│   │   ├── config/         # database.js (MySQL pool), redis.js (ioredis), memory-db.js (fallback)
│   │   ├── models/         # store.model.js, camera.model.js — auto-degrade to memory
│   │   ├── services/       # ezviz.service.js — token fetch/cache/refresh
│   │   └── routes/         # monitor.routes.js — /api/v1/monitor/*
│   ├── scripts/init-db.js  # DB schema + seed data
│   └── .env.example
├── vite.config.js          # Vite config, proxies /api → localhost:3000
└── codemap.md              # Detailed architecture map (read before deep work)
```

## Commands

### Frontend (root directory)

```bash
npm run dev      # Start Vite dev server on :5173
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend (backend/ directory)

```bash
cd backend
npm install       # Install dependencies
npm run init-db   # Initialize MySQL schema + seed data
npm run dev       # Start with nodemon (hot reload) on :3000
npm start         # Production start
```

## Architecture

### Frontend

- **No router, no Pinia/Vuex** — single-page app, all state local to `App.vue` via `ref()`/`computed()`.
- Vue 3 Composition API (`<script setup>`) throughout; global Element Plus registration in `main.js` (trade-off: no tree-shaking, but convenient for internal tools).
- **Data flow**: `App.vue` → `api/index.js` (fetch wrapper with 2-retry exponential backoff) → backend `/api/v1/monitor/*` → Vite dev proxy → Express :3000.
- **Player lifecycle**: Click store in tree → `fetchStoreCameras(storeId)` → Vue reactivity mounts `<EzPlayer>` components. Single-screen uses `hdUrl`, 4-screen uses `sdUrl` to save bandwidth on multi-view.
- **EzPlayer** (`src/components/EzPlayer.vue`) wraps `EZUIKitPlayer` from `ezuikit-js` as a self-contained Vue component:
  - Injects `validateCode` into the `ezopen://` URL to suppress the EZVIZ SDK password prompt
  - Built-in loading spinner, error display with retry button
  - `noRecording` overlay: when in playback mode and SDK reports no recordings found, shows `"所选时段无录像，当前为直播画面"` instead of a hard error
  - Exposes `@ready`/`@error` events for parent connection status tracking
  - 5s fallback timeout to hide loading if stream never connects
  - CSS fills parent container (`height: 100%`) — designed for CSS grid cells
  - Player lifecycle managed by Vue (`onMounted` → `initPlayer`, `onBeforeUnmount` → `destroyPlayer`)
  - **Digital zoom** (`enableZoom` prop): adds a zoom toggle button that calls `player.enableZoom()`/`closeZoom()`. Tracks zoom state via `EZUIKitPlayer.EVENTS.zoom.*` events and shows current magnification level.
  - **Playback mode support** (`isPlaybackMode` prop): distinguishes playback vs live errors. When SDK returns "未找到录像" (420003) in playback mode, it sets `noRecording` instead of `error`.
- **App.vue no longer manages players manually** — no `playerInstances[]` array, no `renderPlayers()`/`destroyAllPlayers()` functions. Player creation and teardown is driven entirely by Vue reactivity via `v-for` + `:key` on `<EzPlayer>`. Key combines `camera.id` + quality mode (+ time params in playback mode) to force re-mount on store/screen/time changes.
- **Screen switching**: `isSingleScreen` ref controls CSS grid (`.layout-1` or `.layout-4`). Switching from single→4-screen re-fetches cameras from API to get `sdUrl` list. `zoomToSingle()` reorders cameras and sets single-screen mode.
- **Connection status**: The slot-header overlay shows `● 直播中` (green) or `○ 未连接` (grey). Status updates via `connectedFlags` ref, toggled by `@ready`/`@error` events from EzPlayer.
- **Playback mode** (`isPlayback` ref): Toggled by the 回放 button in the toolbar. When active, EzPlayer receives a `recUrl` (constructed from `deviceSerial` + `channelNo` with `.rec` suffix) instead of live `hdUrl`/`sdUrl`. The toolbar shows a date picker + hour selector for time range filtering. Time params are formatted as `begin=yyyyMMddHHmmss&end=yyyyMMddHHmmss`. Changing date/hour updates `playerKey` (which includes `playbackDate` + `playbackHour`), forcing Vue to remount players with new URL. Switching stores resets to live mode.
- Vite dev server proxies `/api` requests to `http://localhost:3000`.

### Backend

- **Graceful degradation**: MySQL and Redis are the primary data stores, but if either is unavailable, the app falls back to in-memory data (`memory-db.js`) without crashing. This means the backend can run with zero external dependencies for development.
- **Token caching**: EZVIZ access tokens are cached in Redis (5-day TTL via `TOKEN_CACHE_TTL`). On cache miss, fetches from `open.ys7.com/api/lapp/token/get`. Falls back to in-memory token cache if Redis is down. The `useMemoryCache` flag can flip to `true` at runtime if a Redis operation fails mid-flight.
- **ezopen URL construction**: `CameraModel.generateEzopenUrl()` produces `ezopen://open.ys7.com/{device_serial}/{channel_no}.hd.live` (HD) or `ezopen://open.ys7.com/{device_serial}/{channel_no}.live` (SD/流畅). `CameraModel.generatePlaybackUrl()` produces `ezopen://open.ys7.com/{device_serial}/{channel_no}.rec` with optional `begin`/`end` time params for playback.
- **Memory db seed data** (`memory-db.js`): 10 stores across 5 regions, 4 cameras on test store (storeId=10) with real EZVIZ device serials (`BH3229101`, `BH2263101`, etc.). Token cached in process memory.
- API response format: `{ code: 200, msg: 'success', data: ... }` — the frontend `request()` wrapper checks `code !== 200` and throws on failure. All response shapes follow this pattern.
- The `useMemory` flag for models is set once at module-load time (pool connection test, each model independently). The `useMemoryCache` flag in `ezviz.service.js` can flip to `true` at runtime if a Redis operation fails mid-flight.

### Key API Endpoints

| Endpoint                                      | Description                          |
| --------------------------------------------- | ------------------------------------ |
| `GET /api/v1/monitor/store-tree`              | Regions → stores tree                |
| `GET /api/v1/monitor/stores/:storeId/cameras` | Token + camera list with hdUrl/sdUrl/recUrl |
| `GET /api/v1/monitor/token/status`            | Token cache TTL and status           |
| `POST /api/v1/monitor/token/refresh`          | Force token refresh                  |
| `GET /health`                                 | Server health check                  |