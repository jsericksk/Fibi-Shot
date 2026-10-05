import { CHARACTERS, getCharacter } from '../characters/index.js';
import { thumbnail } from './thumbnails.js';
import { sfx } from '../audio.js';
import { MAP_LIST } from '../maps.js';
import { toggleFullscreen } from '../fullscreen.js';
import { t, applyI18n, setLang, getLang, LANGS, onLangChange } from '../i18n.js';

// Character select screen: pick your fighter and your enemy, then start
export function initSelect({ onStart, onMultiplayer }) {
  const state = { player: 'fibi', enemy: 'guga', map: MAP_LIST[0].id };
  const $ = id => document.getElementById(id);

  function renderPicker(side) {
    const box = $(`pick-${side}`);
    box.innerHTML = CHARACTERS.map(c => `
      <button class="card ${state[side] === c.id ? 'selected' : ''}" data-id="${c.id}">
        <img src="${thumbnail(c)}" alt="${c.name}"><span>${c.name}</span>
      </button>`).join('');
    box.querySelectorAll('.card').forEach(btn => {
      btn.onclick = () => { state[side] = btn.dataset.id; sfx.click(); refresh(); };
    });
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

  function refresh() {
    for (const side of ['player', 'enemy']) {
      const def = getCharacter(state[side]);
      $(`big-${side}`).src = thumbnail(def);
      $(`name-${side}`).textContent = def.name;
      renderPicker(side);
    }
    renderMaps();
  }

  const begin = mode => () => {
    sfx.unlock();
    sfx.click();
    onStart(getCharacter(state.player), getCharacter(state.enemy), mode, state.map);
  };
  $('btn-start').onclick = begin('duel');
  $('btn-train').onclick = begin('training');
  $('btn-multi').onclick = () => { sfx.unlock(); sfx.click(); onMultiplayer(); };
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
  onLangChange(() => { renderMaps(); renderLangs(); });

  $('btn-fs').onclick = () => { sfx.click(); toggleFullscreen(); };

  applyI18n();
  renderLangs();
  refresh();
}
