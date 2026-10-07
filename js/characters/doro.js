import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig } from './rig.js';

const C = {
  dough: 0xfff3ea,          // soft white body
  cheek: 0xffd6d0,
  hair: 0xe7a3a0,           // dusty pink
  hairDark: 0xcf8a8a,
  rose: 0xe58f98,
  roseLine: 0xb4616c,
  lavender: 0xb7a4e2,
  ribbon: 0xffffff,
  eye: 0x8d7acb,
  eyeLight: 0xc3b4ee,
  line: 0x5a3a52,
};

// Chubby, sweet mochi girl: puffy cheeks, big purple eyes, pink hair with a rose bun and a lavender bow
export function buildDoro() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Short stubby legs and round feet
  for (const leg of legs) {
    add(leg, sphere, M(C.dough), [0, -0.26, 0.02], [0.15, 0.2, 0.15]);
    add(leg, sphere, M(C.dough), [0, -0.42, 0.08], [0.16, 0.09, 0.22]);
  }

  // Big round dough body with a lighter belly
  add(body, sphere, M(C.dough), [0, 0.76, 0], [0.5, 0.5, 0.46]);
  add(body, sphere, M(0xfffaf5), [0, 0.7, 0.2], [0.34, 0.36, 0.26]);

  // Tiny stubby arms with round mittens
  for (const arm of arms) {
    const s = arm.userData.side;
    add(arm, sphere, M(C.dough), [s * 0.04, -0.2, 0], [0.14, 0.24, 0.14]);
    add(arm, sphere, M(C.dough), [s * 0.04, -0.42, 0], [0.12, 0.12, 0.12]);
  }

  // Head: wide and squishy, with big puffed cheeks
  add(head, sphere, M(C.dough), [0, 0, 0], [0.7, 0.58, 0.62]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.cheek), [s * 0.42, -0.16, 0.3], [0.24, 0.2, 0.22]);
    add(head, sphere, M(0xffb9b9, { transparent: true, opacity: 0.7 }), [s * 0.42, -0.14, 0.47], [0.15, 0.09, 0.03], [0, s * 0.5, 0]);
  }

  // Big purple eyes
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.25, -0.03, 0.53);
    eye.rotation.y = s * 0.3;
    head.add(eye);
    add(eye, sphere, M(C.eye), [0, 0, 0], [0.16, 0.17, 0.06]);
    add(eye, sphere, M(C.eyeLight), [0, -0.04, 0.03], [0.12, 0.11, 0.04]);
    add(eye, sphere, M(0x241a38), [0, -0.01, 0.045], [0.065, 0.07, 0.03]);
    add(eye, sphere, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), [-0.04, 0.04, 0.07], [0.04, 0.04, 0.02]);
    add(eye, sphere, M(0xffffff), [0.045, -0.06, 0.07], [0.022, 0.022, 0.012]);
    // Soft upper lid and a relaxed brow: outer ends slightly lower = friendly
    add(eye, sphere, M(C.line), [0, 0.13, 0.035], [0.2, 0.04, 0.05], [0, 0, s * -0.15]);
    add(head, box, M(C.hairDark), [s * 0.25, 0.2, 0.55], [0.2, 0.04, 0.03], [0, s * 0.3, s * -0.2]);
  }

  // Pouty "v" mouth
  for (const s of [-1, 1]) add(head, box, M(0x9a4a5a), [s * 0.04, -0.255, 0.575], [0.09, 0.02, 0.012], [0, 0, s * 0.7]);

  // Pink hair: top cap, bangs with a center part, long side locks and back hair
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.2), M(C.hair), [0, 0.04, -0.02], [0.74, 0.64, 0.67]);
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;                                // center part
    const a = i * 0.19;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.66 + Math.sign(i) * 0.03, 0.2, Math.cos(a) * 0.55], [0.11, 0.21, 0.07], [0, a, -Math.sign(i) * 0.15]);
  }
  add(head, sphere, M(C.hair), [0, -0.02, -0.2], [0.72, 0.62, 0.62]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.hair), [s * 0.58, 0.1, 0.1], [0.17, 0.34, 0.34]);   // temples, so the sides are not bald
    add(head, new THREE.CapsuleGeometry(0.1, 0.5, 8, 16), M(C.hair), [s * 0.64, -0.22, 0.18], [1, 1, 1], [0.08, 0, s * -0.12]);
    add(head, sphere, M(C.hairDark), [s * 0.62, -0.5, 0.2], [0.09, 0.1, 0.08]);
  }

  // Hair bun with a rose on top right
  const bun = new THREE.Group();
  bun.position.set(0.46, 0.62, -0.04);
  bun.rotation.z = -0.5;
  head.add(bun);
  add(bun, sphere, M(C.hair), [0, 0, 0], [0.24, 0.22, 0.24]);
  add(bun, sphere, M(C.rose), [0.03, 0.1, 0.1], [0.2, 0.17, 0.17]);
  add(bun, new THREE.TorusGeometry(0.1, 0.018, 8, 24), M(C.roseLine), [0.03, 0.12, 0.22], [1, 1, 1], [0.2, 0, 0]);
  add(bun, new THREE.TorusGeometry(0.055, 0.016, 8, 20), M(C.roseLine), [0.03, 0.12, 0.25], [1, 1, 1], [0.2, 0, 0]);

  // Lavender bow with white ribbon tails
  const bow = new THREE.Group();
  bow.position.set(0.6, 0.38, 0.1);
  bow.rotation.set(0, 0.9, -0.2);
  bow.scale.setScalar(1.25);
  head.add(bow);
  for (const s of [-1, 1]) add(bow, new THREE.ConeGeometry(0.1, 0.2, 4), M(C.lavender), [s * 0.1, 0, 0.02], [1, 1, 0.45], [0, 0, s * -Math.PI / 2]);
  add(bow, sphere, M(0x9884d4), [0, 0, 0.03], [0.055, 0.055, 0.05]);
  add(bow, box, M(C.ribbon), [0.07, -0.2, -0.01], [0.09, 0.3, 0.015], [0, 0, 0.35]);
  add(bow, box, M(C.ribbon), [-0.02, -0.18, -0.02], [0.08, 0.26, 0.015], [0, 0, -0.1]);

  return rig;
}
