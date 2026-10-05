import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xffe3d2, hair: 0xf6e7ae, white: 0xfbfbff, black: 0x25222e, purple: 0x7b5fd0, blue: 0x2f9be0 };

// Blonde girl with a wide white hat, blue tie and striped socks
export function buildFibi() {
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Striped socks and shoes
  for (const leg of legs) {
    [-0.07, -0.19, -0.31].forEach((y, i) => add(leg, cyl, M(i % 2 ? C.white : C.black), [0, y, 0], [0.1, 0.06, 0.1]));
    add(leg, sphere, M(C.black), [0, -0.44, 0.07], [0.13, 0.08, 0.2]);
  }

  // White coat with black trim and blue tie
  add(body, new THREE.CylinderGeometry(0.27, 0.4, 0.5, 32), M(C.white), [0, 0.78, 0]);
  add(body, new THREE.CylinderGeometry(0.405, 0.41, 0.07, 32), M(C.black), [0, 0.54, 0]);
  add(body, new THREE.ConeGeometry(0.1, 0.5, 4), M(C.blue), [0, 0.8, 0.31], [1, 1, 0.25], [Math.PI, 0, 0]);
  add(body, box, M(C.blue), [0, 1.02, 0.28], [0.18, 0.1, 0.06]);
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(C.black), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // Sleeves and black gloves
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.15, 0.5, 20), M(C.white), [0, -0.25, 0]);
    add(arm, cyl, M(C.black), [0, -0.38, 0], [0.153, 0.025, 0.153]);
    add(arm, sphere, M(C.black), [0, -0.58, 0], [0.14, 0.14, 0.14]);
  }

  // Head and face
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x5a3fb5, inner: 0x9a84f0, mouth: 'smile' });

  // Hair: top cap, bangs, back hair and side locks
  add(head, new THREE.SphereGeometry(1, 32, 24, 0, Math.PI * 2, 0, 1.15), M(C.hair), [0, 0.02, 0], [0.655, 0.6, 0.62]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.2, Math.cos(a) * 0.54], [0.1, 0.16, 0.07], [0, a, 0]);
  }
  add(head, new THREE.CylinderGeometry(0.6, 0.5, 0.62, 32), M(C.hair), [0, -0.01, -0.2]);
  add(head, sphere, M(C.hair), [0, -0.32, -0.2], [0.5, 0.15, 0.48]);
  // Volume under the hat. Kept narrower than the hat dome so no blonde shows through.
  add(head, sphere, M(C.hair), [0, 0.28, -0.1], [0.52, 0.48, 0.52]);
  for (const s of [-1, 1]) {
    add(head, new THREE.CapsuleGeometry(0.14, 0.4, 8, 16), M(C.hair), [s * 0.58, -0.32, 0.1], [1, 1, 1], [0, 0, s * -0.08]);
  }

  // Blue X hairclip and black ribbon
  const clip = new THREE.Group();
  clip.position.set(0.5, 0.35, 0.38);
  clip.rotation.y = 0.9;
  head.add(clip);
  add(clip, box, M(C.blue), [0, 0, 0], [0.18, 0.06, 0.03], [0, 0, 0.8]);
  add(clip, box, M(0x1f6fb0), [0, 0, 0.01], [0.18, 0.06, 0.03], [0, 0, -0.8]);
  add(head, sphere, M(C.black), [-0.6, 0.38, 0.2], [0.09, 0.12, 0.07]);

  // Wide-brim hat with band and purple trim
  const hat = new THREE.Group();
  hat.position.set(0, 0.5, -0.02);
  hat.rotation.x = -0.12;
  hat.scale.setScalar(1.05);
  head.add(hat);
  add(hat, cyl, M(C.white), [0, 0, 0], [1.2, 0.04, 1.2]);
  add(hat, new THREE.TorusGeometry(1.2, 0.04, 10, 48), M(C.black), [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(hat, new THREE.TorusGeometry(0.95, 0.035, 10, 48), M(C.purple), [0, 0.04, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(hat, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(C.white), [0, 0.02, 0], [0.56, 0.5, 0.56]);
  add(hat, cyl, M(C.black), [0, 0.1, 0], [0.565, 0.07, 0.565]);
  add(hat, cyl, M(C.purple), [0, 0.03, 0], [0.57, 0.03, 0.57]);

  // Purple bow on the hat band
  const bow = new THREE.Group();
  bow.position.set(Math.sin(0.8) * 0.58, 0.08, Math.cos(0.8) * 0.58);
  bow.rotation.y = 0.8;
  bow.scale.setScalar(1.7);
  hat.add(bow);
  for (const s of [-1, 1]) add(bow, new THREE.ConeGeometry(0.1, 0.22, 4), M(C.purple), [s * 0.1, 0, 0.02], [1, 1, 0.45], [0, 0, s * -Math.PI / 2]);
  add(bow, sphere, M(0x9a84f0), [0, 0, 0.03], [0.06, 0.06, 0.05]);

  // White pom-poms on the shoes
  for (const leg of legs) add(leg, sphere, M(C.white), [0, -0.4, 0.2], [0.05, 0.05, 0.05]);

  return rig;
}
