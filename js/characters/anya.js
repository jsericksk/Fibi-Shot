import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = {
  skin: 0xffe3d2,
  hair: 0xf2a0b8,
  hairDark: 0xe88aa6,
  white: 0xfbfbff,
  red: 0xc8323a,
  shoe: 0x2a2420,
};

// Dress and trim colors of each look
const LOOKS = {
  default: { dress: 0x2e2622, gold: 0xe0b040 },
  brasil: { dress: 0xffdc2e, gold: 0x009c3b },
  navy: { dress: 0x26325e, gold: 0xc9d2e0 },
  wine: { dress: 0x6e1f33, gold: 0xe8c9a0 },
};

// Little girl from Spy x Family: short pink hair with an ahoge and two black horn hairpieces, green eyes,
// a black dress with a gold hem, a red ribbon, white knee socks.
// Skins: { look: 'navy' | 'wine' | 'brasil' } recolors the dress
export function buildAnya({ look = 'default' } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // White knee socks and black shoes
  for (const leg of legs) {
    add(leg, cyl, M(C.skin), [0, -0.1, 0], [0.085, 0.14, 0.085]);
    add(leg, cyl, M(C.white), [0, -0.29, 0], [0.095, 0.22, 0.095]);
    add(leg, sphere, M(C.shoe), [0, -0.44, 0.06], [0.12, 0.07, 0.17]);
  }

  // Black dress that flares into a gold-trimmed skirt, white collar and red ribbon
  add(body, new THREE.CylinderGeometry(0.27, 0.34, 0.5, 32), M(L.dress), [0, 0.78, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.5, 0.26, 32), M(L.dress), [0, 0.5, 0]);
  add(body, new THREE.CylinderGeometry(0.5, 0.505, 0.06, 32), M(L.gold), [0, 0.35, 0]);
  add(body, new THREE.TorusGeometry(0.22, 0.05, 10, 32), M(C.white), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, box, M(C.red), [0, 0.97, 0.27], [0.14, 0.08, 0.05]);
  add(body, new THREE.ConeGeometry(0.06, 0.18, 4), M(C.red), [0, 0.86, 0.29], [1, 1, 0.3], [Math.PI, 0, 0]);

  // Long black sleeves with a gold cuff
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.14, 0.42, 20), M(L.dress), [0, -0.21, 0]);
    add(arm, cyl, M(L.gold), [0, -0.44, 0], [0.145, 0.04, 0.145]);
    add(arm, sphere, M(C.skin), [0, -0.56, 0], [0.095, 0.095, 0.095]);
  }

  // Round face with big green eyes and a happy open mouth
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x2f8f4e, inner: 0x7fdc8c, mouth: 'open', brow: C.hairDark, blush: 0.8 });

  // Hair: a bob that covers the head and hangs to the chin, with a thick fringe
  add(head, sphere, M(C.hair), [0, 0.1, -0.1], [0.7, 0.64, 0.66]);
  add(head, new THREE.CylinderGeometry(0.5, 0.56, 0.4, 32), M(C.hair), [0, -0.2, -0.2]);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.18, Math.cos(a) * 0.53], [0.11, 0.2, 0.08], [0, a, 0]);
  }
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.hair), [s * 0.58, -0.2, 0.05], [0.12, 0.3, 0.2]);   // side locks
    // Black round horn hairpiece with a gold ornament at its base
    add(head, new THREE.ConeGeometry(0.2, 0.55, 24), M(L.dress), [s * 0.55, 0.5, -0.02], [1, 1, 1], [0, 0, s * -0.7]);
    add(head, sphere, M(L.gold), [s * 0.46, 0.4, 0.02], [0.07, 0.07, 0.07]);
  }
  add(head, new THREE.ConeGeometry(0.04, 0.28, 8), M(C.hair), [0.02, 0.84, 0.0], [1, 1, 1], [0, 0, -0.25]);   // ahoge

  return rig;
}
