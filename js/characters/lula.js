import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xf0c4a8, gray: 0xe4e4ea, suit: 0x1f3a6e, pants: 0x1b2d57, shirt: 0xf6f8ff, tie: 0x3b5fa8, dot: 0xc0392b, straw: 0xe9d3a0, band: 0x1c1a22, shoe: 0x18161c };

// Grandpa in a navy suit and patterned tie, with a gray beard and a straw hat
export function buildLula() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Suit trousers and black shoes
  for (const leg of legs) {
    add(leg, cyl, M(C.pants), [0, -0.23, 0], [0.1, 0.38, 0.1]);   // reaches down to the shoe
    add(leg, sphere, M(C.shoe), [0, -0.44, 0.07], [0.13, 0.08, 0.2]);
  }

  // Jacket, white collar, tie with dots and a small lapel pin
  add(body, new THREE.CylinderGeometry(0.27, 0.4, 0.5, 32), M(C.suit), [0, 0.78, 0]);
  add(body, new THREE.ConeGeometry(0.12, 0.46, 4), M(C.shirt), [0, 0.8, 0.3], [1, 1, 0.25], [Math.PI, 0, 0]);
  add(body, new THREE.ConeGeometry(0.075, 0.44, 4), M(C.tie), [0, 0.78, 0.325], [1, 1, 0.25], [Math.PI, 0, 0]);
  add(body, box, M(C.tie), [0, 1.0, 0.3], [0.11, 0.08, 0.06]);
  for (const y of [0.9, 0.8, 0.7]) add(body, sphere, M(C.dot), [0, y, 0.345], [0.02, 0.02, 0.01]);
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(C.shirt), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(body, sphere, M(0xf2c14e, { metalness: 0.6, roughness: 0.35 }), [0.18, 0.88, 0.32], [0.022, 0.022, 0.015]);

  // Suit sleeves, white cuffs and hands
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.15, 0.5, 20), M(C.suit), [0, -0.25, 0]);
    add(arm, cyl, M(C.shirt), [0, -0.5, 0], [0.105, 0.03, 0.105]);
    add(arm, sphere, M(C.skin), [0, -0.58, 0], [0.1, 0.1, 0.1]);
  }

  // Head with small, squinting eyes
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x5a3a2a, inner: 0x8a6a50, lidY: 0.1, lidSY: 0.06, brow: 0xd8d8de, mouth: 'none', blush: 0.25 });
  for (const s of [-1, 1]) add(head, sphere, M(C.skin), [s * 0.6, -0.03, 0], [0.07, 0.12, 0.08]);   // ears

  // Gray hair at the sides and back, under the hat
  // Kept below the brim so no hair pokes through the crown
  add(head, sphere, M(C.gray), [0, -0.08, -0.1], [0.62, 0.42, 0.58]);
  for (const s of [-1, 1]) add(head, sphere, M(C.gray), [s * 0.5, 0.02, 0.08], [0.17, 0.3, 0.34]);

  // Full gray beard: a shell around the jaw, then cheeks, chin, mustache and a smile with teeth
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 2, Math.PI - 2), M(C.gray), [0, 0, 0], [0.645, 0.585, 0.605]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.gray), [s * 0.38, -0.2, 0.3], [0.17, 0.2, 0.2]);
    add(head, sphere, M(C.gray), [s * 0.2, -0.33, 0.45], [0.2, 0.14, 0.15]);
    add(head, sphere, M(C.gray), [s * 0.08, -0.17, 0.55], [0.12, 0.04, 0.04], [0, 0, s * 0.3]);
  }
  add(head, sphere, M(C.gray), [0, -0.4, 0.4], [0.3, 0.2, 0.2]);
  add(head, sphere, M(0x8a2f45), [0, -0.25, 0.55], [0.1, 0.04, 0.02]);
  add(head, sphere, M(0xffffff), [0, -0.235, 0.565], [0.085, 0.022, 0.015]);

  // Straw hat with black band
  const hat = new THREE.Group();
  hat.position.set(0, 0.36, -0.02);
  hat.rotation.x = -0.12;
  hat.scale.setScalar(1.05);
  head.add(hat);
  rig.hat = hat;   // pops off when he dies
  add(hat, cyl, M(C.straw), [0, 0, 0], [1.1, 0.04, 1.1]);
  add(hat, new THREE.CylinderGeometry(0.5, 0.58, 0.42, 32), M(C.straw), [0, 0.2, 0]);
  add(hat, new THREE.SphereGeometry(1, 32, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(C.straw), [0, 0.41, 0], [0.5, 0.08, 0.5]);
  add(hat, cyl, M(C.band), [0, 0.07, 0], [0.575, 0.07, 0.575]);

  return rig;
}
