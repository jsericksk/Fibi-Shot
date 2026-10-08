import { TOUCH } from '../config.js';
import { settings, setSetting, resetTouchSettings, OPACITY_RANGE } from '../settings.js';
import { isTouch, clamp } from '../utils.js';
import { confirmDialog } from './confirm-dialog.js';
import { CONTROL_IDS, controlEl, layoutOf, placeAll, sizeRangeOf } from './touch.js';

const $ = id => document.getElementById(id);

// Lets the player drag, resize and fade the on-screen controls. Opened from the pause menu.
export function initHudEditor(game) {
  if (!isTouch) return;

  const root = document.createElement('div');
  root.id = 'hud-editor';
  root.innerHTML = `
    <div id="hud-bar">
      <i id="hud-grip">⠿</i>
      <div id="hud-sliders">
        <label><span data-i18n="hud.size"></span><input id="hud-size" type="range"></label>
        <label><span data-i18n="hud.opacity"></span><input id="hud-opacity" type="range"></label>
      </div>
      <div id="hud-buttons">
        <button id="hud-reset" data-i18n="hud.reset"></button>
        <button id="hud-done" data-i18n="hud.done"></button>
      </div>
    </div>
    <p id="hud-hint" data-i18n="hud.hint"></p>`;
  $('touch').append(root);

  const size = $('hud-size'), opacity = $('hud-opacity');
  Object.assign(size, TOUCH.sizeRange);
  Object.assign(opacity, OPACITY_RANGE);

  const bar = $('hud-bar');
  let selected = null;
  let grab = null;   // finger offset from the center of the dragged control
  let barGrab = null;   // the same for the toolbar

  function select(id) {
    selected = id;
    for (const c of CONTROL_IDS) controlEl(c).classList.toggle('selected', c === id);
    size.disabled = !id;
    if (!id) return;
    Object.assign(size, sizeRangeOf(id));   // the range first, then the value
    size.value = layoutOf(id).size;
  }

  function setSpot(id, spot) {
    setSetting('touchLayout', { ...settings.touchLayout, [id]: spot });
    placeAll();
  }

  // The control under the finger (the nearest center when they overlap)
  function controlAt(x, y) {
    let best = null, bestDist = Infinity;
    for (const id of CONTROL_IDS) {
      const r = controlEl(id).getBoundingClientRect();
      const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      const dist = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (inside && dist < bestDist) { best = id; bestDist = dist; }
    }
    return best;
  }

  // The toolbar moves too, to free the top of the screen. Its spot is saved like the controls'.
  function placeBar() {
    const pos = settings.hudBarPos;
    Object.assign(bar.style, pos ? { left: pos.x + '%', top: pos.y + '%', transform: 'translate(-50%, -50%)' } : { left: '', top: '', transform: '' });
  }

  function moveBar(e) {
    const { width, height } = bar.getBoundingClientRect();
    const cx = clamp(e.clientX - barGrab.dx, width / 2, innerWidth - width / 2);
    const cy = clamp(e.clientY - barGrab.dy, height / 2, innerHeight - height / 2);
    setSetting('hudBarPos', { x: (cx / innerWidth) * 100, y: (cy / innerHeight) * 100 });
    placeBar();
  }

  root.addEventListener('pointerdown', e => {
    if (e.target.closest('#hud-bar')) {
      if (e.target.closest('input, button, label')) return;
      const r = bar.getBoundingClientRect();
      barGrab = { id: e.pointerId, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
      root.setPointerCapture(e.pointerId);
      return;
    }
    select(controlAt(e.clientX, e.clientY));
    if (!selected) return;
    const r = controlEl(selected).getBoundingClientRect();
    grab = { id: e.pointerId, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2) };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener('pointermove', e => {
    if (barGrab && e.pointerId === barGrab.id) return moveBar(e);
    if (!grab || e.pointerId !== grab.id) return;
    const r = controlEl(selected).getBoundingClientRect();
    const cx = clamp(e.clientX - grab.dx, r.width / 2, innerWidth - r.width / 2);   // keep the whole control on screen
    const cy = clamp(e.clientY - grab.dy, r.height / 2, innerHeight - r.height / 2);
    setSpot(selected, { ...layoutOf(selected), x: (cx / innerWidth) * 100, y: (cy / innerHeight) * 100 });
  });
  const release = e => {
    if (grab && e.pointerId === grab.id) grab = null;
    if (barGrab && e.pointerId === barGrab.id) barGrab = null;
  };
  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  size.oninput = () => setSpot(selected, { ...layoutOf(selected), size: +size.value });
  opacity.oninput = () => { setSetting('touchOpacity', +opacity.value); placeAll(); };
  const reset = () => {
    resetTouchSettings();
    opacity.value = settings.touchOpacity;
    placeAll();
    placeBar();
    select(null);
  };
  $('hud-reset').onclick = () => confirmDialog('hud.resetConfirm', reset);

  $('btn-edit-hud').onclick = () => {
    opacity.value = settings.touchOpacity;
    select(null);
    game.hud.showPause(false);   // the game stays paused behind the editor
    document.body.classList.add('hud-editing');
    placeBar();
  };
  $('hud-done').onclick = () => {
    select(null);
    document.body.classList.remove('hud-editing');
    game.hud.showPause(true);
  };
}
