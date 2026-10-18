import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = {
  skin: 0xfff0e4,
  hair: 0x39c5bb,
  hairDark: 0x25a39a,
  black: 0x2a2c33,
  magenta: 0xc2185b,
};

// Outfit colors of each look: top, and the trim and tie
const LOOKS = {
  default: { white: 0xf7fbfb, teal: 0x2bb5a8, skirt: 0x2a2c33 },
  sakura: { white: 0xfff4f8, teal: 0xf06fa0, skirt: 0x2a2c33 },
  brasil: { white: 0xffdc2e, teal: 0x009c3b, skirt: 0x002776 },
  night: { white: 0x4a4f6a, teal: 0x9a6bff, skirt: 0x2a2c33 },
};

// Virtual singer Hatsune Miku: long turquoise twin tails, blue eyes, headphones with a mic, a white top with a teal tie,
// black detached sleeves, a black skirt and thigh-high boots.
// Skins: { look: 'sakura' | 'night' | 'brasil' } recolors the outfit
export function buildMiku({ look = 'default' } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Black thigh-high boots with teal trim
  for (const leg of legs) {
    add(leg, cyl, M(C.skin), [0, -0.08, 0], [0.085, 0.1, 0.085]);
    add(leg, cyl, M(C.black), [0, -0.27, 0], [0.1, 0.24, 0.1]);
    add(leg, new THREE.TorusGeometry(0.1, 0.018, 8, 20), M(L.teal), [0, -0.14, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    add(leg, sphere, M(C.black), [0, -0.44, 0.06], [0.12, 0.07, 0.17]);
  }

  // White sleeveless top, teal tie, black skirt with a teal hem
  add(body, new THREE.CylinderGeometry(0.28, 0.34, 0.5, 32), M(L.white), [0, 0.78, 0]);
  add(body, new THREE.TorusGeometry(0.2, 0.04, 10, 32), M(L.teal), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, box, M(L.teal), [0, 0.92, 0.3], [0.07, 0.08, 0.04]);
  add(body, new THREE.ConeGeometry(0.07, 0.3, 4), M(L.teal), [0, 0.74, 0.31], [1, 1, 0.3], [Math.PI, 0, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.48, 0.28, 32), M(L.skirt), [0, 0.46, 0]);
  add(body, new THREE.CylinderGeometry(0.48, 0.49, 0.04, 32), M(L.teal), [0, 0.33, 0]);

  // Black detached sleeves with teal trim, bare hands
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.14, 0.42, 20), M(C.black), [0, -0.21, 0]);
    add(arm, cyl, M(L.teal), [0, -0.12, 0], [0.125, 0.025, 0.125]);
    add(arm, cyl, M(L.teal), [0, -0.43, 0], [0.145, 0.03, 0.145]);
    add(arm, sphere, M(C.skin), [0, -0.55, 0], [0.095, 0.095, 0.095]);
  }

  // Face with big blue eyes and a small smile
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x2a8fd0, inner: 0x7fe0f0, mouth: 'smile', brow: C.hairDark, blush: 0.5 });

  // Hair: fringe, back hair and two very long twin tails
  add(head, sphere, M(C.hair), [0, 0.1, -0.1], [0.7, 0.64, 0.66]);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.17, Math.cos(a) * 0.53], [0.1, 0.22, 0.08], [0, a, 0]);
  }
  for (const s of [-1, 1]) {
    add(head, new THREE.CapsuleGeometry(0.12, 1.1, 8, 16), M(C.hair), [s * 0.75, -0.7, -0.1], [1, 1, 1], [0, 0, s * -0.05]);
    add(head, new THREE.ConeGeometry(0.12, 0.3, 12), M(C.hair), [s * 0.77, -1.5, -0.1], [1, 1, 1], [Math.PI, 0, 0]);
    add(head, sphere, M(C.black), [s * 0.66, 0.05, -0.05], [0.1, 0.1, 0.1]);   // hair tie
    // Headphone: ear cup with a magenta square and a band over the hair
    add(head, box, M(C.black), [s * 0.64, 0.2, 0], [0.1, 0.3, 0.26]);
    add(head, box, M(C.magenta), [s * 0.71, 0.2, 0], [0.04, 0.2, 0.18]);
  }
  add(head, new THREE.TorusGeometry(0.64, 0.025, 8, 32, Math.PI), M(C.black), [0, 0.2, 0], [1, 1, 1], [0, 0, 0]);
  add(head, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M(C.black), [0.5, -0.17, 0.3], [1, 1, 1], [1.2, 0, 0.9]);   // mic boom
  add(head, sphere, M(C.black), [0.42, -0.28, 0.5], [0.04, 0.04, 0.04]);

  return rig;
}
