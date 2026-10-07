import { TOUCH } from '../config.js';
import { isTouch, clamp } from '../utils.js';
import { enterFullscreen } from '../fullscreen.js';
import { settings } from '../settings.js';
import { WEAPON_ORDER } from '../game/weapons.js';
import { weaponIcon } from './hud.js';

const $ = id => document.getElementById(id);

// Tap buttons call an action of the player. The fire and scope buttons also aim while dragged.
const BUTTONS = {
  fire: { down: c => c.setFire(true), up: c => c.setFire(false), aim: true },
  jump: { down: c => c.jump() },
  scope: { down: c => c.toggleScope(), aim: true },
  reload: { down: c => c.reload() },
  emote: { down: c => c.emote() },
};

export const CONTROL_IDS = Object.keys(TOUCH.layout);
const ELEMENT_IDS = { joystick: 'joystick', ammo: 'weapon-panel', timer: 'timer' };   // every other control is #t-<id>
export const controlEl = id => $(ELEMENT_IDS[id] ?? 't-' + id);
export const sizeRangeOf = id => TOUCH.sizeRanges[id] ?? TOUCH.sizeRange;

const isSpot = s => s && [s.x, s.y, s.size].every(Number.isFinite);

// Where a control is: the player's own layout, or the default one
export const layoutOf = id => (isSpot(settings.touchLayout[id]) ? settings.touchLayout[id] : TOUCH.layout[id]);

const TEXT_CONTROLS = ['weapon-panel', 'timer'];

function place(el, { x, y, size }) {
  Object.assign(el.style, { left: x + '%', top: y + '%' });
  if (TEXT_CONTROLS.includes(el.id)) el.style.fontSize = size + 'px';   // text controls scale by font size
  else Object.assign(el.style, { width: size + 'px', height: size + 'px' });
}

// Puts every control where the layout says and applies the saved opacity
export function placeAll() {
  for (const id of CONTROL_IDS) place(controlEl(id), layoutOf(id));
  $('touch').style.setProperty('--touch-opacity', settings.touchOpacity);
}

// Runs the callbacks for the finger that started on `el` (multi-touch safe)
function track(el, { start, move, end }) {
  let id = null;
  const stop = e => {
    if (e.pointerId !== id) return;
    id = null;
    end?.(e);
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (id !== null) end?.(e);   // a release was lost: restart clean instead of ignoring the new finger
    id = e.pointerId;
    el.setPointerCapture(id);
    start(e);
  });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) move?.(e); });
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
  el.addEventListener('lostpointercapture', stop);
}

// Turns finger movement into camera movement. `scale` is an extra sensitivity multiplier.
function lookDrag(game, scale = () => 1) {
  let lx = 0, ly = 0;
  return {
    start: e => { lx = e.clientX; ly = e.clientY; },
    move: e => {
      const k = TOUCH.lookSensitivity * scale();
      game.controls?.look((e.clientX - lx) * k, (e.clientY - ly) * k);
      lx = e.clientX;
      ly = e.clientY;
    },
  };
}

// Floating stick: the ring jumps under the finger that touches the zone and goes home on release
function bindJoystick(zone, base, knob, game) {
  let cx = 0, cy = 0;   // ring center for the current touch
  const steer = e => {
    const radius = base.offsetWidth / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy);
    const ux = dist ? dx / dist : 0, uy = dist ? dy / dist : 0;   // push direction
    const reach = Math.min(dist, radius);
    knob.style.transform = `translate(${ux * reach}px, ${uy * reach}px)`;
    // Speed grows from 0 right after the dead zone, so there is no jump when the stick starts to move
    const power = clamp((reach / radius - TOUCH.joystickDeadZone) / (1 - TOUCH.joystickDeadZone), 0, 1);
    game.controls?.setMove(ux * power, -uy * power);
  };
  track(zone, {
    start: e => {
      const half = base.offsetWidth / 2;
      cx = clamp(e.clientX, half, innerWidth - half);   // keep the whole ring on screen
      cy = clamp(e.clientY, half, innerHeight - half);
      Object.assign(base.style, { left: cx + 'px', top: cy + 'px' });
      steer(e);
    },
    move: steer,
    end: () => {
      knob.style.transform = '';
      place(base, layoutOf('joystick'));
      game.controls?.setMove(0, 0);
    },
  });
}

function bindButton(btn, action, drag = {}) {
  track(btn, {
    start: e => { btn.classList.add('down'); drag.start?.(e); action.down(); },
    move: drag.move,
    end: () => { btn.classList.remove('down'); action.up?.(); },
  });
}

// The weapon button opens a small row of weapon squares above it
function bindWeaponMenu(game) {
  const menu = $('weapon-menu');
  menu.innerHTML = WEAPON_ORDER.map((id, i) => `
    <button class="wslot" data-id="${id}">${weaponIcon(id)}<b>${i + 1}</b> <span data-i18n="weapon.${id}"></span></button>`).join('');

  const close = () => menu.classList.remove('open');
  const toggle = () => {
    for (const b of menu.children) b.classList.toggle('active', b.dataset.id === game.player?.weaponId);
    if (menu.classList.toggle('open')) positionMenu();
  };
  // Above the weapon button (below it near the top), always fully on screen
  const positionMenu = () => {
    const { x, y, size } = layoutOf('weapon'), w = menu.offsetWidth, h = menu.offsetHeight, margin = 6;
    const cx = (x / 100) * innerWidth, cy = (y / 100) * innerHeight, gap = size / 2 + 8;
    const above = cy - gap - h;
    Object.assign(menu.style, {
      left: clamp(cx - w / 2, margin, innerWidth - w - margin) + 'px',
      top: (above >= margin ? above : Math.min(cy + gap, innerHeight - h - margin)) + 'px',
    });
  };
  // pointerdown instead of click: with another finger on the stick or the jump button, browsers skip the click
  menu.onpointerdown = e => {
    const slot = e.target.closest('.wslot');
    if (!slot) return;
    e.preventDefault();
    game.controls?.pickWeapon(slot.dataset.id);
    close();
  };
  // A tap opens the menu; sliding left or right steps through the weapons instead
  let swipeX = 0, swiped = false;
  bindButton($('t-weapon'), { down: () => { swiped = false; }, up: () => { if (!swiped) toggle(); } }, {
    start: e => { swipeX = e.clientX; },
    move: e => {
      if (Math.abs(e.clientX - swipeX) < TOUCH.weaponSwipe) return;
      game.controls?.stepWeapon(Math.sign(e.clientX - swipeX));
      swipeX = e.clientX;
      swiped = true;
      close();
    },
  });
  $('touch').addEventListener('pointerdown', e => { if (!e.target.closest('#weapon-menu, #t-weapon')) close(); });
}

// On-screen controls for phones and tablets. They drive the same player actions as the keyboard.
export function initTouch(game) {
  if (!isTouch) return;
  document.body.classList.add('touch');
  // Fullscreen needs a tap: try on every tap until the browser accepts it
  addEventListener('click', enterFullscreen);
  document.addEventListener('fullscreenchange', () => removeEventListener('click', enterFullscreen), { once: true });
  document.querySelector('.help').dataset.i18n = 'help.touch';

  const labels = [...Object.keys(BUTTONS), 'weapon'];
  $('touch').innerHTML = `
    <div id="touch-look"></div>
    <div id="joy-zone"></div>
    <div id="joystick" class="tctl"><i></i></div>
    ${labels.map(id => `<button id="t-${id}" class="tctl tbtn" data-i18n="touch.${id}"></button>`).join('')}
    <button id="t-pause" class="tctl tbtn" data-i18n="touch.pause"></button>
    <div id="weapon-menu"></div>`;
  $('touch').append($('weapon-panel'), $('timer'));   // the ammo and timer texts are movable controls too

  track($('touch-look'), lookDrag(game));
  $('joy-zone').style.width = TOUCH.joystickZone + '%';
  bindJoystick($('joy-zone'), $('joystick'), $('joystick').firstElementChild, game);
  for (const [id, action] of Object.entries(BUTTONS)) {
    bindButton($('t-' + id), { down: () => action.down(game.controls), up: () => action.up?.(game.controls) }, action.aim ? lookDrag(game, () => settings.aimSensitivity) : undefined);
  }
  bindButton($('t-pause'), { down: () => game.setPaused(true) });
  bindWeaponMenu(game);

  placeAll();
}
