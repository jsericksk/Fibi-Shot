// Generic synthesized sound effects (WebAudio, no asset files)
let ctx, noiseBuf;

function init() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

// Filtered noise burst with exponential decay
function noise(dur, { type = 'lowpass', freq = 2000, vol = 0.3, delay = 0 } = {}) {
  const c = init(), t = c.currentTime + delay;
  const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
  src.buffer = noiseBuf;
  filter.type = type;
  filter.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur);
}

// Oscillator sweep from f0 to f1
function tone(f0, f1, dur, { type = 'sine', vol = 0.2, delay = 0 } = {}) {
  const c = init(), t = c.currentTime + delay;
  const osc = c.createOscillator(), gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const safe = fn => (...a) => { try { fn(...a); } catch { /* audio is optional */ } };

// ---- Audio files (mp3) --------------------------------------------------------
// Decoded once and cached. A missing or broken file is cached as null and just stays silent.
const clips = new Map();
function loadClip(url) {
  if (!clips.has(url)) {
    clips.set(url, fetch(url)
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then(buf => init().decodeAudioData(buf))
      .catch(() => null));
  }
  return clips.get(url);
}

// Each "voice" is one playing mp3 (e.g. 'player', 'bot-1'). Playing on a voice replaces what it was playing.
const voices = new Map();   // key -> { src, gain }
const tokens = new Map();   // key -> counter that cancels clips still loading

async function playVoice(key, url, vol = 1) {
  if (!url) return;
  const mine = (tokens.get(key) ?? 0) + 1;
  tokens.set(key, mine);
  stopNow(key, 0);
  const buf = await loadClip(url);
  if (!buf || tokens.get(key) !== mine) return;   // missing file, or stopped/replaced while loading
  const c = init(), src = c.createBufferSource(), gain = c.createGain();
  src.buffer = buf;
  gain.gain.value = vol;
  src.connect(gain).connect(c.destination);
  src.start();
  voices.set(key, { src, gain });
  src.onended = () => { if (voices.get(key)?.src === src) voices.delete(key); };
}

function stopNow(key, fade) {
  const v = voices.get(key);
  if (!v) return;
  voices.delete(key);
  if (fade > 0) {
    v.gain.gain.setValueAtTime(v.gain.gain.value, ctx.currentTime);
    v.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    v.src.stop(ctx.currentTime + fade);
  } else v.src.stop();
}

function stopVoice(key, fade = 0) {
  tokens.set(key, (tokens.get(key) ?? 0) + 1);   // also cancels a clip that is still loading
  stopNow(key, fade);
}

function stopAllVoices(fade = 0) {
  for (const key of new Set([...voices.keys(), ...tokens.keys()])) stopVoice(key, fade);
}

function setVoiceVolume(key, vol) {
  const v = voices.get(key);
  if (v) v.gain.gain.value = vol;
}

export const sfx = {
  preload: safe(urls => urls.forEach(u => u && loadClip(u))),
  playVoice: safe(playVoice),
  stopVoice: safe(stopVoice),
  stopAll: safe(stopAllVoices),
  setVoiceVolume: safe(setVoiceVolume),
  unlock: safe(init),
  // vol: 0..1 distance attenuation
  shot: safe((id, vol = 1) => {
    if (id === 'pistol') { noise(0.12, { type: 'highpass', freq: 900, vol: 0.35 * vol }); tone(220, 60, 0.1, { type: 'square', vol: 0.15 * vol }); }
    if (id === 'ak47') { noise(0.14, { type: 'lowpass', freq: 3200, vol: 0.4 * vol }); tone(160, 45, 0.12, { type: 'sawtooth', vol: 0.2 * vol }); }
    if (id === 'shotgun') { noise(0.35, { type: 'lowpass', freq: 2600, vol: 0.7 * vol }); tone(110, 30, 0.3, { type: 'sawtooth', vol: 0.45 * vol }); noise(0.06, { type: 'highpass', freq: 2000, vol: 0.35 * vol }); }
    if (id === 'awp') { noise(0.5, { type: 'lowpass', freq: 1800, vol: 0.6 * vol }); tone(120, 28, 0.45, { type: 'sine', vol: 0.5 * vol }); noise(0.08, { type: 'highpass', freq: 2500, vol: 0.4 * vol }); }
  }),
  reload: safe(() => { tone(900, 500, 0.05, { type: 'square', vol: 0.08 }); tone(500, 800, 0.05, { type: 'square', vol: 0.08, delay: 0.5 }); }),
  jump: safe(() => tone(260, 520, 0.12, { type: 'sine', vol: 0.12 })),
  switch: safe(() => { noise(0.05, { type: 'bandpass', freq: 1500, vol: 0.2 }); }),
  hit: safe(head => { tone(head ? 1500 : 900, head ? 1200 : 700, 0.09, { type: 'triangle', vol: 0.25 }); }),
  // Deep thud with a dry crack on top, like a helmet breaking
  headshotKill: safe(() => {
    tone(110, 35, 0.5, { type: 'sine', vol: 0.7 });
    noise(0.07, { type: 'highpass', freq: 1800, vol: 0.5 });
    noise(0.3, { type: 'lowpass', freq: 500, vol: 0.6 });
    tone(320, 90, 0.12, { type: 'square', vol: 0.15, delay: 0.02 });
  }),
  // Huge boom: sharp crack, then a deep rumble that rolls on for seconds
  nuke: safe((vol = 1) => {
    noise(0.25, { type: 'highpass', freq: 1200, vol: 0.9 * vol });
    tone(90, 20, 4, { type: 'sine', vol: 1 * vol });
    tone(55, 18, 5, { type: 'sawtooth', vol: 0.35 * vol });
    noise(5, { type: 'lowpass', freq: 380, vol: 1 * vol });
    noise(3, { type: 'lowpass', freq: 160, vol: 0.9 * vol, delay: 0.8 });
  }),
  hurt: safe(() => { tone(180, 70, 0.2, { type: 'sawtooth', vol: 0.3 }); noise(0.1, { type: 'lowpass', freq: 600, vol: 0.3 }); }),
  beep: safe(high => tone(high ? 880 : 520, high ? 880 : 520, 0.14, { type: 'square', vol: 0.12 })),
  click: safe(() => tone(700, 900, 0.05, { type: 'triangle', vol: 0.12 })),
  win: safe(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.2, { type: 'triangle', vol: 0.2, delay: i * 0.13 }))),
  lose: safe(() => [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.95, 0.28, { type: 'sawtooth', vol: 0.15, delay: i * 0.18 }))),
};
