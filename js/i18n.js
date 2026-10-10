// Translations. Language comes from the saved choice, then the browser, and falls back to English.
// To add a language, add a new entry below (any missing key falls back to English).
const STRINGS = {
  en: {
    'fullscreen': '⛶ Fullscreen (F)',
    'you': 'You',
    'enemy': 'Enemy',
    'mode.duel': '1v1',
    'mode.training': 'Training',
    'mode.multi': 'Multiplayer',
    'mode.duel.desc': 'Duel the bot',
    'section.map': 'Map',
    'section.pick': 'Choose:',
    'matchDialog.title': 'Match length',
    'matchDialog.timed': '{min} minutes',
    'matchDialog.unlimited': 'Unlimited',
    'result.win': 'Victory!',
    'result.lose': 'Defeat',
    'result.draw': 'Draw',
    'result.restart': 'Play again',
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
    'map.arena': 'Arena',
    'map.moon': 'Moon',
    'map.forest': 'Forest',
    'map.assault': 'Assault',
    'map.plaza': 'Plaza',
    'weapon.pistol': 'Pistol',
    'weapon.ak47': 'AK-47',
    'weapon.awp': 'AWP',
    'weapon.shotgun': 'Shotgun',
    'weapon.bazooka': 'Bazooka',
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
    'hud.resetConfirm': 'Are you sure you want to restore the controls to the default layout?',
    'confirm.yes': 'Yes',
    'confirm.no': 'Cancel',
    'hud.done': 'Done',
    'hud.hint': 'Drag a control to move it · Tap it to select and resize',
    'banner.go': 'GO!',
    'reloading': 'RELOADING…',
    'noAmmo': 'OUT OF AMMO (R)',
    'hit.headshotKill': 'HEADSHOT KILL',
    'hit.kill': 'ELIMINATED',
    'hit.headshot': 'HEADSHOT',
  },
  pt: {
    'fullscreen': '⛶ Tela cheia (F)',
    'you': 'Você',
    'enemy': 'Inimigo',
    'mode.duel': '1v1',
    'mode.training': 'Treinamento',
    'mode.multi': 'Multiplayer',
    'mode.duel.desc': 'Duelo contra o bot',
    'section.map': 'Mapa',
    'section.pick': 'Escolher:',
    'matchDialog.title': 'Duração da partida',
    'matchDialog.timed': '{min} minutos',
    'matchDialog.unlimited': 'Ilimitado',
    'result.win': 'Vitória!',
    'result.lose': 'Derrota',
    'result.draw': 'Empate',
    'result.restart': 'Jogar de novo',
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
    'map.arena': 'Arena',
    'map.moon': 'Lua',
    'map.forest': 'Floresta',
    'map.assault': 'Assault',
    'map.plaza': 'Praça',
    'weapon.pistol': 'Pistola',
    'weapon.ak47': 'AK-47',
    'weapon.awp': 'AWP',
    'weapon.shotgun': 'Escopeta',
    'weapon.bazooka': 'Bazuca',
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
    'hud.resetConfirm': 'Você tem certeza que quer restaurar os controles para o layout padrão?',
    'confirm.yes': 'Sim',
    'confirm.no': 'Cancelar',
    'hud.done': 'Concluir',
    'hud.hint': 'Arraste um controle para mover · Toque nele para selecionar e mudar o tamanho',
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
