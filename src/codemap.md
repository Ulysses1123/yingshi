# src/

## Responsibility
Application source root. Contains the Vue 3 entry point, API client, the root application component that orchestrates the video surveillance monitoring UI, and reusable video player components.

## Design
- **Composition API** (`<script setup>`) used throughout — no Options API.
- **No Vuex/Pinia** — state is managed locally via `ref()` and `computed()` inside `App.vue`.
- **Data driven from backend API** — store tree and camera lists are fetched at runtime from `/api/v1/monitor/*`. No static data files.
- **Element Plus** is registered globally in `main.js` and provides the `el-tree` sidebar and icon components.

## Flow
1. `main.js` → creates Vue app, registers Element Plus, mounts `App.vue` to `#app`.
2. `App.vue` fetches store tree from API on mount and renders:
   - Left sidebar: `el-tree` for region → store navigation.
   - Right panel: CSS Grid video wall (1×1 or 2×2) with `<EzPlayer>` components.
3. User clicks a store node → fetches cameras + token → Vue mounts `<EzPlayer>` for each slot.
4. Single-screen uses `hdUrl` (高清), 4-screen uses `sdUrl` (流畅) to save bandwidth.
5. Double-click a slot in 4-screen → zooms that camera to single screen.
6. Screen toggle buttons switch between layouts — Vue reactivity destroys/recreates players.
7. **Playback mode**: Toggle "回放" button → EzPlayer receives `.rec` URL instead of `.live` URL.
8. **Digital zoom**: Each EzPlayer has a zoom button that calls `player.enableZoom()`.

## Files
| File | Purpose |
|------|---------|
| `main.js` | App bootstrap: creates Vue app, registers Element Plus plugin, mounts root component. |
| `api/index.js` | API client with exponential backoff retry (2 retries, 1s/2s). Provides `fetchStoreTree()` and `fetchStoreCameras()`. |
| `App.vue` | Root component — store tree sidebar + video grid wall + playback/live mode management. |
| `components/EzPlayer.vue` | EZUIKit player wrapper with zoom, loading, error/retry, validateCode injection. |
| `components/HlsPlayer.vue` | HLS player wrapper (hls.js + Safari native fallback). |
| `components/FlvPlayer.vue` | FLV player wrapper with stats bar (flv.js). |

## Integration
- **Consumed by**: `index.html` (via `/src/main.js` module script).
- **Depends on**: `ezuikit-js` (EZUIKitPlayer), `element-plus` (el-tree, icons), `@element-plus/icons-vue`.
- **Data source**: Backend API `/api/v1/monitor/*` (proxied through Vite to `localhost:3000`).
- **Child components**: `EzPlayer.vue` is used by `App.vue` via `<EzPlayer>`. `HlsPlayer` and `FlvPlayer` remain available for alternative protocols but are not currently used.
