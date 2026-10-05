import { Game } from './game/game.js';
import { hud } from './ui/hud.js';
import { initSelect } from './ui/select.js';
import { initLobby } from './ui/lobby.js';
import { initTouch } from './ui/touch.js';

const screens = {
  select: document.getElementById('screen-select'),
  lobby: document.getElementById('screen-lobby'),
  game: document.getElementById('screen-game'),
};
const game = new Game(document.getElementById('game'), hud);

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.classList.toggle('hidden', key !== name);
}

game.onMenu = () => show('select');
initTouch(game);   // before the menus so the touch help text is the one translated

const lobby = initLobby({
  onStart(playerDef, enemyDef, mapId, role) {
    show('game');            // canvas must be visible before requesting pointer lock
    game.resize();
    game.start(playerDef, enemyDef, 'multi', mapId, { role });
  },
  onBack: () => show('select'),
});

initSelect({
  onStart(playerDef, enemyDef, mode, mapId) {
    show('game');
    game.resize();
    game.start(playerDef, enemyDef, mode, mapId);
  },
  onMultiplayer() {
    show('lobby');
    lobby.open();
  },
});

// A link like ?room=ABCDE jumps straight into that room
const room = new URLSearchParams(location.search).get('room');
if (room) {
  show('lobby');
  lobby.open(room);
}
