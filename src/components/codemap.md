# src/components/

## Responsibility
Reusable video player Vue components, each encapsulating a different streaming protocol. Designed as self-contained units with loading/error/retry UI and lifecycle management.

## Design
Each component follows the same **Facade Pattern**:
- Props-based configuration (`url`, `accessToken`, etc.).
- Event-based communication (`emit('error')`, `emit('ready')`, `emit('stats')`).
- Internal player lifecycle: `onMounted` → create → `onBeforeUnmount` → destroy.
- Consistent UI overlay: spinner (loading) → video → error with retry button.

No shared state or cross-component communication — each is fully isolated.

## Components

### EzPlayer.vue — EZVIZ (EZUIKit) Player
- **Protocol**: `ezopen://` URLs via EZUIKit SDK.
- **Props**: `url`, `accessToken`, `width`, `height`, `template` (default: `'pcLive'`), `validateCode`, `enableZoom`.
- **Events**: `error`, `ready` (fires on `streamInfoCB`).
- **Details**:
  - Uses `EZUIKitPlayer` from `ezuikit-js`. Generates a random container ID.
  - **validateCode**: Injects device verification code into the `ezopen://` URL to suppress the SDK password prompt.
  - **Digital zoom** (`enableZoom` prop): Renders a zoom toggle button (magnifying glass icon) in the bottom-right corner. Calls `player.enableZoom()`/`closeZoom()`. Tracks zoom state via `EZUIKitPlayer.EVENTS.zoom.*` events. Shows current magnification level (e.g. `2.5x`).
  - Falls back hiding loading after 5s timeout. Supports retry via destroy + re-init cycle.
  - CSS fills parent container (`height: 100%`), designed for CSS grid cells.
  - **Used by**: `App.vue` for all video rendering.

### HlsPlayer.vue — HLS Player
- **Protocol**: HLS (`.m3u8`) via hls.js.
- **Props**: `url`, `autoplay` (default: `true`).
- **Events**: `error`.
- **Details**: Uses `hls.js` with `lowLatencyMode`. Falls back to Safari native HLS via `canPlayType`. Video element has `controls`, `autoplay`, `muted`, `playsinline` attributes.
- **Note**: Currently a reusable component, not imported by App.vue.

### FlvPlayer.vue — FLV Player
- **Protocol**: HTTP-FLV via flv.js.
- **Props**: `url`, `enableStats` (default: `false`).
- **Events**: `error`, `stats`.
- **Details**: Uses `window.flvjs` (flv.js). Configured for low-latency live streaming (`enableStashBuffer: false`, `stashInitialSize: 128`). Collects real-time statistics (resolution, FPS, bitrate, latency) from `STATISTICS_INFO` events. Optional stats bar display.
- **Note**: Currently a reusable component, not imported by App.vue.

## Flow (Generic)
1. Parent passes `url` (and protocol-specific props).
2. `onMounted` → initializes player SDK → attaches to DOM container.
3. Stream connects → loading overlay hides → `ready`/`loadedmetadata` event.
4. On error → overlay shows error message + retry button.
5. `onBeforeUnmount` → player destroyed, resources freed.

## Integration
- **Consumed by**: `App.vue` (EzPlayer only; HlsPlayer and FlvPlayer are available for future use).
- **Dependencies**: `ezuikit-js`, `hls.js`, `flv.js` (via `window.flvjs`).
