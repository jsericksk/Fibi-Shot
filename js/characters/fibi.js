import * as THREE from 'three';
import { M, add, sphere, cyl, box } from '../utils.js';
import { createRig, addEyes } from './rig.js';

const C = { skin: 0xffe3d2, hair: 0xf6e7ae };

// Outfit colors of each look: coat (also the hat and the first sock stripe), trim, gloves and shoes, tie and clip, hat band and bow
const LOOKS = {
  default: { coat: 0xfbfbff, trim: 0x25222e, gloves: 0x25222e, shoes: 0x25222e, stripe: 0x25222e, pom: 0xfbfbff, tie: 0x2f9be0, clip: 0x1f6fb0, band: 0x7b5fd0, bowTie: 0x9a84f0 },
  noir: { coat: 0x24202a, trim: 0xe0182d, gloves: 0x15121a, shoes: 0x15121a, stripe: 0xe0182d, pom: 0xe0182d, tie: 0xe0182d, clip: 0xa01020, band: 0xe0182d, bowTie: 0xff6a78 },
};

const HAIR_PROFILE = new THREE.SplineCurve([[0.001, -0.6], [0.3, -0.58], [0.46, -0.48], [0.56, -0.3], [0.63, -0.1], [0.67, 0.15], [0.6, 0.4], [0.46, 0.55], [0.2, 0.66], [0.001, 0.68]].map(([r, y]) => new THREE.Vector2(r, y))).getPoints(60).map(p => p.setX(Math.max(0.001, p.x)));   // radius and height of the whole hair, from the bottom up so the faces point outward; sampled finely so it looks smooth
const HAT_TILT = 0.12;   // the hat leans back by this angle
const HAT_HAIR_TOP = 0.5;   // under a hat the hair ends inside the brim (its height at the head's center), so there is no gap and none pokes through the crown
const HAIR_Z = -0.1;   // the hair sits a bit behind the head's center and is flattened front to back
const HAIR_DEPTH = 0.95;
const HAIR_SWEEP = 0.6;   // how far back the hair below the ears leans per unit of height, so the long ends stay behind the neck

const BRIM = 1.02;   // radius of the hat brim (the dome and band keep their size)

// Blonde girl with a wide white hat, blue tie and striped socks.
// Skins: { hat: false } leaves the hat off, { look: 'noir' } is the black and red outfit
export function buildFibi({ hat: withHat = true, look = 'default' } = {}) {
  const L = LOOKS[look];
  const rig = createRig();
  const { head } = rig;

  addFibiOutfit(rig, look);

  // Head and face
  add(head, sphere, M(C.skin), [0, 0, 0], [0.62, 0.56, 0.58]);
  addEyes(head, { outer: 0x5a3fb5, inner: 0x9a84f0, mouth: 'smile' });

  // Hair: one smooth mass, wide at the back and ending above the chin so none shows under the face (the same in every skin), plus bangs and temples
  add(head, createHairGeometry(withHat), M(C.hair), [0, 0, HAIR_Z], [1, 1, HAIR_DEPTH]);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.2;
    add(head, sphere, M(C.hair), [Math.sin(a) * 0.6, 0.2, Math.cos(a) * 0.54], [0.1, 0.16, 0.07], [0, a, 0]);
  }
  for (const s of [-1, 1]) add(head, sphere, M(C.hair), [s * 0.5, 0.14, 0.08], [0.17, 0.37, 0.34]);   // temples, so the sides are not bald, up to the brim
  if (!withHat) addAhoge(head);
  else {
    // The hair under the hat is cut off, so once the hat is thrown she shows the full top instead of a bald spot
    rig.hatOff = [add(head, createHairGeometry(false), M(C.hair), [0, 0, HAIR_Z], [1, 1, HAIR_DEPTH]), addAhoge(head)];
    rig.hatOff.forEach(o => { o.visible = false; });
  }

  // X hairclip and ribbon
  const clip = new THREE.Group();
  clip.position.set(0.5, 0.35, 0.38);
  clip.rotation.y = 0.9;
  head.add(clip);
  add(clip, box, M(L.tie), [0, 0, 0], [0.18, 0.06, 0.03], [0, 0, 0.8]);
  add(clip, box, M(L.clip), [0, 0, 0.01], [0.18, 0.06, 0.03], [0, 0, -0.8]);
  add(head, sphere, M(L.gloves), [-0.6, 0.38, 0.2], [0.09, 0.12, 0.07]);

  if (withHat) addFibiHat(rig, { look, y: 0.5, crown: 1, back: 0 });

  return rig;
}

// The hair lathe with its lower half swept backwards (and its top cut off under a hat), so it flows down behind the head and never shows under the chin
function createHairGeometry(withHat) {
  const geo = new THREE.LatheGeometry(HAIR_PROFILE, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, pos.getZ(i) - Math.max(0, -pos.getY(i) - 0.1) * HAIR_SWEEP);
    if (withHat) pos.setY(i, Math.min(pos.getY(i), HAT_HAIR_TOP + HAT_TILT * (HAIR_Z + pos.getZ(i) * HAIR_DEPTH)));   // follows the tilted brim: lower at the back
  }
  geo.computeVertexNormals();
  return geo;
}

// Fibi's outfit: striped socks and shoes with pom-poms, coat with trim and tie, sleeves and gloves.
// Other characters wear it too (their `fibi` skin), so it only touches the legs, body and arms
export function addFibiOutfit(rig, look = 'default') {
  const L = LOOKS[look];
  const { legs, body, arms } = rig;

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

  // Pom-poms on the shoes
  for (const leg of legs) add(leg, sphere, M(L.pom), [0, -0.4, 0.2], [0.05, 0.05, 0.05]);
}

// The curl of hair that sticks up from the top of her head: one smooth tube that rises and curls over to the right
const AHOGE_PATH = new THREE.CatmullRomCurve3([[0, -0.02], [0.005, 0.08], [0.04, 0.17], [0.11, 0.22], [0.18, 0.2], [0.2, 0.13], [0.15, 0.09]].map(([x, y]) => new THREE.Vector3(x, y, 0)));

function addAhoge(head) {
  const ahoge = new THREE.Group();
  ahoge.position.set(-0.1, 0.66, 0.04);
  ahoge.rotation.z = 0.2;
  head.add(ahoge);
  add(ahoge, new THREE.TubeGeometry(AHOGE_PATH, 32, 0.036, 8), M(C.hair));
  add(ahoge, sphere, M(C.hair), AHOGE_PATH.getPoint(1).toArray(), [0.036, 0.036, 0.036]);   // rounded tip
  return ahoge;
}

// Wide-brim hat with band and trim, and a bow on the band. `rig.hat` lets it pop off when the wearer dies.
// Other characters wear it too: y is how high it sits on the head. Hers is higher, to fit her hair volume under the hat
export function addFibiHat(rig, { look = 'default', y = 0.38, crown = 1.25, back = 0.08 } = {}) {
  const L = LOOKS[look];
  const { head } = rig;
  const hat = new THREE.Group();
  hat.position.set(0, y, -0.02);
  hat.rotation.x = -HAT_TILT;
  hat.scale.setScalar(1.05);
  head.add(hat);
  rig.hat = hat;

  // The crown is widened and shifted back by the wearer's hair volume, so no hair pokes out of it; the brim grows half as much
  const brim = BRIM * (1 + (crown - 1) * 0.5);
  add(hat, cyl, M(L.coat), [0, 0, 0], [brim, 0.04, brim]);
  add(hat, new THREE.TorusGeometry(brim, 0.04, 10, 48), M(L.trim), [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  add(hat, new THREE.TorusGeometry(brim * 0.79, 0.035, 10, 48), M(L.band), [0, 0.04, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const r = 0.56 * crown;
  add(hat, new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(L.coat), [0, 0.02, -back], [r, 0.5, r]);
  add(hat, cyl, M(L.trim), [0, 0.1, -back], [r + 0.005, 0.07, r + 0.005]);
  add(hat, cyl, M(L.band), [0, 0.03, -back], [r + 0.01, 0.03, r + 0.01]);

  // Bow on the hat band
  const bow = new THREE.Group();
  bow.position.set(Math.sin(0.8) * (r + 0.02), 0.08, Math.cos(0.8) * (r + 0.02) - back);
  bow.rotation.y = 0.8;
  bow.scale.setScalar(1.7);
  hat.add(bow);
  for (const s of [-1, 1]) add(bow, new THREE.ConeGeometry(0.1, 0.22, 4), M(L.band), [s * 0.1, 0, 0.02], [1, 1, 0.45], [0, 0, s * -Math.PI / 2]);
  add(bow, sphere, M(L.bowTie), [0, 0, 0.03], [0.06, 0.06, 0.05]);
}
