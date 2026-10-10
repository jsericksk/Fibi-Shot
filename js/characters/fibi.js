import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xffe3d2, hair: 0xf6e7ae };

// Outfit colors of each look: coat (also the hat and the first sock stripe), trim, gloves and shoes, tie and clip, hat band and bow
const LOOKS = {
  default: { coat: 0xfbfbff, trim: 0x25222e, gloves: 0x25222e, shoes: 0x25222e, stripe: 0x25222e, pom: 0xfbfbff, tie: 0x2f9be0, clip: 0x1f6fb0, band: 0x7b5fd0, bowTie: 0x9a84f0 },
  noir: { coat: 0x24202a, trim: 0xe0182d, gloves: 0x15121a, shoes: 0x15121a, stripe: 0xe0182d, pom: 0xe0182d, tie: 0xe0182d, clip: 0xa01020, band: 0xe0182d, bowTie: 0xff6a78 },
};

const BOB_PROFILE = new THREE.SplineCurve([[0.001, -0.42], [0.5, -0.4], [0.64, -0.28], [0.68, -0.05], [0.66, 0.2], [0.58, 0.4], [0.42, 0.54], [0.2, 0.62], [0.001, 0.65]].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(60).map(p => p.setX(Math.max(0.001, p.x)));   // radius and height of the back hair without the hat, from the bottom up so the faces point outward; sampled finely so it looks smooth

const BRIM = 1.02;   // radius of the hat brim (the dome and band keep their size)

// Blonde girl with a wide white hat, blue tie and striped socks.
// Skins: { hat: false } leaves the hat off, { look: 'noir' } is the black and red outfit
export function buildFibi({ hat: withHat = true, look = 'default' } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { legs, body, arms, head } = rig;

  // Striped socks and shoes
  for (const leg of legs) {
    [-0.07, -0.19, -0.31].forEach((y, i) => add(leg, cyl, M(i % 2 ? L.coat : L.stripe), [0, y, 0], [0.1, 0.12, 0.1]));   // stripes touch, so the sock is one solid tube
    add(leg, sphere, M(L.shoes), [0, -0.44, 0.07], [0.13, 0.08, 0.2]);
  }

  // White coat with black trim and blue tie
  add(body, new THREE.CylinderGeometry(0.27, 0.4, 0.5, 32), M(L.coat), [0, 0.78, 0]);
  add(body, new THREE.CylinderGeometry(0.405, 0.41, 0.07, 32), M(L.trim), [0, 0.54, 0]);
  add(body, new THREE.ConeGeometry(0.1, 0.5, 4), M(L.tie), [0, 0.8, 0.31], [1, 1, 0.25], [Math.PI, 0, 0]);
  add(body, box, M(L.tie), [0, 1.02, 0.28], [0.18, 0.1, 0.06]);
  add(body, new THREE.TorusGeometry(0.27, 0.05, 12, 32), M(L.trim), [0, 1.02, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

  // Sleeves and black gloves
  for (const arm of arms) {
    add(arm, new THREE.CylinderGeometry(0.1, 0.15, 0.5, 20), M(L.coat), [0, -0.25, 0]);
    add(arm, cyl, M(L.trim), [0, -0.38, 0], [0.153, 0.025, 0.153]);
    add(arm, sphere, M(L.gloves), [0, -0.58, 0], [0.14, 0.14, 0.14]);
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
  if (withHat) add(head, new THREE.CylinderGeometry(0.6, 0.5, 0.86, 32), M(C.hair), [0, 0.06, -0.15], [1, 1, 1], [-0.12, 0, 0]);   // tilted like the brim, so its top reaches the underside of the brim without poking through
  else {
    add(head, new THREE.LatheGeometry(BOB_PROFILE, 64), M(C.hair), [0, 0.04, -0.14], [1.05, 1.2, 0.95]);   // without the hat the hair is a tall, smooth bob
    addAhoge(head);
  }
  add(head, sphere, M(C.hair), [0, -0.32, -0.2], [0.5, 0.15, 0.48]);
  // Volume under the hat. Kept narrower than the hat dome so no blonde shows through.
  if (withHat) add(head, sphere, M(C.hair), [0, 0.28, -0.1], [0.52, 0.48, 0.52]);
  for (const s of [-1, 1]) {
    add(head, sphere, M(C.hair), [s * 0.5, 0.14, 0.08], [0.17, 0.37, 0.34]);   // temples, so the sides are not bald, up to the brim
    add(head, new THREE.CapsuleGeometry(0.15, 0.5, 8, 16), M(C.hair), [s * 0.58, -0.22, 0.1], [1, 1, 1], [0, 0, s * -0.08]);
  }

  // X hairclip and ribbon
  const clip = new THREE.Group();
  clip.position.set(0.5, 0.35, 0.38);
  clip.rotation.y = 0.9;
  head.add(clip);
  add(clip, box, M(L.tie), [0, 0, 0], [0.18, 0.06, 0.03], [0, 0, 0.8]);
  add(clip, box, M(L.clip), [0, 0, 0.01], [0.18, 0.06, 0.03], [0, 0, -0.8]);
  add(head, sphere, M(L.gloves), [-0.6, 0.38, 0.2], [0.09, 0.12, 0.07]);

  if (withHat) addHat(rig, L);

  // Pom-poms on the shoes
  for (const leg of legs) add(leg, sphere, M(L.pom), [0, -0.4, 0.2], [0.05, 0.05, 0.05]);

  return rig;
}

// The curl of hair that sticks up from the top of her head: one smooth tube that rises and curls over to the right
const AHOGE_PATH = new THREE.CatmullRomCurve3([[0, -0.02], [0.005, 0.08], [0.04, 0.17], [0.11, 0.22], [0.18, 0.2], [0.2, 0.13], [0.15, 0.09]].map(([x, y]) => new THREE.Vector3(x, y, 0)));

function addAhoge(head) {
  const ahoge = new THREE.Group();
  ahoge.position.set(-0.1, 0.76, 0.04);
  ahoge.rotation.z = 0.2;
  head.add(ahoge);
  add(ahoge, new THREE.TubeGeometry(AHOGE_PATH, 32, 0.036, 8), M(C.hair));
  add(ahoge, sphere, M(C.hair), AHOGE_PATH.getPoint(1).toArray(), [0.036, 0.036, 0.036]);   // rounded tip
}

// Wide-brim hat with band and trim, and a bow on the band. `rig.hat` lets it pop off when she dies
function addHat(rig, L) {
  const { head } = rig;
  const hat = new THREE.Group();
  hat.position.set(0, 0.5, -0.02);
  hat.rotation.x = -0.12;
  hat.scale.setScalar(1.05);
  head.add(hat);
  rig.hat = hat;
  add(hat, cyl, M(L.coat), [0, 0, 0], [BRIM, 0.04, BRIM]);
  add(hat, new THREE.TorusGeometry(BRIM, 0.04, 10, 48), M(L.trim), [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(hat, new THREE.TorusGeometry(BRIM * 0.79, 0.035, 10, 48), M(L.band), [0, 0.04, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(hat, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(L.coat), [0, 0.02, 0], [0.56, 0.5, 0.56]);
  add(hat, cyl, M(L.trim), [0, 0.1, 0], [0.565, 0.07, 0.565]);
  add(hat, cyl, M(L.band), [0, 0.03, 0], [0.57, 0.03, 0.57]);

  // Bow on the hat band
  const bow = new THREE.Group();
  bow.position.set(Math.sin(0.8) * 0.58, 0.08, Math.cos(0.8) * 0.58);
  bow.rotation.y = 0.8;
  bow.scale.setScalar(1.7);
  hat.add(bow);
  for (const s of [-1, 1]) add(bow, new THREE.ConeGeometry(0.1, 0.22, 4), M(L.band), [s * 0.1, 0, 0.02], [1, 1, 0.45], [0, 0, s * -Math.PI / 2]);
  add(bow, sphere, M(L.bowTie), [0, 0, 0.03], [0.06, 0.06, 0.05]);
}
