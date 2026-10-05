// Browser fullscreen on demand (hides tabs and toolbars). Must be called from a click or key press.
export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen()?.catch?.(() => {});
    else document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch?.(() => {});
  } catch { /* optional */ }
}
