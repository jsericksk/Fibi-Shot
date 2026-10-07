import { CHARACTERS, getCharacter } from '../characters/index.js';
import { thumbnail } from './thumbnails.js';
import { MAP_LIST } from '../maps.js';
import { sfx } from '../audio.js';
import { net } from '../net.js';
import { askMatchDuration } from './match-dialog.js';
import { t, applyI18n, onLangChange } from '../i18n.js';

// Multiplayer lobby: create or join a room, pick characters (and the map, host only), then start.
// Lobby messages: hello {char, map?} | char {id} | map {id} | start {map, duration}
export function initLobby({ onStart, onBack }) {
  const $ = id => document.getElementById(id);
  const state = { me: 'fibi', friend: null, map: MAP_LIST[0].id, code: '', statusKey: '' };

  const isHost = () => net.role === 'host';

  function setStatus(key) {
    state.statusKey = key;
    $('lobby-status').textContent = key ? t(key) : '';
  }

  function showRoom(on) {
    $('lobby-connect').classList.toggle('hidden', on);
    $('lobby-room').classList.toggle('hidden', !on);
  }

  function render() {
    const me = getCharacter(state.me);
    $('lobby-big-me').src = thumbnail(me);
    $('lobby-name-me').textContent = me.name;
    const pick = $('lobby-pick');
    pick.innerHTML = CHARACTERS.map(c => `
      <button class="card ${c.id === state.me ? 'selected' : ''}" data-id="${c.id}">
        <img src="${thumbnail(c)}" alt="${c.name}"><span>${c.name}</span>
      </button>`).join('');
    pick.querySelectorAll('.card').forEach(btn => {
      btn.onclick = () => {
        state.me = btn.dataset.id;
        sfx.click();
        net.send({ t: 'char', id: state.me });
        render();
      };
    });

    const friend = state.friend && getCharacter(state.friend);
    $('lobby-big-friend').style.visibility = friend ? 'visible' : 'hidden';
    if (friend) $('lobby-big-friend').src = thumbnail(friend);
    $('lobby-name-friend').textContent = friend ? friend.name : '…';

    const maps = $('lobby-maps');
    maps.classList.toggle('locked', !isHost());   // only the host picks the map
    maps.innerHTML = MAP_LIST.map(m => `
      <button class="map ${state.map === m.id ? 'selected' : ''}" data-id="${m.id}">
        <i style="background:${m.preview}"></i><span>${t('map.' + m.id)}</span>
      </button>`).join('');
    maps.querySelectorAll('.map').forEach(btn => {
      btn.onclick = () => {
        state.map = btn.dataset.id;
        sfx.click();
        net.send({ t: 'map', id: state.map });
        render();
      };
    });

    const start = $('btn-lobby-start');
    start.classList.toggle('hidden', !isHost());
    start.disabled = !state.friend;
  }

  function begin(mapId, duration) {
    onStart(getCharacter(state.me), getCharacter(state.friend), mapId, net.role, duration);
  }

  function onMessage(m) {
    switch (m.t) {
      case 'hello':
        state.friend = m.char;
        if (m.map) state.map = m.map;
        setStatus(isHost() ? 'lobby.ready' : 'lobby.waitHost');
        render();
        break;
      case 'char': state.friend = m.id; render(); break;
      case 'map': state.map = m.id; render(); break;
      case 'start': if (state.friend) begin(m.map, m.duration); break;
    }
  }

  // Back to the connect panel after the friend leaves or the connection drops
  function onLost() {
    state.friend = null;
    showRoom(false);
    setStatus('lobby.left');
  }

  function listen() {
    net.setHandler(onMessage);
    net.setCloseHandler(onLost);
  }

  async function create() {
    setStatus('lobby.connecting');
    state.friend = null;
    listen();
    // The host greets the friend as soon as they connect
    net.setConnectHandler(() => net.send({ t: 'hello', char: state.me, map: state.map }));
    try {
      state.code = await net.host();
    } catch {
      setStatus('lobby.error');
      return;
    }
    $('room-code').textContent = state.code;
    showRoom(true);
    setStatus('lobby.waiting');
    render();
  }

  async function join(code) {
    code = code.trim().toUpperCase();
    if (code.length < 5) return;
    setStatus('lobby.connecting');
    state.friend = null;
    listen();
    try {
      await net.join(code);
    } catch {
      net.close();
      setStatus('lobby.error');
      return;
    }
    state.code = code;
    $('room-code').textContent = code;
    net.send({ t: 'hello', char: state.me });
    showRoom(true);
    setStatus('lobby.waitHost');
    render();
  }

  $('btn-create').onclick = () => { sfx.click(); create(); };
  $('btn-join').onclick = () => { sfx.click(); join($('join-code').value); };
  $('join-code').onkeydown = e => { if (e.key === 'Enter') join($('join-code').value); };
  $('btn-copy').onclick = async () => {
    sfx.click();
    const link = `${location.origin}${location.pathname}?room=${state.code}`;
    try { await navigator.clipboard.writeText(link); setStatus('lobby.copied'); } catch { $('lobby-status').textContent = link; }
  };
  $('btn-lobby-start').onclick = () => {
    if (!state.friend) return;
    sfx.click();
    askMatchDuration(duration => {
      net.send({ t: 'start', map: state.map, duration });
      begin(state.map, duration);
    });
  };
  $('btn-lobby-back').onclick = () => { sfx.click(); net.close(); onBack(); };

  onLangChange(() => { if (!$('lobby-room').classList.contains('hidden')) render(); setStatus(state.statusKey); });

  return {
    // Shows the lobby; with a room code (from the link) it joins that room right away
    open(roomCode) {
      net.close();
      state.friend = null;
      showRoom(false);
      setStatus('');
      applyI18n();
      if (roomCode) { $('join-code').value = roomCode.toUpperCase(); join(roomCode); }
    },
  };
}
