import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xffe3d2, hair: 0x9fb8ae, red: 0xd8483e, cream: 0xfbf3ec, dark: 0x3a3a46, bow: 0xe8584a };

// Sleepy girl with long wavy gray-green hair and a red/white kimono-style outfit
export function buildNono() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Dark socks and shoes
  for (const leg of legs) {
    add(leg, cyl, M(C.dark), [0, -0.23, 0], [0.09, 0.34, 0.09]);   // reaches down to the shoe
    add(leg, sphere, M(0x2a2420), [0, -0.44, 0.07], [0.12, 0.07, 0.18]);
  }

  // Layered kimono: dark skirt, red robe, cream collar, obi and bow
  add(body, new THREE.CylinderGeometry(0.3, 0.44, 0.34, 32), M(C.dark), [0, 0.6, 0]);
  add(body, new THREE.CylinderGeometry(0.27, 0.4, 0.42, 32), M(C.red), [0, 0.82, 0]);
  add(body, new THREE.CylinderGeometry(0.405, 0.41, 0.05, 32), M(C.cream), [0, 0.64, 0]);
  add(body, cyl, M(C.dark), [0, 0.88, 0], [0.285, 0.07, 0.285]);
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(C.cream), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const s of [-1, 1]) {
    add(body, new THREE.ConeGeometry(0.13, 0.26, 4), M(C.bow), [s * 0.14, 0.95, 0.3], [1, 1, 0.4], [0, 0, s * -Math.PI / 2]);
  }
  add(body, sphere, M(C.bow), [0, 0.95, 0.31], [0.07, 0.07, 0.06]);
  add(body, new THREE.ConeGeometry(0.06, 0.3, 4), M(C.cream), [0, 0.72, 0.32], [1, 1, 0.3], [Math.PI, 0, 0]);

  // Wide cream sleeves with red trim
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.11, 0.2, 0.5, 20), M(C.cream), [0, -0.25, 0]);
    add(arm, cyl, M(C.red), [0, -0.5, 0], [0.205, 0.025, 0.205]);
    add(arm, sphere, M(C.skin), [0, -0.6, 0], [0.09, 0.09, 0.09]);
  }

  // Head with sleepy half-closed eyes
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x7a70a8, inner: 0xc4bbe4, lidY: 0.14, lidSY: 0.05, brow: 0x6b7a74, mouth: 'smile', blush: 0.7 });

  // Hair: heavy bangs, shoulder-length back hair and long side locks
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.2), M(C.hair), [0, 0.02, 0], [0.665, 0.61, 0.63]);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.17;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.62, 0.17, Math.cos(a) * 0.55], [0.095, 0.2, 0.07], [0, a, 0]);
  }
  add(head, new THREE.CylinderGeometry(0.5, 0.56, 0.5, 32), M(C.hair), [0, -0.2, -0.46]);
  add(head, sphere, M(C.hair), [0, -0.45, -0.46], [0.56, 0.14, 0.46]);
  add(head, sphere, M(C.hair), [0, 0.1, -0.1], [0.67, 0.62, 0.64]);
  for (const s of [-1, 1]) {
    add(head, new THREE.CapsuleGeometry(0.12, 0.55, 8, 16), M(C.hair), [s * 0.6, -0.5, 0.05], [1, 1, 1], [0, 0, s * -0.1]);
    add(head, sphere, M(C.hair), [s * 0.66, -0.93, 0.08], [0.15, 0.15, 0.15]); // wavy curl at the tip
  }

  // Small red ribbon in the hair
  add(head, box, M(C.red), [-0.48, 0.38, 0.35], [0.14, 0.07, 0.03], [0, -0.7, 0.5]);
  add(head, box, M(C.red), [-0.48, 0.38, 0.35], [0.14, 0.07, 0.03], [0, -0.7, -0.5]);

  // Golden bell on the hair ribbon and little cream pom-poms on the shoes
  add(head, sphere, M(0xf2c14e, { metalness: 0.6, roughness: 0.35 }), [-0.5, 0.26, 0.38], [0.055, 0.055, 0.055]);
  for (const leg of legs) add(leg, sphere, M(C.cream), [0, -0.39, 0.16], [0.045, 0.045, 0.045]);

  return rig;
}
