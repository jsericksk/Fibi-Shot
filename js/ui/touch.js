import { TOUCH } from '../config.js';
import { isTouch } from '../utils.js';
import { enterFullscreen } from '../fullscreen.js';
import { WEAPON_ORDER } from '../game/weapons.js';
import { weaponIcon } from './hud.js';

const $ = id => document.getElementById(id);

// Tap buttons call an action of the player. The fire button is held and also aims while dragged.
const BUTTONS = {
  fire: { down: c => c.setFire(true), up: c => c.setFire(false), aim: true },
  jump: { down: c => c.jump() },
  scope: { down: c => c.toggleScope() },
  reload: { down: c => c.reload() },
  emote: { down: c => c.emote() },
};

function place(el, { x, y, size }) {
  Object.assign(el.style, { left: x + '%', top: y + '%', width: size + 'px', height: size + 'px' });
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

// Turns finger movement into camera movement
function lookDrag(game) {
  let lx = 0, ly = 0;
  return {
    start: e => { lx = e.clientX; ly = e.clientY; },
    move: e => {
      game.controls?.look((e.clientX - lx) * TOUCH.lookSensitivity, (e.clientY - ly) * TOUCH.lookSensitivity);
      lx = e.clientX;
      ly = e.clientY;
    },
  };
}

function bindJoystick(base, knob, game) {
  const steer = e => {
    const r = base.getBoundingClientRect(), radius = r.width / 2;
    let dx = e.clientX - (r.left + radius), dy = e.clientY - (r.top + radius);
    const len = Math.hypot(dx, dy);
    if (len > radius) { dx *= radius / len; dy *= radius / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const live = Math.hypot(dx, dy) / radius >= TOUCH.joystickDeadZone;
    game.controls?.setMove(live ? dx / radius : 0, live ? -dy / radius : 0);
  };
  track(base, {
    start: steer,
    move: steer,
    end: () => { knob.style.transform = ''; game.controls?.setMove(0, 0); },
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
    menu.classList.toggle('open');
  };
  menu.onclick = e => {
    const slot = e.target.closest('.wslot');
    if (!slot) return;
    game.controls?.pickWeapon(slot.dataset.id);
    close();
  };
  bindButton($('t-weapon'), { down: toggle });
  $('touch-look').addEventListener('pointerdown', close);
}

// Menu above the button, centered on it
function placeWeaponMenu({ x, y, size }) {
  Object.assign($('weapon-menu').style, { left: x + '%', bottom: `calc(${100 - y}% + ${size / 2 + 8}px)` });
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
    <div id="joystick" class="tctl"><i></i></div>
    ${labels.map(id => `<button id="t-${id}" class="tctl tbtn" data-i18n="touch.${id}"></button>`).join('')}
    <button id="t-pause" class="tctl tbtn" data-i18n="touch.pause"></button>
    <div id="weapon-menu"></div>`;

  track($('touch-look'), lookDrag(game));
  bindJoystick($('joystick'), $('joystick').firstElementChild, game);
  for (const [id, action] of Object.entries(BUTTONS)) {
    bindButton($('t-' + id), { down: () => action.down(game.controls), up: () => action.up?.(game.controls) }, action.aim ? lookDrag(game) : undefined);
  }
  bindButton($('t-pause'), { down: () => game.setPaused(true) });
  bindWeaponMenu(game);

  for (const [id, spot] of Object.entries(TOUCH.layout)) place($(id === 'joystick' ? id : 't-' + id), spot);
  placeWeaponMenu(TOUCH.layout.weapon);
}
