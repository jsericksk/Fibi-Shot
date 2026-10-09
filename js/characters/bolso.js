import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xf0c9ae, hair: 0x4b4a50, suit: 0x161c33, lapel: 0x1f2848, pants: 0x131830, shirt: 0xdbe6f5, tie: 0x1c1c22, stripe: 0xe8e2d0, shoe: 0x18161c };

// Man in a dark navy suit with a striped tie and swept-aside gray hair, no hat
export function buildBolso() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Suit trousers and black shoes
  for (const leg of legs) {
    add(leg, cyl, M(C.pants), [0, -0.23, 0], [0.1, 0.38, 0.1]);   // reaches down to the shoe
    add(leg, sphere, M(C.shoe), [0, -0.44, 0.07], [0.13, 0.08, 0.2]);
  }

  // Jacket with lapels and buttons, light blue shirt, dark tie with diagonal stripes
  add(body, new THREE.CylinderGeometry(0.27, 0.4, 0.5, 32), M(C.suit), [0, 0.78, 0]);
  add(body, new THREE.ConeGeometry(0.12, 0.46, 4), M(C.shirt), [0, 0.8, 0.3], [1, 1, 0.25], [Math.PI, 0, 0]);
  for (const s of [-1, 1]) add(body, box, M(C.lapel), [s * 0.12, 0.84, 0.31], [0.05, 0.3, 0.03], [0, 0, s * -0.25]);
  add(body, new THREE.ConeGeometry(0.075, 0.44, 4), M(C.tie), [0, 0.78, 0.325], [1, 1, 0.25], [Math.PI, 0, 0]);
  add(body, box, M(C.tie), [0, 1.0, 0.3], [0.11, 0.08, 0.06]);
  [[0.92, 0.1], [0.84, 0.085], [0.76, 0.06]].forEach(([y, w]) => add(body, box, M(C.stripe), [0, y, 0.347], [w, 0.016, 0.01], [0, 0, 0.6]));
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(C.shirt), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const y of [0.66, 0.57]) add(body, sphere, M(C.lapel), [0.02, y, y > 0.6 ? 0.34 : 0.37], [0.025, 0.025, 0.015]);

  // Suit sleeves, light blue cuffs and hands
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.15, 0.5, 20), M(C.suit), [0, -0.25, 0]);
    add(arm, cyl, M(C.shirt), [0, -0.5, 0], [0.105, 0.03, 0.105]);
    add(arm, sphere, M(C.skin), [0, -0.58, 0], [0.1, 0.1, 0.1]);
    // Finger gun on the right hand, seen just while he dances: long index finger forward, thumb up, curled fingers
    if (arm.userData.side > 0) continue;
    const gun = new THREE.Group();
    add(gun, new THREE.CapsuleGeometry(0.032, 0.17, 6, 12), M(C.skin), [0, -0.75, 0.02]);
    add(gun, new THREE.CapsuleGeometry(0.03, 0.07, 6, 12), M(C.skin), [0, -0.6, 0.12], [1, 1, 1], [Math.PI / 2 - 0.2, 0, 0]);
    for (const x of [-0.05, 0, 0.05]) add(gun, sphere, M(C.skin), [x, -0.65, -0.05], [0.04, 0.045, 0.04]);
    arm.add(gun);
    (rig.emoteOnly ??= []).push(gun);
  }

  // Head with blue eyes, serious brows and a small smirk
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x4a78b8, inner: 0x8fb8e8, lidY: 0.14, lidSY: 0.045, brow: 0x3a3a40, mouth: 'flat', blush: 0 });
  for (const s of [-1, 1]) add(head, sphere, M(C.skin), [s * 0.6, -0.03, 0], [0.07, 0.12, 0.08]);   // ears

  // Short gray hair, combed to one side with a fringe over the forehead
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.2), M(C.hair), [0, 0.02, 0], [0.665, 0.61, 0.63]);
  add(head, sphere, M(C.hair), [0, 0.05, -0.15], [0.65, 0.58, 0.6]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.27, Math.cos(a) * 0.54], [0.1, 0.12, 0.07], [0, a, 0]);
  }
  add(head, sphere, M(C.hair), [-0.2, 0.34, 0.5], [0.3, 0.09, 0.1], [0, 0, 0.35]);   // swept fringe
  for (const s of [-1, 1]) add(head, sphere, M(C.hair), [s * 0.57, 0.02, 0.08], [0.1, 0.22, 0.2]);   // short sideburns

  return rig;
}
