// Translations. Language comes from the saved choice, then the browser, and falls back to English.
// To add a language, add a new entry below (any missing key falls back to English).
const STRINGS = {
  en: {
    'fullscreen': '⛶ Fullscreen (F)',
    'subtitle': 'Choose your character and your enemy',
    'you': 'You',
    'enemy': 'Enemy',
    'mode.duel': '1v1',
    'mode.training': 'Training',
    'mode.multi': 'Multiplayer',
    'mode.duel.desc': 'Duel the bot',
    'mode.training.desc': 'Free practice, no pressure',
    'mode.multi.desc': 'Play with a friend online',
    'section.map': 'Map',
    'matchDialog.title': 'Match type',
    'matchDialog.timed': '{min} minutes',
    'matchDialog.unlimited': 'Unlimited',
    'result.win': 'Victory!',
    'result.lose': 'Defeat',
    'result.draw': 'Draw',
    'lobby.create': 'Create room',
    'lobby.join': 'Join',
    'lobby.codePlaceholder': 'CODE',
    'lobby.code': 'Room code:',
    'lobby.copy': 'Copy link',
    'lobby.copied': 'Link copied!',
    'lobby.friend': 'Friend',
    'lobby.start': 'Start',
    'lobby.back': 'Back',
    'lobby.connecting': 'Connecting…',
    'lobby.waiting': 'Waiting for a friend to join…',
    'lobby.waitHost': 'Waiting for the host to start…',
    'lobby.ready': 'Your friend is here. Pick your characters and start!',
    'lobby.error': 'Could not connect. Check the code and try again.',
    'lobby.left': 'Your friend left the room.',
    'toast.opponentLeft': 'Your friend left the match',
    'help': 'WASD move · Mouse aim · Click shoot · 1/2/3/4 weapons · R reload · Right click: aim · H: emote · Hold Alt and move the mouse: see your character',
    'help.touch': 'Left stick: move · Drag the right side: aim · Buttons: shoot (drag to aim), jump, reload, scope, dance, weapon',
    'touch.fire': 'Fire',
    'touch.jump': 'Jump',
    'touch.scope': 'Aim',
    'touch.reload': 'Reload',
    'touch.emote': 'Dance',
    'touch.weapon': 'Weapon',
    'touch.pause': 'II',
    'map.arena': 'Arena',
    'map.moon': 'Moon',
    'weapon.pistol': 'Pistol',
    'weapon.ak47': 'AK-47',
    'weapon.awp': 'AWP',
    'weapon.shotgun': 'Shotgun',
    'pause.title': 'Paused',
    'pause.hint': 'Click to return to the match',
    'pause.resume': 'Resume',
    'pause.quit': 'Quit to menu',
    'pause.change': 'Change character',
    'pause.sensitivity': 'Camera sensitivity',
    'pause.aimSensitivity': 'Aim sensitivity',
    'pause.editHud': 'Edit controls',
    'hud.size': 'Size',
    'hud.opacity': 'Opacity',
    'hud.reset': 'Reset',
    'hud.done': 'Done',
    'hud.hint': 'Drag a control to move it · Tap it to select and resize',
    'toast.pickWeapon': 'Choose your weapon: 1 · 2 · 3 · 4',
    'toast.pickWeaponTouch': 'Choose your weapon with the weapon button',
    'toast.killedYou': '{name} eliminated you',
    'toast.youKilled': 'You eliminated {name}!',
    'banner.go': 'GO!',
    'reloading': 'RELOADING…',
    'noAmmo': 'OUT OF AMMO (R)',
    'hit.headshotKill': 'HEADSHOT KILL',
    'hit.kill': 'ELIMINATED',
    'hit.headshot': 'HEADSHOT',
  },
  pt: {
    'fullscreen': '⛶ Tela cheia (F)',
    'subtitle': 'Escolha seu personagem e o inimigo',
    'you': 'Você',
    'enemy': 'Inimigo',
    'mode.duel': '1v1',
    'mode.training': 'Treinamento',
    'mode.multi': 'Multiplayer',
    'mode.duel.desc': 'Duelo contra o bot',
    'mode.training.desc': 'Treino livre, sem pressão',
    'mode.multi.desc': 'Jogue online com um amigo',
    'section.map': 'Mapa',
    'matchDialog.title': 'Tipo de partida',
    'matchDialog.timed': '{min} minutos',
    'matchDialog.unlimited': 'Ilimitado',
    'result.win': 'Vitória!',
    'result.lose': 'Derrota',
    'result.draw': 'Empate',
    'lobby.create': 'Criar sala',
    'lobby.join': 'Entrar',
    'lobby.codePlaceholder': 'CÓDIGO',
    'lobby.code': 'Código da sala:',
    'lobby.copy': 'Copiar link',
    'lobby.copied': 'Link copiado!',
    'lobby.friend': 'Amigo',
    'lobby.start': 'Começar',
    'lobby.back': 'Voltar',
    'lobby.connecting': 'Conectando…',
    'lobby.waiting': 'Esperando um amigo entrar…',
    'lobby.waitHost': 'Esperando o anfitrião começar…',
    'lobby.ready': 'Seu amigo chegou. Escolham os personagens e comecem!',
    'lobby.error': 'Não foi possível conectar. Confira o código e tente de novo.',
    'lobby.left': 'Seu amigo saiu da sala.',
    'toast.opponentLeft': 'Seu amigo saiu da partida',
    'help': 'WASD mover · Mouse mirar · Clique atirar · 1/2/3/4 armas · R recarregar · Botão direito: mirar · H: emote · Segure Alt e mova o mouse: ver seu personagem',
    'help.touch': 'Direcional esquerdo: mover · Arraste o lado direito: mirar · Botões: atirar (arraste para mirar), pular, recarregar, mira, dançar, arma',
    'touch.fire': 'Atirar',
    'touch.jump': 'Pular',
    'touch.scope': 'Mira',
    'touch.reload': 'Recarregar',
    'touch.emote': 'Dançar',
    'touch.weapon': 'Arma',
    'touch.pause': 'II',
    'map.arena': 'Arena',
    'map.moon': 'Lua',
    'weapon.pistol': 'Pistola',
    'weapon.ak47': 'AK-47',
    'weapon.awp': 'AWP',
    'weapon.shotgun': 'Escopeta',
    'pause.title': 'Pausado',
    'pause.hint': 'Clique para voltar à partida',
    'pause.resume': 'Continuar',
    'pause.quit': 'Sair para o menu',
    'pause.change': 'Mudar personagem',
    'pause.sensitivity': 'Sensibilidade da câmera',
    'pause.aimSensitivity': 'Sensibilidade da mira',
    'pause.editHud': 'Editar controles',
    'hud.size': 'Tamanho',
    'hud.opacity': 'Opacidade',
    'hud.reset': 'Restaurar',
    'hud.done': 'Concluir',
    'hud.hint': 'Arraste um controle para mover · Toque nele para selecionar e mudar o tamanho',
    'toast.pickWeapon': 'Escolha sua arma: 1 · 2 · 3 · 4',
    'toast.pickWeaponTouch': 'Escolha sua arma no botão de arma',
    'toast.killedYou': '{name} eliminou você',
    'toast.youKilled': 'Você eliminou {name}!',
    'banner.go': 'JÁ!',
    'reloading': 'RECARREGANDO…',
    'noAmmo': 'SEM MUNIÇÃO (R)',
    'hit.headshotKill': 'HEADSHOT KILL',
    'hit.kill': 'ELIMINADO',
    'hit.headshot': 'HEADSHOT',
  },
};

const DEFAULT_LANG = 'en';
const KEY = 'fibishot-lang';
export const LANGS = Object.keys(STRINGS);

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (STRINGS[saved]) return saved;
  } catch { /* storage blocked */ }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const p of prefs) {
    const code = String(p || '').toLowerCase().split('-')[0];
    if (STRINGS[code]) return code;
  }
  return DEFAULT_LANG;
}

let lang = detect();
const listeners = [];

export const getLang = () => lang;

// Translates a key, replacing {placeholders} from vars
export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Fills every [data-i18n] element in the page
export function applyI18n() {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}

export function onLangChange(fn) { listeners.push(fn); }

export function setLang(code) {
  if (!STRINGS[code]) return;
  lang = code;
  try { localStorage.setItem(KEY, code); } catch { /* ignore */ }
  applyI18n();
  listeners.forEach(fn => fn(code));
}
