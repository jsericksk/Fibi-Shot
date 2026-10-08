import * as THREE from 'three';
import { setIdlePose, animateRig } from '../characters/rig.js';
import { sfx } from '../audio.js';
import { EMOTES, EMOTE, HOME_STAGE } from '../config.js';
import { clamp } from '../utils.js';

const VOICE = 'home';

// Live 3D character of the home screen: it can dance (emote button) and be turned by dragging.
// Returns show(def) to switch the character.
export function initHomeStage(canvas, emoteButton) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4ea, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(2, 4, 5);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(34, canvas.width / canvas.height, 0.1, 50);
  camera.position.set(0, 2.3, 5.2);
  camera.lookAt(0, 0.95, 0);

  const rigs = {};   // built once per character
  let def = null, rig = null, emote = null, yaw = HOME_STAGE.startYaw;

  function show(next) {
    stopEmote();
    if (rig) scene.remove(rig.root);
    def = next;
    rig = rigs[def.id] ??= buildRig(def);
    scene.add(rig.root);
  }

  function buildRig(d) {
    const r = d.build();
    r.gunMount.visible = false;
    setIdlePose(r);
    return r;
  }

  function startEmote() {
    const list = EMOTES[def.id] ?? EMOTES.default;
    emote = { ...list[Math.floor(Math.random() * list.length)], t: 0 };
    sfx.playVoice(VOICE, emote.sound, EMOTE.volume);
  }

  function stopEmote() {
    if (!emote) return;
    emote = null;
    sfx.stopVoice(VOICE, EMOTE.fadeOut);
    rig.model.position.set(0, 0, 0);   // the dance may leave the model lifted or tilted
    rig.model.rotation.set(0, 0, 0);
    rig.head.rotation.set(0, 0, 0);
    rig.legs.forEach(l => l.rotation.set(0, 0, 0));
    setIdlePose(rig);
  }

  emoteButton.onclick = () => {
    sfx.unlock();
    if (emote) stopEmote(); else startEmote();
  };

  // Dragging sideways turns the character around
  let dragId = null, lastX = 0;
  canvas.addEventListener('pointerdown', e => { dragId = e.pointerId; lastX = e.clientX; canvas.setPointerCapture(dragId); });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== dragId) return;
    yaw += (e.clientX - lastX) * HOME_STAGE.turnSpeed;
    lastX = e.clientX;
  });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { dragId = null; });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    if (!rig || !canvas.offsetParent) {   // the home screen is hidden: nothing to draw, and no dance in the background
      stopEmote();
      return;
    }
    if (emote && (emote.t += dt) >= emote.duration) stopEmote();
    if (emote) animateRig(rig, { emote, t: 0, pitch: 0 }, dt);
    rig.root.rotation.y = yaw;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return show;
}
