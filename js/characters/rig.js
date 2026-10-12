import * as THREE from 'three';
import { M, add, sphere, box, clamp } from '../utils.js';
import { DANCES } from './dances.js';
import { SLIDE } from '../config.js';

export const MODEL_SCALE = 0.85;
const AIM_ARM_X = -Math.PI / 2 + 0.08;
const HIP_LOCAL = 0.52;                  // where the legs hang from, in model space
const HIP_HEIGHT = HIP_LOCAL * MODEL_SCALE;
export const HEAD_LOCAL = 1.75;           // hitbox centers in model space (the head box is lifted to also cover hats, hair and ears)
const BODY_LOCAL = 0.58;
const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

// Creates an empty chibi skeleton. Character files fill it with visuals.
// Local space: Y up, front faces +Z. Arms and gun mount live in `aimPivot`, which pitches up/down.
export function createRig() {
  const root = new THREE.Group();   // world position + yaw
  const model = new THREE.Group();  // scaled visuals (also used for the death fall)
  model.scale.setScalar(MODEL_SCALE);
  root.add(model);

  const legs = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * 0.17, 0.52, 0);
    model.add(g);
    return g;
  });

  const body = new THREE.Group();
  model.add(body);

  const aimPivot = new THREE.Group();
  aimPivot.position.set(0, 1.0, 0);
  model.add(aimPivot);

  const arms = [-1, 1].map(s => {
    const g = new THREE.Group();
    g.position.set(s * 0.33, 0, 0);
    g.userData.side = s;
    aimPivot.add(g);
    return g;
  });

  const gunMount = new THREE.Group();
  gunMount.position.set(0, -0.08, 0.36);
  aimPivot.add(gunMount);

  const head = new THREE.Group();
  head.position.y = 1.5;
  head.scale.setScalar(1.06);   // slightly bigger head: cuter chibi proportions
  model.add(head);

  // Invisible hitboxes in root space, so they ignore animation
  const headBox = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), hitMaterial);
  headBox.scale.set(0.7, 0.75, 0.7).multiplyScalar(MODEL_SCALE);   // an egg: wide enough for the hair, tall enough for hats and ears
  headBox.position.y = HEAD_LOCAL * MODEL_SCALE;
  headBox.userData.zone = 'head';
  const bodyBox = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * MODEL_SCALE, 0.42 * MODEL_SCALE, 1.15 * MODEL_SCALE, 12), hitMaterial);
  bodyBox.position.y = BODY_LOCAL * MODEL_SCALE;
  bodyBox.userData.zone = 'body';
  // Arms and hands, which hang at the sides or reach forward while aiming. A child of the body box, so it follows the slide
  const armsBox = new THREE.Mesh(new THREE.BoxGeometry(1.1 * MODEL_SCALE, 0.8 * MODEL_SCALE, 1.1 * MODEL_SCALE), hitMaterial);
  armsBox.position.set(0, (0.72 - BODY_LOCAL) * MODEL_SCALE, 0.1 * MODEL_SCALE);
  armsBox.userData.zone = 'body';
  bodyBox.add(armsBox);
  root.add(headBox, bodyBox);

  const rig = { root, model, legs, body, aimPivot, arms, gunMount, head, hitboxes: [headBox, bodyBox, armsBox] };
  setAimPose(rig);
  return rig;
}

// Both arms reaching forward to hold a gun
export function setAimPose(rig) {
  rig.arms.forEach(a => a.rotation.set(AIM_ARM_X, 0, a.userData.side * -0.35));
}

// Arms hanging down (used for portraits)
export function setIdlePose(rig) {
  rig.arms.forEach(a => a.rotation.set(0, 0, a.userData.side * 0.2));
  rig.emoteOnly?.forEach(o => { o.visible = false; });   // the stage never runs animateRig outside emotes
}

// Big anime eyes, eyebrows, blush and mouth, attached to the head group
export function addEyes(head, o = {}) {
  const { outer = 0x5a3fb5, inner = 0x9a84f0, lidY = 0.17, lidSY = 0.032, brow = 0x4a3a30, mouth = 'smile', blush = 0.8 } = o;
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.24, -0.04, 0.5);
    eye.rotation.y = s * 0.35;
    head.add(eye);
    add(eye, sphere, M(outer), [0, 0, 0], [0.17, 0.2, 0.06]);
    add(eye, sphere, M(inner), [0, -0.04, 0.03], [0.13, 0.14, 0.04]);
    add(eye, sphere, M(0x1b1530), [0, 0.01, 0.045], [0.07, 0.08, 0.03]);
    add(eye, sphere, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }), [-0.04, 0.07, 0.07], [0.05, 0.05, 0.02]);
    add(eye, sphere, M(0xffffff), [0.05, -0.07, 0.07], [0.03, 0.03, 0.015]);
    add(eye, sphere, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 }), [-0.07, -0.03, 0.065], [0.016, 0.016, 0.012]);
    add(eye, sphere, M(0x25222e), [0, lidY, 0.02], [0.2, lidSY, 0.05]); // upper eyelid
    add(head, box, M(brow), [s * 0.26, 0.24, 0.5], [0.15, 0.035, 0.03], [0, s * 0.35, s * -0.15]);
    if (blush > 0) add(head, sphere, M(0xffa9b4, { transparent: true, opacity: blush }), [s * 0.35, -0.2, 0.44], [0.12, 0.07, 0.03], [0, s * 0.6, 0]);
  }
  if (mouth === 'smile') add(head, sphere, M(0xb24a5a), [0, -0.24, 0.55], [0.045, 0.03, 0.02]);
  if (mouth === 'open') {
    add(head, sphere, M(0x8a2f45), [0, -0.25, 0.54], [0.09, 0.07, 0.03]);
    add(head, sphere, M(0xff8fa0), [0, -0.28, 0.555], [0.05, 0.03, 0.02]);
  }
  if (mouth === 'flat') add(head, box, M(0xa0585f), [0, -0.25, 0.55], [0.06, 0.012, 0.01]);
}

// Poses the rig every frame: aim pitch, run cycle, death fall
export function animateRig(rig, { moving, t, pitch, dead, deadT, deathPose, air, sliding, emote, unarmed }, dt) {
  const k = Math.min(1, dt * 15);
  rig.gunMount.visible = !emote && !unarmed && !dead;   // a dead fighter has dropped the weapon
  if (rig.hat) rig.hat.visible = !dead;                 // and lost the hat, if any
  rig.emoteOnly?.forEach(o => { o.visible = !!emote && !dead; });   // e.g. the finger guns
  if (emote && !dead) return danceRig(rig, emote);
  rig.model.rotation.y = rig.model.rotation.z = 0;
  rig.head.rotation.y = rig.head.rotation.z = 0;
  const swing = moving && !dead && !air ? Math.sin(t * 11) * 0.8 : 0;
  const tuck = sliding && !dead ? SLIDE.legs : air && !dead ? [-0.6, 0.45] : [swing, -swing];   // legs out in front when sliding
  rig.legs[0].rotation.x += (tuck[0] - rig.legs[0].rotation.x) * k;
  rig.legs[1].rotation.x += (tuck[1] - rig.legs[1].rotation.x) * k;
  rig.aimPivot.rotation.x = -clamp(pitch, -1, 1);
  rig.head.rotation.x = -clamp(pitch, -1, 1) * 0.35;

  if (dead) {
    // Fall around the feet, onto the back or the belly, then lift the model so it lies on the floor instead of in it
    rig.aimPivot.rotation.x = 0;
    rig.model.rotation.x += ((deathPose.faceUp ? -1.5 : 1.5) - rig.model.rotation.x) * Math.min(1, dt * 6);
    rig.model.position.y = 0;
    rig.arms.forEach(a => {
      a.rotation.x += ((deathPose.armsUp ? -2.9 : 0.15) - a.rotation.x) * k;
      a.rotation.z += (a.userData.side * (deathPose.armsUp ? -0.25 : -0.2) - a.rotation.z) * k;
    });
    keepAboveFloor(rig);
  } else {
    // Sliding: the body tilts back around the hips, which sink, and the aim stays level
    rig.model.rotation.x += ((sliding ? -SLIDE.leanBack : 0) - rig.model.rotation.x) * k;
    const lean = -rig.model.rotation.x;
    const bob = moving && !air ? Math.abs(Math.sin(t * 11)) * 0.05 : 0;
    rig.model.position.set(0, bob + HIP_HEIGHT * (1 - Math.cos(lean)) - SLIDE.bodyDrop * lean / SLIDE.leanBack, HIP_HEIGHT * Math.sin(lean));
    if (sliding) keepAboveFloor(rig);   // leaning back sinks the hat into the floor
    rig.aimPivot.rotation.x += lean;
    poseHitboxes(rig, clamp(lean, 0, SLIDE.leanBack));
    // Blend every axis back to the aim pose so dances never leave arms or legs twisted
    // Unarmed (showcase) characters let their arms swing naturally instead of aiming
    rig.arms.forEach(a => {
      const planted = sliding && a.userData.side < 0;   // one hand on the floor, like a slide on gravel
      const tx = unarmed ? (a.userData.side < 0 ? -swing : swing) * 0.7 : planted ? SLIDE.plantedArm : AIM_ARM_X;
      const tz = unarmed ? a.userData.side * 0.2 : planted ? a.userData.side * 0.3 : a.userData.side * -0.35;
      a.rotation.x += (tx - a.rotation.x) * k;
      a.rotation.y += (0 - a.rotation.y) * k;
      a.rotation.z += (tz - a.rotation.z) * k;
    });
    rig.legs.forEach(l => { l.rotation.y += (0 - l.rotation.y) * k; l.rotation.z += (0 - l.rotation.z) * k; });
  }
}

// The hitboxes live in root space, so they follow the slide by hand: lowered and tilted back with the body
function poseHitboxes(rig, lean) {
  const [head, body] = rig.hitboxes;
  const hipY = HIP_HEIGHT - SLIDE.bodyDrop * lean / SLIDE.leanBack;
  for (const [box, local] of [[head, HEAD_LOCAL], [body, BODY_LOCAL]]) {
    const along = (local - HIP_LOCAL) * MODEL_SCALE;   // distance from the hips up the body
    box.position.set(0, hipY + along * Math.cos(lean), -along * Math.sin(lean));
  }
  body.rotation.x = -lean;
}

// Plays the emote dance (see dances.js)
function danceRig(rig, { dance, t }) {
  rig.aimPivot.rotation.x = 0;
  (DANCES[dance] ?? DANCES.idol)(rig, t);
  keepAboveFloor(rig);
}

const floorBox = new THREE.Box3();

// Lowest world Y of the visible model (the hidden gun is ignored)
export function modelMinY(rig) {
  rig.model.updateMatrixWorld(true);
  floorBox.makeEmpty();
  const expandVisible = obj => obj.traverseVisible(o => { if (o.isMesh) floorBox.expandByObject(o); });   // a thrown-off hat does not count
  for (const part of rig.model.children) {
    if (part === rig.aimPivot) rig.arms.forEach(expandVisible);
    else expandVisible(part);
  }
  return floorBox.min.y;
}

// Poses like curtsies and leans can push the model into the floor; lift it so its lowest point stays on top
function keepAboveFloor(rig) {
  const below = rig.root.position.y - modelMinY(rig);
  if (below > 0) rig.model.position.y += below;
}
