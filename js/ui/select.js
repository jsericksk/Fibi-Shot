import { CHARACTERS, getCharacter } from '../characters/index.js';
import { thumbnail } from './thumbnails.js';
import { initHomeStage } from './home-stage.js';
import { ICONS } from './touch.js';
import { weaponIcon } from './hud.js';
import { sfx } from '../audio.js';
import { MAP_LIST } from '../maps.js';
import { toggleFullscreen } from '../fullscreen.js';
import { askMatchDuration } from './match-dialog.js';
import { t, applyI18n, setLang, getLang, LANGS, onLangChange } from '../i18n.js';

// Character select screen: pick your fighter and your enemy, then start
export function initSelect({ onStart, onMultiplayer }) {
  const state = { player: 'fibi', enemy: 'guga', enemy2: null, map: MAP_LIST[0].id, picking: 'player' };
  const $ = id => document.getElementById(id);
  $('btn-stage-emote').innerHTML = ICONS.emote;
  $('play-icon').innerHTML = weaponIcon('ak47');
  const showFighter = { player: initHomeStage($('stage-player'), $('btn-stage-emote')), enemy: initHomeStage($('stage-enemy')) };   // enemy2 is created when the second enemy is added

  // One strip of characters for whichever side is being picked (tap a fighter to switch side)
  function renderRoster() {
    $('roster').innerHTML = CHARACTERS.map(c => `
      <button class="card" data-id="${c.id}"><img src="${thumbnail(c)}" alt="${c.name}"><span>${c.name}</span></button>`).join('');
    $('roster').querySelectorAll('.card').forEach(btn => {
      btn.onclick = () => { state[state.picking] = btn.dataset.id; sfx.click(); refresh(); };
    });
  }

  // Only toggles classes, so the strip keeps its scroll position
  function markRoster() {
    $('roster').querySelectorAll('.card').forEach(c => c.classList.toggle('selected', c.dataset.id === state[state.picking]));
    $('pick-for').textContent = t(state.picking === 'player' ? 'you' : state.picking === 'enemy' ? 'enemy' : 'enemy2');
    document.querySelectorAll('.fighter').forEach(f => f.classList.toggle('active', f.dataset.side === state.picking));
  }

  function renderMaps() {
    const box = $('pick-map');
    box.innerHTML = MAP_LIST.map(m => `
      <button class="map ${state.map === m.id ? 'selected' : ''}" data-id="${m.id}" title="${t('map.' + m.id)}">
        <i style="background:${m.preview}"></i><span>${t('map.' + m.id)}</span>
      </button>`).join('');
    box.querySelectorAll('.map').forEach(btn => {
      btn.onclick = () => { state.map = btn.dataset.id; sfx.click(); renderMaps(); };
    });
  }

  const staged = {};   // character on each 3D stage: it only changes when another one is picked
  function refresh() {
    for (const side of state.enemy2 ? ['player', 'enemy', 'enemy2'] : ['player', 'enemy']) {
      const def = getCharacter(state[side]);
      if (staged[side] !== def.id) showFighter[side](def);
      staged[side] = def.id;
      $(`name-${side}`).textContent = def.name;
    }
    markRoster();
    renderMaps();
    updateDuel();
  }

  // Layout and labels that depend on having one or two enemies
  function updateDuel() {
    const two = !!state.enemy2;
    $('fighter-enemy2').classList.toggle('empty', !two);   // hidden but still taking its room
    $('btn-add-enemy').classList.toggle('hidden', two);
    $('btn-add-enemy').title = t('addEnemy');
    $('play-title').textContent = t(two ? 'mode.duel2' : 'mode.duel');
    $('play-desc').textContent = t(two ? 'mode.duel2.desc' : 'mode.duel.desc');
  }

  // The second enemy starts as the first character that is neither you nor the first enemy
  $('btn-add-enemy').onclick = () => {
    sfx.click();
    state.enemy2 = CHARACTERS.find(c => c.id !== state.player && c.id !== state.enemy).id;
    state.picking = 'enemy2';
    showFighter.enemy2 ??= initHomeStage($('stage-enemy2'));
    refresh();
  };
  $('btn-remove-enemy').onclick = e => {
    e.stopPropagation();   // the click must not select the fighter that is going away
    sfx.click();
    state.enemy2 = null;
    delete staged.enemy2;
    if (state.picking === 'enemy2') state.picking = 'enemy';
    refresh();
  };

  const begin = (mode, duration = 0) => {
    const second = mode === 'duel' && state.enemy2 ? getCharacter(state.enemy2) : null;   // only duels have a second enemy
    onStart(getCharacter(state.player), getCharacter(state.enemy), mode, state.map, duration, second);
  };
  $('btn-start').onclick = () => { sfx.unlock(); sfx.click(); askMatchDuration(seconds => begin('duel', seconds)); };
  $('btn-train').onclick = () => { sfx.unlock(); sfx.click(); begin('training'); };
  $('btn-multi').onclick = () => { sfx.unlock(); sfx.click(); onMultiplayer(); };
  document.querySelectorAll('.fighter').forEach(f => {
    f.onclick = () => { if (state.picking !== f.dataset.side) { state.picking = f.dataset.side; sfx.click(); markRoster(); } };
  });
  // Training shows every character, so the enemy choice does not matter: dim it while Training is hovered
  const screen = $('screen-select');
  const preview = on => () => screen.classList.toggle('training-preview', on);
  for (const ev of [['mouseenter', true], ['mouseleave', false], ['focus', true], ['blur', false]]) $('btn-train').addEventListener(ev[0], preview(ev[1]));

  // PT / EN switch in the menu
  function renderLangs() {
    const box = $('lang-pick');
    box.innerHTML = LANGS.map(l => `<button class="lang ${getLang() === l ? 'selected' : ''}" data-l="${l}">${l.toUpperCase()}</button>`).join('');
    box.querySelectorAll('.lang').forEach(b => { b.onclick = () => { sfx.click(); setLang(b.dataset.l); }; });
  }
  onLangChange(() => { renderMaps(); renderLangs(); markRoster(); updateDuel(); });

  $('btn-fs').onclick = () => { sfx.click(); toggleFullscreen(); };

  applyI18n();
  renderLangs();
  renderRoster();
  refresh();
}
