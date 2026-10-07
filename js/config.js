// ============================================================================
// Fibi Shot game settings. Every tunable number lives here (times are in seconds).
// ============================================================================

// ---- Match -----------------------------------------------------------------
export const MATCH = {
  countdown: 4,               // seconds of "3, 2, 1" before a duel starts (training skips it)
  respawnDelay: 2.5,          // seconds a dead fighter waits before coming back
  spawnProtection: 1.5,       // invulnerability after spawning
  minSpawnDistance: 20,       // respawn spots are at least this far from the other fighter
  maxHp: 100,
  bulletRange: 140,           // hitscan max distance
  timedSeconds: 300,          // length of the timed match (the other option is unlimited)
};

// ---- World -----------------------------------------------------------------
export const WORLD = {
  arenaHalf: 30,              // map is a square of (2 * arenaHalf) meters
  gravity: 10,                // same floaty, moon-like jump on every map
  fighterRadius: 0.45,        // collision radius
  stepUp: 0.35,               // max height difference walked onto without jumping
};

// ---- Camera ----------------------------------------------------------------
export const CAMERA = {
  fov: 62,
  far: 260,
  distance: 4.2,              // over-the-shoulder boom length
  shoulder: 1.05,             // sideways offset
  height: 1.95,
  scopeForward: 0.35,         // sniper scope view sits this far ahead of the shoulder point
  scopeZoomRate: 45,          // higher = snappier scope (quick scope)
  orbitDistance: 3.4,         // Alt-look camera distance
};

// ---- Player ----------------------------------------------------------------
export const PLAYER = {
  sensitivity: 0.0022,
  walkSpeed: 7.5,
  jumpSpeed: 8.2,
  // Extra spread (radians) when moving
  moveSpread: 0.002,          // normal weapons
  moveSpreadAwp: 0.008,       // AWP (sniper) when not aiming
  airSpread: 0.03,            // any shot while jumping
};

// ---- Emotes (H key) ----------------------------------------------------------
// Each character has its own emotes; one is picked at random when pressing H.
// dance: animation name from js/characters/dances.js (ballet, idol, penguin, flail) | duration: seconds | sound: mp3 in audio/emotes
export const EMOTES = {
  fibi: [
    { dance: 'ballet', duration: 7, sound: 'audio/emotes/fibi-emote-1.mp3' },
    { dance: 'idol', duration: 5, sound: 'audio/emotes/fibi-emote-2.mp3' },
  ],
  guga: [{ dance: 'penguin', duration: 5, sound: 'audio/emotes/guga-emote-1.mp3' }],
  nono: [{ dance: 'flail', duration: 5, sound: 'audio/emotes/nono-emote-1.mp3' }],
  default: [{ dance: 'idol', duration: 5, sound: null }],   // characters without their own emotes
};
export const EMOTE = {
  volume: 0.8,
  fadeOut: 0.15,              // seconds to fade the sound when the dance is cancelled
  hearRange: 35,              // other characters' emote sounds fade out with distance up to this many meters
};

// ---- HUD -------------------------------------------------------------------
export const HUD = {
  weaponIconSeconds: 0.3,     // weapon icon shown in the center after switching
  hitMarkerMs: 350,
  timerWarnSeconds: 30,       // the timer turns red in the last seconds
  fullscreenSwitchMs: 600,    // the browser drops the mouse lock during a fullscreen change; unlocks in this window are not a pause
};

// ---- Touch controls --------------------------------------------------------
export const TOUCH = {
  lookSensitivity: 1.6,       // finger drags turn faster than the mouse
  weaponSwipe: 24,            // px of sliding on the weapon button to step to the next weapon
  joystickDeadZone: 0.15,     // fraction of the stick radius that is ignored
  joystickZone: 42,           // % of the screen width (from the left) where a touch starts the stick
  sizeRange: { min: 40, max: 180, step: 2 },   // px, for the layout editor
  sizeRanges: { ammo: { min: 14, max: 48, step: 1 }, timer: { min: 14, max: 48, step: 1 } },   // controls that need their own range
  // Center of each control in % of the screen, and its size in px
  layout: {
    joystick: { x: 13, y: 80, size: 110 },
    fire: { x: 88, y: 64, size: 100 },
    jump: { x: 74, y: 80, size: 68 },
    scope: { x: 76, y: 52, size: 60 },
    weapon: { x: 36, y: 86, size: 56 },
    reload: { x: 95, y: 36, size: 56 },
    emote: { x: 64, y: 30, size: 52 },
    pause: { x: 6, y: 32, size: 44 },
    ammo: { x: 50, y: 92, size: 22 },   // size is the font size in px
    timer: { x: 50, y: 5, size: 22 },   // font size in px too
  },
};

// ---- Enemy AI --------------------------------------------------------------
export const ENEMY = {
  minRange: 8,                // backs off when closer than this
  maxRange: 22,               // chases when farther than this
  awpCharge: 0.7,            // seconds the AWP glints before the shot
  firstShotDelay: 1.0,
  noticeAimDot: 0.99,         // a dancing bot stops when the player scopes within this (cosine) of it
  tauntChance: 0.35,          // odds of dancing to taunt after killing the player
  jumpEvery: [2.5, 6],        // seconds between random hops while moving
  awpCounterChance: 0.8,      // when the player uses the AWP, odds the bot picks it too
  aimError: { pistol: 0.035, ak47: 0.05, awp: 0.02, shotgun: 0.03 },     // radians, lower is more accurate
  fireRange: { pistol: 26, ak47: 34, awp: 70, shotgun: 14 },          // meters
};

// ---- Multiplayer (PeerJS) ---------------------------------------------------
export const NET = {
  sendRate: 30,               // state updates per second
  smoothing: 18,              // how fast the remote player catches up with its latest position (higher = snappier)
  snapDistance: 6,            // teleports instead of sliding when farther than this (respawns)
  pingMs: 2000,
  timeoutMs: 8000,            // no message for this long = the friend is gone
  joinTimeoutMs: 10000,
  // Add a TURN server here if some friends cannot connect (strict routers or mobile networks)
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

// ---- Training showcase -----------------------------------------------------------
// In training every other character walks around the map as a living showcase.
export const SHOWCASE = {
  walkSpeed: 3.2,
  emoteEvery: [10, 22],       // seconds between emotes of each character
  waypointTime: [4, 9],       // seconds before picking a new place to walk to
  spawnDistance: 7,           // minimum distance between characters when they appear
};

// ---- Weapons ---------------------------------------------------------------
// damage: per body hit | headMult: headshot multiplier | interval: seconds between shots
// mag: bullets per magazine | reload: seconds | spread/bloom/bloomMax: radians
// recoil: camera kick per shot (radians) | scoped: aiming (right click / aim button): fov zoom, spread (0 = pinpoint),
// speed = walking speed while aiming, sniper = full scope view (black mask) instead of the normal crosshair
// pellets/pelletSpread: shotgun fires this many rays inside a cone (radians); `damage` is per pellet
// falloff: damage multiplier goes from 1 at `start` meters down to `min` at `end` meters (and stays there)
const LIGHT_AIM = { fov: 50, spread: 0, speed: 5 };   // a small zoom, shots land exactly on the crosshair

export const WEAPON_STATS = {
  pistol: { id: 'pistol', name: 'Pistola', damage: 24, headMult: 2, interval: 0.3, auto: false, mag: 12, reload: 1.1, spread: 0.004, bloom: 0.006, bloomMax: 0.03, recoil: 0.016, scoped: LIGHT_AIM },
  ak47: { id: 'ak47', name: 'AK-47', damage: 14, headMult: 2.2, interval: 0.1, auto: true, mag: 30, reload: 1.9, spread: 0.0008, bloom: 0.0015, bloomMax: 0.01, recoil: 0.014, scoped: LIGHT_AIM },
  shotgun: { id: 'shotgun', name: 'Escopeta', damage: 9, headMult: 1.5, interval: 0.9, auto: false, mag: 6, reload: 2.4, spread: 0.004, bloom: 0, bloomMax: 0, recoil: 0.06, pellets: 8, pelletSpread: 0.055, falloff: { start: 5, end: 20, min: 0.08 }, scoped: LIGHT_AIM },
  awp: { id: 'awp', name: 'AWP', damage: 90, headMult: 2, interval: 0.8, auto: false, mag: 5, reload: 2.4, spread: 0.06, bloom: 0, bloomMax: 0, recoil: 0.07, scoped: { fov: 18, spread: 0, speed: 3.2, sniper: true } },
};
