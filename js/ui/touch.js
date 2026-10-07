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

// Button icons (viewBox 0 0 24 24, drawn with the button's text color)
const ICONS = {
  fire: '<svg viewBox="0 0 24 24"><path d="M12 2c2.6 2 3.8 4.6 3.8 7.4V17H8.2V9.4C8.2 6.6 9.4 4 12 2z"/><rect x="7.5" y="18.5" width="9" height="3" rx="1"/></svg>',
  jump: '<svg viewBox="0 0 24 24"><path d="M12 3l8 9h-5v9H9v-9H4z"/></svg>',
  scope: '<svg viewBox="0 0 24 24"><rect x="10.8" y="1.5" width="2.4" height="7.8" rx="1.2"/><rect x="10.8" y="14.7" width="2.4" height="7.8" rx="1.2"/><rect x="1.5" y="10.8" width="7.8" height="2.4" rx="1.2"/><rect x="14.7" y="10.8" width="7.8" height="2.4" rx="1.2"/><path fill-rule="evenodd" d="M12 9.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zm0 1.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
  reload: '<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  emote: '<svg viewBox="0 0 24 24"><circle cx="12" cy="4" r="2.7"/><rect x="8.6" y="7.6" width="6.8" height="7.4" rx="2.2"/><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.8 6.4l3.7 3.7M20.2 6.4l-3.7 3.7"/><path d="M10.4 14.5l-2 6.5M13.6 14.5l2 3.2 1.2 3.3"/></g></svg>',
  weapon: weaponIcon('ak47'),
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
};

export const CONTROL_IDS = Object.keys(TOUCH.layout);
const ELEMENT_IDS = { joystick: 'joystick', ammo: 'weapon-panel', timer: 'timer', score: 'score' };   // every other control is #t-<id>
export const controlEl = id => $(ELEMENT_IDS[id] ?? 't-' + id);
export const sizeRangeOf = id => TOUCH.sizeRanges[id] ?? TOUCH.sizeRange;

const isSpot = s => s && [s.x, s.y, s.size].every(Number.isFinite);

// Where a control is: the player's own layout, or the default one
export const layoutOf = id => (isSpot(settings.touchLayout[id]) ? settings.touchLayout[id] : TOUCH.layout[id]);

const TEXT_CONTROLS = ['weapon-panel', 'timer', 'score'];

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
  // A tap opens the menu; sliding left or right steps to the next weapon instead
  let swipeX = 0, swiped = false;
  bindButton($('t-weapon'), { down: () => { swiped = false; }, up: () => { if (!swiped) toggle(); } }, {
    start: e => { swipeX = e.clientX; },
    move: e => {
      if (swiped || Math.abs(e.clientX - swipeX) < TOUCH.weaponSwipe) return;   // one weapon per slide, however long
      game.controls?.stepWeapon(Math.sign(e.clientX - swipeX));
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
  document.querySelector('.help').remove();   // the keyboard help does not apply

  const labels = [...Object.keys(BUTTONS), 'weapon'];
  $('touch').innerHTML = `
    <div id="touch-look"></div>
    <div id="joy-zone"></div>
    <div id="joystick" class="tctl"><i></i></div>
    ${labels.map(id => `<button id="t-${id}" class="tctl tbtn">${ICONS[id]}</button>`).join('')}
    <button id="t-pause" class="tctl tbtn">${ICONS.pause}</button>
    <div id="weapon-menu"></div>`;
  $('touch').append($('weapon-panel'), $('timer'), $('score'));   // the ammo, timer and kills texts are movable controls too

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
