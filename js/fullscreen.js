import { HUD } from './config.js';

let toggledAt = -Infinity;

// True right after a toggle: the browser releases the mouse lock on its own then
export function isSwitchingFullscreen() {
  return performance.now() - toggledAt < HUD.fullscreenSwitchMs;
}

// Browser fullscreen on demand (hides tabs and toolbars). Must be called from a click or key press.
export function toggleFullscreen() {
  toggledAt = performance.now();
  try {
    if (document.fullscreenElement) document.exitFullscreen()?.catch?.(() => {});
    else document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {});
  } catch { /* optional */ }
}
