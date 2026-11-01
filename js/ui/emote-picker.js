import * as THREE from 'three';
import { animateRig, setIdlePose } from '../characters/rig.js';
import { buildStageScene } from './home-stage.js';
import { EMOTES, EMOTE, HOME_STAGE } from '../config.js';
import { isTouch } from '../utils.js';
import { t } from '../i18n.js';

const [WIDTH, HEIGHT] = EMOTE.previewSize;
const $ = id => document.getElementById(id);

// Grid opened with H: every emote of the character dances (without sound) next to its number. A number key or a tap picks it.
function createEmotePicker() {
  const box = $('emote-picker'), grid = $('emote-grid');
  // One renderer and one character draw every preview in turn: a WebGL context per cell would be too many
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  const { scene, camera } = buildStageScene(WIDTH / HEIGHT);

  const rigs = {};   // built once per look
  let rig = null, list = [], cells = [], onPick = null, raf = 0, startTime = 0;

  // Where the camera must stand to keep the character, hat and all, in the middle of the cell
  function frameOf(r) {
    r.root.updateMatrixWorld(true);
    const box = new THREE.Box3(), part = new THREE.Box3();
    r.root.traverseVisible(o => {
      if (!o.isMesh || o.material.visible === false) return;   // the hitboxes are invisible
      o.geometry.boundingBox ?? o.geometry.computeBoundingBox();
      box.union(part.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
    });
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const viewHeight = size.y * EMOTE.previewPadding;   // the hat brim may be wider than the body, but the cell is wide enough for it
    return { y: center.y, z: viewHeight / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) };
  }

  function buildRig(def) {
    const r = def.build();
    r.gunMount.visible = false;
    r.root.rotation.y = HOME_STAGE.startYaw;
    setIdlePose(r);
    scene.add(r.root);
    r.frame = frameOf(r);
    return r;
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    const seconds = (now - startTime) / 1000;
    list.forEach((emote, i) => {
      animateRig(rig, { emote: { ...emote, t: seconds % emote.duration }, t: 0, pitch: 0 }, 0);
      renderer.render(scene, camera);
      const g = cells[i].getContext('2d');
      g.clearRect(0, 0, WIDTH, HEIGHT);
      g.drawImage(renderer.domElement, 0, 0);
    });
  }

  function open(def, pick) {
    if (rig) rig.root.visible = false;
    rig = rigs[def.key] ??= buildRig(def);
    rig.root.visible = true;
    camera.position.set(0, rig.frame.y, rig.frame.z);
    camera.lookAt(0, rig.frame.y, 0);
    list = EMOTES[def.id] ?? EMOTES.default;
    onPick = pick;
    grid.innerHTML = list.map((_, i) => `<button class="emote-cell"><canvas width="${WIDTH}" height="${HEIGHT}"></canvas><b>${i + 1}</b></button>`).join('');
    cells = [...grid.querySelectorAll('canvas')];
    $('emote-hint').textContent = t(isTouch ? 'emote.hintTouch' : 'emote.hint', { n: list.length });
    box.classList.remove('hidden');
    startTime = performance.now();
    raf = requestAnimationFrame(draw);
  }

  function close() {
    cancelAnimationFrame(raf);
    box.classList.add('hidden');
  }

  // pointerdown instead of click: with another finger on the stick, browsers skip the click
  grid.onpointerdown = e => {
    const cell = e.target.closest('.emote-cell');
    if (!cell) return;
    e.preventDefault();
    picker.pick([...grid.children].indexOf(cell));
  };

  const picker = {
    get isOpen() { return !box.classList.contains('hidden'); },
    toggle(def, pick) { if (picker.isOpen) close(); else open(def, pick); },
    close,
    // Starts the emote with this number (counting from 0) and closes the grid; a number with no emote does nothing
    pick(index) {
      if (!list[index]) return;
      close();
      onPick(index);
    },
  };
  return picker;
}

export const emotePicker = createEmotePicker();
