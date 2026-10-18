import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';
import { addFibiHat } from './fibi.js';

const C = {
  skin: 0xfbd9b4,
  hair: 0x55b84a,
  hairDark: 0x3c923a,
  white: 0xffffff,
  mouth: 0xe5654a,
};

// Outfit colors: the raglan sleeves, collar and shoes, and the shorts. The fibi look uses Fibi's blue and black
const LOOKS = {
  default: { tee: 0xffffff, salmon: 0xe58a86, shorts: 0xd4a22e, shortsDark: 0xb98a22 },
  fibi: { tee: 0xffffff, salmon: 0x2f9be0, shorts: 0x25222e, shortsDark: 0x15121a },
  brasil: { tee: 0xffdc2e, salmon: 0x009c3b, shorts: 0x002776, shortsDark: 0x001a52 },
};

// Fringe lock: a flat, softly pointed cone
const LOCK = new THREE.ConeGeometry(0.11, 0.3, 16);

// A fan of three spiky hair tufts, pointing along +Y of the group
function tuft(parent, pos, rot) {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.set(...rot);
  parent.add(g);
  add(g, sphere, M(C.hair), [0, 0, 0], [0.16, 0.12, 0.16]);
  for (const a of [-0.5, 0, 0.5]) {
    add(g, new THREE.ConeGeometry(0.1, 0.4 - Math.abs(a) * 0.2, 4), M(C.hair), [Math.sin(a) * 0.14, 0.17 * Math.cos(a), 0], [1, 1, 0.8], [0, 0, -a]);
  }
}

// Skins: { fibiHat: true } adds Fibi's hat, { look: 'fibi' } wears Fibi's colors, { look: 'brasil' } the Brazil jersey colors.
// Cheerful girl with green hair in four spiky tufts, a white tee with salmon sleeves, mustard shorts and salmon shoes
export function buildYotsuba({ look = 'default', fibiHat = false } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Thin bare legs under rolled-up shorts, salmon shoes with white toe caps
  for (const leg of legs) {
    add(leg, cyl, M(L.shorts), [0, -0.085, 0], [0.16, 0.17, 0.16]);
    add(leg, cyl, M(L.shortsDark), [0, -0.19, 0], [0.17, 0.04, 0.17]);   // rolled cuff
    add(leg, cyl, M(C.skin), [0, -0.3, 0], [0.08, 0.18, 0.08]);
    add(leg, sphere, M(L.salmon), [0, -0.44, 0.05], [0.12, 0.08, 0.17]);
    add(leg, sphere, M(C.white), [0, -0.455, 0.14], [0.115, 0.06, 0.1]);
  }

  // White tee, salmon collar, mustard shorts at the waist
  add(body, new THREE.CylinderGeometry(0.28, 0.34, 0.5, 32), M(L.tee), [0, 0.78, 0]);
  add(body, new THREE.TorusGeometry(0.2, 0.04, 10, 32), M(L.salmon), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.35, 0.17, 32), M(L.shorts), [0, 0.5, 0]);
  add(body, box, M(L.shortsDark), [0, 0.52, 0.345], [0.015, 0.14, 0.02]);   // fly seam

  // Salmon raglan sleeves, bare forearms and little fists
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.13, 0.3, 20), M(L.salmon), [0, -0.15, 0]);
    add(arm, cyl, M(C.skin), [0, -0.39, 0], [0.075, 0.13, 0.075]);
    add(arm, sphere, M(C.skin), [0, -0.55, 0], [0.11, 0.11, 0.11]);
  }

  // Round face with big green eyes and a wide open mouth
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x1f7a3d, inner: 0x57c46d, mouth: 'none', brow: C.hair, lidSY: 0.02, blush: 0.5 });
  add(head, sphere, M(C.mouth), [0, -0.25, 0.51], [0.14, 0.11, 0.04]);
  add(head, sphere, M(0xff9a85), [0, -0.285, 0.535], [0.08, 0.05, 0.02]);   // tongue

  // Hair: one tall rounded shape shifted back, so the face pokes out of it and the hairline forms by itself (no seams)
  add(head, sphere, M(C.hair), [0, 0.2, -0.12], [0.7, 0.62, 0.66]);
  // Fringe: the hairline itself is zigzag, locks flush with the forehead and starting inside the hair
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.27;
    const lock = new THREE.Group();
    lock.position.set(Math.sin(a) * 0.55, 0.22, Math.cos(a) * 0.52 + 0.02);
    lock.rotation.y = a;
    head.add(lock);
    add(lock, LOCK, M(C.hair), [0, 0, 0], [1, 1 - Math.abs(i) * 0.08, 0.35], [Math.PI - 0.38, 0, 0]);   // follows the forehead curve, tip down
  }
  for (const s of [-1, 1]) {
    if (!fibiHat) tuft(head, [s * 0.52, 0.55, -0.02], [0, 0, s * -1.15]);   // the upper tufts would stick out through the hat
    tuft(head, [s * 0.58, -0.14, -0.05], [0, 0, s * -2.3]);
  }
  if (fibiHat) addFibiHat(rig, { y: 0.42, crown: 1.4, back: 0.12 });

  return rig;
}
