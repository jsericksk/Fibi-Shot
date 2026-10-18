import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';
import { addHairMass } from './fibi.js';

const C = {
  skin: 0xffe3d2,
  hair: 0xf08cb6,
  hairDark: 0xd9709e,
  sock: 0x3a2f2c,
  shoe: 0x5a3a2c,
  cyan: 0x39b8e0,
  yellow: 0xf2c53d,
};

// Outfit colors of each look: jacket, its light trim and the skirt
const LOOKS = {
  default: { jacket: 0xf4a6bd, jacketLight: 0xfbd0dc, skirt: 0x4a4a54 },
  black: { jacket: 0x2a2a30, jacketLight: 0x55555f, skirt: 0x1c1c22 },
  brasil: { jacket: 0xffdc2e, jacketLight: 0x009c3b, skirt: 0x002776 },
  sky: { jacket: 0x7fb4e8, jacketLight: 0xcfe3f8, skirt: 0x4a4a54 },
};

// Shy guitarist from Bocchi the Rock!: very long pink hair with an ahoge and two cube hairpins (cyan and yellow),
// blue eyes, a pink track jacket and a pleated gray skirt.
// Skins: { look: 'black' | 'sky' | 'brasil' } recolors the outfit
export function buildBocchi({ look = 'default' } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Bare thighs, dark socks and brown shoes
  for (const leg of legs) {
    add(leg, cyl, M(C.skin), [0, -0.1, 0], [0.085, 0.14, 0.085]);
    add(leg, cyl, M(C.sock), [0, -0.3, 0], [0.095, 0.2, 0.095]);
    add(leg, sphere, M(C.shoe), [0, -0.44, 0.06], [0.12, 0.07, 0.17]);
  }

  // Pink jacket with a lighter zipper and collar, pleated skirt
  add(body, new THREE.CylinderGeometry(0.28, 0.34, 0.5, 32), M(L.jacket), [0, 0.78, 0]);
  add(body, box, M(L.jacketLight), [0, 0.78, 0.335], [0.03, 0.46, 0.02]);
  add(body, new THREE.TorusGeometry(0.2, 0.05, 10, 32), M(L.jacketLight), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.46, 0.28, 24), M(L.skirt), [0, 0.46, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.35, 0.05, 32), M(L.jacketLight), [0, 0.62, 0]);   // jacket hem

  // Pink sleeves with a lighter cuff
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.14, 0.42, 20), M(L.jacket), [0, -0.21, 0]);
    add(arm, cyl, M(L.jacketLight), [0, -0.43, 0], [0.12, 0.04, 0.12]);
    add(arm, sphere, M(C.skin), [0, -0.55, 0], [0.095, 0.095, 0.095]);
  }

  // Face with big blue eyes and a flat, nervous mouth
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x2a78c8, inner: 0x7fd0f0, mouth: 'flat', brow: C.hairDark, blush: 0.5 });

  // Hair: shaggy fringe over the eyes and Fibi's smooth back hair and long side locks
  addHairMass(head, C.hair);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.17, Math.cos(a) * 0.53], [0.1, 0.22, 0.08], [0, a, 0]);
  }
  for (const s of [-1, 1]) add(head, new THREE.CapsuleGeometry(0.1, 0.7, 8, 16), M(C.hair), [s * 0.6, -0.55, 0.03]);
  add(head, new THREE.ConeGeometry(0.04, 0.28, 8), M(C.hair), [-0.5, 0.5, 0.2], [1, 1, 1], [0, 0, 0.9]);   // ahoge

  // Cube hairpins on her left side
  add(head, box, M(C.cyan), [0.5, 0.35, 0.3], [0.13, 0.13, 0.13], [0.3, 0.5, 0.2]);
  add(head, box, M(C.yellow), [0.52, 0.2, 0.3], [0.13, 0.13, 0.13], [0.2, 0.5, -0.1]);

  return rig;
}
