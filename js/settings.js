// Player settings, saved in the browser (localStorage). Missing or blocked storage just uses defaults.
const KEY = 'fibishot-settings';
const DEFAULTS = { sensitivity: 1 };   // multiplier on PLAYER.sensitivity (config.js)

export const SENSITIVITY_RANGE = { min: 0.2, max: 3, step: 0.05 };

export const settings = { ...DEFAULTS };

try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  if (Number.isFinite(saved.sensitivity)) settings.sensitivity = Math.min(SENSITIVITY_RANGE.max, Math.max(SENSITIVITY_RANGE.min, saved.sensitivity));
} catch { /* use defaults */ }

export function setSensitivity(value) {
  settings.sensitivity = value;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}
