import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xffe3d2, hair: 0x2a2630, suit: 0x2b2a33, belly: 0xfafaff, beak: 0xf2b72c, feet: 0xf0a030, metal: 0xaab0c0 };

// Girl in a penguin hoodie with a chain collar
export function buildGuga() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Short dark legs and orange webbed feet
  for (const leg of legs) {
    add(leg, cyl, M(C.suit), [0, -0.23, 0], [0.1, 0.38, 0.1]);   // reaches down to the foot
    add(leg, sphere, M(C.feet), [0, -0.44, 0.1], [0.15, 0.05, 0.22]);
  }

  // Round penguin body with white belly and tail
  add(body, sphere, M(C.suit), [0, 0.78, 0], [0.42, 0.5, 0.4]);
  add(body, sphere, M(C.belly), [0, 0.76, 0.2], [0.3, 0.4, 0.24]);
  add(body, new THREE.ConeGeometry(0.15, 0.35, 8), M(C.suit), [0, 0.5, -0.4], [1, 1, 1], [-2.1, 0, 0]);

  // Collar with chain ring
  add(body, new THREE.TorusGeometry(0.28, 0.055, 12, 32), M(0x4a4a55), [0, 1.05, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, new THREE.TorusGeometry(0.07, 0.02, 8, 16), M(C.metal, { metalness: 0.7 }), [0, 0.98, 0.3], [0.8, 1.4, 1], [0, 0.1, 0.3]);

  // Flipper-like sleeves
  for (const arm of arms) {
    add(arm, new THREE.CapsuleGeometry(0.11, 0.42, 8, 16), M(C.suit), [0, -0.27, 0]);
    add(arm, sphere, M(C.skin), [0, -0.62, 0], [0.09, 0.09, 0.09]);
  }

  // Head and face
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x587a9e, inner: 0xa9c6de, brow: 0x1c1a22, mouth: 'open' });

  // Short black bob with blunt bangs
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.2), M(C.hair), [0, 0.02, 0], [0.655, 0.6, 0.62]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.2, Math.cos(a) * 0.54], [0.1, 0.17, 0.07], [0, a, 0]);
  }
  add(head, sphere, M(C.hair), [0, -0.05, -0.15], [0.66, 0.6, 0.62]);
  for (const s of [-1, 1]) add(head, sphere, M(C.hair), [s * 0.56, -0.2, 0.05], [0.12, 0.3, 0.26]);

  // Penguin hood: covers the top/back of the head, beak and eyes on top
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.9), M(C.suit), [0, 0.06, -0.12], [0.72, 0.66, 0.68]);
  add(head, sphere, M(C.beak), [0, 0.62, 0.28], [0.2, 0.05, 0.14], [0.35, 0, 0]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(0xffffff), [s * 0.27, 0.5, 0.36], [0.1, 0.12, 0.03], [0.6, s * 0.4, 0]);
    add(head, sphere, M(0x111111), [s * 0.27, 0.5, 0.39], [0.04, 0.05, 0.02], [0.6, s * 0.4, 0]);
  }
  // Metal hairpin
  add(head, box, M(C.metal, { metalness: 0.7 }), [0.5, 0.2, 0.4], [0.16, 0.03, 0.03], [0, 0.8, 0.6]);

  // Fluffy white cuffs and little toes
  for (const arm of arms) add(arm, sphere, M(C.belly), [0, -0.5, 0], [0.13, 0.07, 0.13]);
  for (const leg of legs) for (const dx of [-0.06, 0, 0.06]) add(leg, sphere, M(C.feet), [dx, -0.44, 0.22], [0.035, 0.035, 0.045]);
  // Small pink bow on the chain collar
  for (const s of [-1, 1]) add(body, new THREE.ConeGeometry(0.06, 0.13, 4), M(0xff8fb0), [s * 0.07, 1.0, 0.3], [1, 1, 0.4], [0, 0, s * -Math.PI / 2]);
  add(body, sphere, M(0xff6f9a), [0, 1.0, 0.31], [0.035, 0.035, 0.03]);

  return rig;
}
