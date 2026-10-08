// Player settings, saved in the browser (localStorage). Missing or blocked storage just uses defaults.
const KEY = 'fibishot-settings';

export const SENSITIVITY_RANGE = { min: 0.2, max: 3, step: 0.05 };
export const OPACITY_RANGE = { min: 0.1, max: 1, step: 0.05 };

const DEFAULTS = {
  sensitivity: 1,                 // camera: multiplier on PLAYER.sensitivity (config.js)
  aimSensitivity: 1,              // extra multiplier while aiming by dragging the fire button (touch)
  touchOpacity: OPACITY_RANGE.max,
  touchLayout: {},                // id -> { x, y, size } of the controls the player moved or resized
  hudBarPos: null,                // { x, y } center (% of the screen) of the layout editor's toolbar, null = default
};

export const settings = { ...DEFAULTS };

const clampTo = (value, { min, max }, fallback) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);

try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  settings.sensitivity = clampTo(saved.sensitivity, SENSITIVITY_RANGE, DEFAULTS.sensitivity);
  settings.aimSensitivity = clampTo(saved.aimSensitivity, SENSITIVITY_RANGE, DEFAULTS.aimSensitivity);
  settings.touchOpacity = clampTo(saved.touchOpacity, OPACITY_RANGE, DEFAULTS.touchOpacity);
  if (saved.touchLayout && typeof saved.touchLayout === 'object') settings.touchLayout = saved.touchLayout;
  if ([saved.hudBarPos?.x, saved.hudBarPos?.y].every(Number.isFinite)) settings.hudBarPos = saved.hudBarPos;
} catch { /* use defaults */ }

export function setSetting(key, value) {
  settings[key] = value;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

export function resetTouchSettings() {
  setSetting('touchLayout', DEFAULTS.touchLayout);
  setSetting('touchOpacity', DEFAULTS.touchOpacity);
  setSetting('hudBarPos', DEFAULTS.hudBarPos);
}
