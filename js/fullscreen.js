import { HUD } from './config.js';

let toggledAt = -Infinity;

// True right after a toggle: the browser releases the mouse lock on its own then
export function isSwitchingFullscreen() {
  return performance.now() - toggledAt < HUD.fullscreenSwitchMs;
}

// Browser fullscreen on demand (hides tabs and toolbars). Must be called from a click or key press.
export function enterFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const root = document.documentElement;
  try {
    const request = root.requestFullscreen ?? root.webkitRequestFullscreen;   // old Safari (iPad) only has the prefixed one
    Promise.resolve(request?.call(root, { navigationUI: 'hide' }))
      .then(() => screen.orientation?.lock?.('landscape'))   // only allowed while fullscreen, and only on Android
      .catch(() => {});
  } catch { /* optional */ }
}

export function toggleFullscreen() {
  toggledAt = performance.now();
  if (!document.fullscreenElement) return enterFullscreen();
  try { document.exitFullscreen()?.catch?.(() => {}); } catch { /* optional */ }
}

// Chrome and Edge: while in fullscreen Esc reaches the game instead of leaving it (holding it still does). The lock
// only works once fullscreen is really on, so it is asked for here and not right after the request.
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) Promise.resolve(navigator.keyboard?.lock?.(['Escape'])).catch(() => {});
});
