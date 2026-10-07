import { WEAPONS, WEAPON_ORDER } from '../game/weapons.js';
import { MATCH, HUD } from '../config.js';
import { t } from '../i18n.js';
import { formatTime } from '../utils.js';
import { toggleFullscreen } from '../fullscreen.js';
import { settings, setSetting, SENSITIVITY_RANGE } from '../settings.js';
import { CHARACTERS } from '../characters/index.js';
import { thumbnail } from './thumbnails.js';

const $ = id => document.getElementById(id);
const el = {
  pName: $('p-name'), pPortrait: $('p-portrait'), pHp: $('p-hp'),
  eName: $('e-name'), ePortrait: $('e-portrait'), eHp: $('e-hp'),
  scoreP: $('sc-p'), scoreE: $('sc-e'), toast: $('toast'),
  slots: $('slots'), ammo: $('ammo'), reloadNote: $('reload-note'), reloadIcon: $('reload-icon'),
  crosshair: $('crosshair'), scope: $('scope'), hit: $('hitmarker'), hitText: $('hit-text'),
  banner: $('banner'), changePanel: $('change-panel'), changePickers: $('change-pickers'), weaponFlash: $('weapon-flash'), score: $('score'), timer: $('timer'), result: $('result'), resultTitle: $('result-title'), resultScore: $('result-score'), pause: $('pause'), vignette: $('vignette'),
};

// Sensitivity sliders in the pause menu
function bindSensitivity(id, key) {
  const input = $(id), value = $(id + '-val');
  Object.assign(input, SENSITIVITY_RANGE, { value: settings[key] });
  const show = () => { value.textContent = '×' + settings[key].toFixed(2); };
  input.oninput = () => { setSetting(key, +input.value); show(); };
  input.onchange = () => input.blur();
  show();
}
bindSensitivity('sens', 'sensitivity');
bindSensitivity('aim-sens', 'aimSensitivity');

let bannerTimer, hitTimer, toastTimer, flashTimer, lastKey = '';

// Simple white weapon silhouettes (viewBox 0 0 120 44)
const ICONS = {
  pistol: '<rect x="26" y="8" width="70" height="13" rx="2"/><polygon points="34,21 52,21 46,42 32,42"/><rect x="96" y="11" width="10" height="5"/>',
  ak47: '<rect x="14" y="14" width="66" height="10" rx="2"/><rect x="80" y="16" width="38" height="5"/><polygon points="0,12 16,14 16,30 0,32"/><polygon points="46,24 60,24 66,42 52,42"/><polygon points="28,24 38,24 35,40 26,40"/><rect x="62" y="10" width="24" height="4"/>',
  shotgun: '<rect x="6" y="15" width="108" height="5" rx="2"/><rect x="6" y="21" width="84" height="4" rx="2"/><rect x="54" y="19" width="26" height="8" rx="2"/><polygon points="0,14 22,14 22,30 0,34"/><polygon points="24,25 34,25 31,40 22,40"/>',
  awp: '<rect x="8" y="17" width="108" height="6" rx="2"/><rect x="38" y="5" width="34" height="8" rx="3"/><rect x="46" y="12" width="3" height="6"/><rect x="62" y="12" width="3" height="6"/><polygon points="0,14 22,16 22,32 0,28"/><polygon points="26,23 36,23 33,38 24,38"/><rect x="30" y="12" width="8" height="3"/>',
};

export const weaponIcon = id => `<svg viewBox="0 0 120 44">${ICONS[id]}</svg>`;

// DOM-based HUD for the match screen
export const hud = {
  setup(playerDef, enemyDef) {
    el.pName.textContent = playerDef.name;
    el.eName.textContent = enemyDef.name;
    el.pPortrait.src = thumbnail(playerDef);
    el.ePortrait.src = thumbnail(enemyDef);
    el.slots.innerHTML = WEAPON_ORDER.map((id, i) => `<div class="slot" data-id="${id}"><b>${i + 1}</b> ${t('weapon.' + id)}</div>`).join('');
    lastKey = '';
    el.result.style.display = 'none';
    this.banner('', 0);
    this.toast('', 0);
    clearTimeout(flashTimer);
    el.weaponFlash.style.display = 'none';
  },

  update(player, enemy) {
    el.pHp.style.width = (player.hp / MATCH.maxHp) * 100 + '%';
    el.eHp.style.width = (enemy.hp / MATCH.maxHp) * 100 + '%';

    // Reload icon in the middle of the screen with a progress ring
    const w = player.weapon;
    el.crosshair.classList.toggle('dot', w.id === 'awp');
    el.crosshair.classList.toggle('hide', !!player.emote);
    el.reloadIcon.style.display = player.reloading ? 'flex' : 'none';
    if (player.reloading) el.reloadIcon.style.setProperty('--p', `${(1 - player.reloadT / w.reload) * 360}deg`);

    const key = `${player.weaponId}|${player.ammoNow}|${player.reloading}`;
    if (key === lastKey) return;
    lastKey = key;
    const weaponBtn = $('t-weapon');   // touch only: the button shows the weapon in hand
    if (weaponBtn) weaponBtn.innerHTML = weaponIcon(player.weaponId);
    el.ammo.textContent = player.training ? `∞ / ${w.mag}` : `${player.ammoNow} / ${w.mag}`;
    el.reloadNote.textContent = player.reloading ? t('reloading') : player.ammoNow === 0 ? t('noAmmo') : '';
    el.slots.querySelectorAll('.slot').forEach(s => s.classList.toggle('active', s.dataset.id === player.weaponId));
  },

  setScore(player, enemy) {
    el.scoreP.textContent = player;
    el.scoreE.textContent = enemy;
  },

  // duration: match length in seconds (0 = unlimited, null = no timer at all). Shows the time left.
  setTimer(duration, left) {
    const shown = duration === null ? '' : duration ? formatTime(Math.ceil(left)) : '∞';
    el.timer.classList.toggle('off', !duration);   // unlimited matches hide it (the HUD editor still shows it)
    el.score.classList.toggle('below-timer', duration !== null);
    if (el.timer.textContent !== shown) el.timer.textContent = shown;
    el.timer.classList.toggle('low', !!duration && left <= HUD.timerWarnSeconds);
  },

  showResult(result, player, enemy) {
    el.resultTitle.textContent = t('result.' + result);
    el.resultScore.textContent = `${player} × ${enemy}`;
    el.result.style.display = 'flex';
  },

  // on: aiming. sniper: the full scope view (black mask) instead of a tighter crosshair
  setScope(on, sniper = false) {
    el.scope.classList.toggle('on', on && sniper);
    el.crosshair.style.display = on && sniper ? 'none' : '';
    el.crosshair.classList.toggle('aim', on && !sniper);
  },

  hitMarker(headshot, kill) {
    el.hit.className = 'on' + (headshot ? ' head' : '');
    el.hitText.textContent = kill ? t(headshot ? 'hit.headshotKill' : 'hit.kill') : headshot ? t('hit.headshot') : '';
    clearTimeout(hitTimer);
    hitTimer = setTimeout(() => { el.hit.className = ''; el.hitText.textContent = ''; }, HUD.hitMarkerMs);
  },

  damageFlash() {
    el.vignette.classList.remove('flash');
    void el.vignette.offsetWidth; // restart the CSS animation
    el.vignette.classList.add('flash');
  },

  // ms = 0 keeps the text until replaced
  banner(text, ms) {
    clearTimeout(bannerTimer);
    el.banner.textContent = text;
    el.banner.style.display = text ? 'block' : 'none';
    if (ms) bannerTimer = setTimeout(() => { el.banner.style.display = 'none'; }, ms);
  },

  // Small message under the score
  toast(text, ms) {
    clearTimeout(toastTimer);
    el.toast.textContent = text;
    el.toast.style.display = text ? 'block' : 'none';
    if (ms) toastTimer = setTimeout(() => { el.toast.style.display = 'none'; }, ms);
  },

  // Training hides the score and the crosshair is a plain dot for the AWP
  setTraining(on) {
    el.score.classList.toggle('off', on);
    document.querySelector('.plate.right').style.display = on ? 'none' : '';
    el.changePanel.style.display = on ? 'flex' : 'none';
    el.changePickers.classList.remove('open');
  },

  // Character pickers of the training pause menu. fn(side, id) is called on a pick.
  setupChange(playerDef, enemyDef, fn) {
    const col = (side, def, label) => `<div class="cp-side"><h3>${t(label)}</h3><div class="picker">${CHARACTERS.map(c => `
      <button class="card ${c.id === def.id ? 'selected' : ''}" data-side="${side}" data-id="${c.id}">
        <img src="${thumbnail(c)}" alt="${c.name}"><span>${c.name}</span>
      </button>`).join('')}</div></div>`;
    el.changePickers.innerHTML = col('player', playerDef, 'you') + (enemyDef ? col('enemy', enemyDef, 'enemy') : '');
    el.changePickers.querySelectorAll('.card').forEach(b => {
      b.onclick = () => { if (!b.classList.contains('selected')) fn(b.dataset.side, b.dataset.id); };
    });
    $('btn-change').onclick = () => el.changePickers.classList.toggle('open');
  },

  // Weapon icon in the center of the screen after switching weapons
  showWeapon(id) {
    el.weaponFlash.innerHTML = `${weaponIcon(id)}<span>${t('weapon.' + id)}</span>`;
    el.weaponFlash.style.display = 'flex';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { el.weaponFlash.style.display = 'none'; }, HUD.weaponIconSeconds * 1000);
  },

  showPause(on) { el.pause.style.display = on ? 'flex' : 'none'; },

  onResume(fn) {
    $('btn-resume').onclick = fn;
    $('btn-fs-pause').onclick = toggleFullscreen;
  },
  onQuit(fn) { $('btn-quit').onclick = $('btn-result-quit').onclick = fn; },
};
