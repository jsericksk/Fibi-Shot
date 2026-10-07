import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = {
  skin: 0xffe3d2,
  hair: 0x8a5a4a,           // chestnut brown
  hairDark: 0x6b4034,
  streak: 0xe9cfc4,         // light strand in the bangs
  earInner: 0xe8a0a0,
  white: 0xfbfbff,
  hat: 0x8f92d8,            // periwinkle beret
  hatLight: 0xf1f3ff,
  navy: 0x2b2d5e,
  tie: 0x6c6fc0,
  wine: 0x8a2a3a,           // corset, ribbons and tail ribbon
  belt: 0x6b4630,
  gold: 0xe0b040,
  boot: 0x4a3434,
  sock: 0xc9b6e4,
};

// Horse girl in a sailor-style outfit: chestnut wavy hair, periwinkle beret, amber eyes and a tail
export function buildMambo() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Lavender socks and brown boots
  for (const leg of legs) {
    add(leg, cyl, M(C.sock), [0, -0.15, 0], [0.095, 0.1, 0.095]);
    add(leg, cyl, M(C.boot), [0, -0.32, 0], [0.115, 0.14, 0.115]);
    add(leg, sphere, M(C.boot), [0, -0.44, 0.07], [0.13, 0.08, 0.2]);
    add(leg, new THREE.TorusGeometry(0.11, 0.018, 8, 20), M(C.wine), [0, -0.2, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  }

  // White blouse, wine corset, navy skirt with lace hem and a belt
  add(body, new THREE.CylinderGeometry(0.27, 0.34, 0.4, 32), M(C.white), [0, 0.86, 0]);
  add(body, new THREE.CylinderGeometry(0.34, 0.37, 0.18, 32), M(C.wine), [0, 0.64, 0]);
  add(body, new THREE.CylinderGeometry(0.37, 0.52, 0.3, 32), M(C.navy), [0, 0.46, 0]);
  add(body, new THREE.TorusGeometry(0.52, 0.025, 8, 32), M(C.white), [0, 0.32, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, new THREE.TorusGeometry(0.37, 0.03, 8, 32), M(C.belt), [0, 0.58, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, box, M(C.gold), [0.1, 0.58, 0.36], [0.07, 0.07, 0.03]);
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(C.white), [0, 1.04, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, box, M(C.tie), [0, 1.0, 0.28], [0.16, 0.09, 0.06]);
  add(body, new THREE.ConeGeometry(0.06, 0.2, 4), M(C.tie), [0, 0.88, 0.3], [1, 1, 0.3], [Math.PI, 0, 0]);

  // Tail with a wine ribbon
  add(body, new THREE.CapsuleGeometry(0.07, 0.4, 8, 12), M(C.hair), [0, 0.38, -0.45], [1, 1, 1], [-0.35, 0, 0]);
  add(body, sphere, M(C.wine), [0, 0.56, -0.4], [0.09, 0.07, 0.06]);

  // White puffy sleeves and bare hands
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.11, 0.15, 0.3, 20), M(C.white), [0, -0.15, 0]);
    add(arm, cyl, M(C.skin), [0, -0.38, 0], [0.075, 0.18, 0.075]);
    add(arm, sphere, M(C.skin), [0, -0.56, 0], [0.095, 0.095, 0.095]);
  }

  // Head and face
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0xb8721f, inner: 0xf0b54a, brow: C.hairDark, mouth: 'open', blush: 0.9 });

  // Hair: top cap, bangs with a light strand, long wavy back hair and side locks
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.15), M(C.hair), [0, 0.02, 0], [0.655, 0.6, 0.62]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    add(head, sphere, M(i === -2 ? C.streak : C.hair), [Math.sin(a) * 0.6, 0.2, Math.cos(a) * 0.54], [0.1, 0.16, 0.07], [0, a, 0]);
  }
  add(head, sphere, M(C.hair), [0, -0.05, -0.18], [0.64, 0.6, 0.58]);
  add(head, sphere, M(C.hair), [0, -0.34, -0.2], [0.52, 0.2, 0.5]);
  add(head, sphere, M(C.hair), [0, 0.28, -0.1], [0.52, 0.48, 0.52]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.hair), [s * 0.5, 0.12, 0.08], [0.17, 0.34, 0.34]);   // temples, so the sides are not bald
    add(head, new THREE.CapsuleGeometry(0.15, 0.5, 8, 16), M(C.hair), [s * 0.58, -0.2, 0.1], [1, 1, 1], [0, 0, s * -0.08]);
    add(head, sphere, M(C.hair), [s * 0.54, -0.6, 0.1], [0.14, 0.12, 0.12]);   // wavy curl at the tips
  }

  // Horse ears with pink insides
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.4, 0.66, -0.06);
    ear.rotation.z = s * -0.3;
    head.add(ear);
    add(ear, new THREE.ConeGeometry(0.17, 0.55, 4), M(C.hair), [0, 0.26, 0], [1, 1, 0.5]);
    add(ear, new THREE.ConeGeometry(0.1, 0.38, 4), M(C.earInner), [0, 0.22, 0.04], [1, 1, 0.4]);
  }

  // Beret with a white band, a visor and a little pin
  const hat = new THREE.Group();
  hat.position.set(0.03, 0.4, 0.02);
  hat.rotation.set(-0.1, 0, 0.14);
  hat.scale.setScalar(1.05);
  head.add(hat);
  add(hat, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(C.hat), [0, 0.02, 0], [0.66, 0.5, 0.66]);
  add(hat, cyl, M(C.hatLight), [0, 0.02, 0], [0.655, 0.07, 0.655]);
  add(hat, box, M(C.hatLight), [0, 0.0, 0.62], [0.5, 0.04, 0.22], [0.2, 0, 0]);
  add(hat, box, M(C.hatLight), [0.05, 0.32, 0.3], [0.3, 0.02, 0.22], [-0.9, 0, 0.1]);   // shiny panel
  add(hat, sphere, M(C.hatLight), [0, 0.5, 0], [0.05, 0.05, 0.05]);
  add(hat, sphere, M(0x4aa0ff), [-0.58, 0.14, 0.12], [0.07, 0.07, 0.07]);
  add(hat, sphere, M(0xd63a4a), [-0.62, 0.06, 0.08], [0.05, 0.05, 0.05]);

  // Two red hairclips
  for (const y of [0.3, 0.2]) add(head, box, M(0xe04050), [0.48, y, 0.4], [0.17, 0.035, 0.03], [0, 0.9, 0.5]);

  // Long wine ribbon hanging by the left side of the face
  add(head, box, M(C.wine), [-0.6, -0.4, 0.2], [0.07, 0.55, 0.02], [0, 0.3, 0.12]);

  return rig;
}
