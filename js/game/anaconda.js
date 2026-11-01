import * as THREE from 'three';
import { ANACONDA } from '../config.js';
import { sfx } from '../audio.js';
import { M, add, sphere, box, rand } from '../utils.js';

const SCALES = new THREE.Color(0x4f6a2a), SPOTS = new THREE.Color(0x2a3a18);
const CENTER = new THREE.Vector3(0, 0, 0);
const smooth = k => k * k * (3 - 2 * k);
const R = ANACONDA.radius;

// Jungle easter egg: a giant anaconda pops up behind the far wall and sways, then strikes the center of the map when time is up
export class Anaconda {
  constructor(scene, half) {
    this.t = 0;              // seconds since it appeared
    this.strikeT = 0;        // seconds since the strike began
    this.impactT = null;     // seconds since it hit the center
    this.done = false;

    // The spine in two poses: raised behind the far wall, and stretched in an arc down to the center
    const tail = new THREE.Vector3(0, 0, -(half + ANACONDA.tailDistance));
    const last = ANACONDA.raised.length - 1;
    this.raised = ANACONDA.raised.map(p => new THREE.Vector3(...p).add(tail));
    this.struck = this.raised.map((_, i) => {
      const f = i / last;
      return tail.clone().lerp(CENTER, f).setY(i === last ? ANACONDA.groundY : ANACONDA.arcHeight * Math.sin(Math.PI * f));
    });

    const { segments } = ANACONDA;
    this.body = new THREE.InstancedMesh(sphere, M(0xffffff), segments);
    this.body.castShadow = true;
    this.body.frustumCulled = false;   // the instances move far from the origin the geometry was measured at
    for (let i = 0; i < segments; i++) this.body.setColorAt(i, i % 5 === 0 ? SPOTS : SCALES);
    this.head = this.makeHead();
    this.dust = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: 0xd8e6b0, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    this.dust.rotation.x = -Math.PI / 2;
    this.dust.position.y = 0.15;
    this.dust.visible = false;
    scene.add(this.body, this.head, this.dust);

    sfx.hiss();
    this.update(0, Infinity);
  }

  makeHead() {
    const head = new THREE.Group();
    add(head, sphere, M(0x4f6a2a), [0, 0, R * 0.8], [R * 1.3, R * 0.95, R * 2]);
    for (const side of [-1, 1]) {
      add(head, sphere, new THREE.MeshBasicMaterial({ color: 0xffd23a }), [side * R * 0.8, R * 0.45, R * 1.3], [R * 0.22, R * 0.22, R * 0.22]);
      add(head, box, new THREE.MeshBasicMaterial({ color: 0x000000 }), [side * R * 0.92, R * 0.45, R * 1.3], [R * 0.04, R * 0.34, R * 0.1]);   // slit pupil
    }
    this.tongue = new THREE.Group();
    this.tongue.position.set(0, -R * 0.3, R * 2.7);
    for (const side of [-1, 1]) add(this.tongue, box, M(0xd8344a), [side * R * 0.12, 0, R * 0.35], [R * 0.08, R * 0.05, R * 0.8], [0, side * 0.2, 0]);
    head.add(this.tongue);
    return head;
  }

  // Points along the body from the tail to the head. k blends the raised pose (0) into the struck one (1)
  spine(k) {
    const sway = ANACONDA.swayAmount * (1 - k);
    const points = this.raised.map((p, i) => {
      const point = p.clone().lerp(this.struck[i], k);
      point.x += Math.sin(this.t * ANACONDA.swaySpeed + i * 0.8) * sway * (i / (this.raised.length - 1));
      return point;
    });
    return new THREE.CatmullRomCurve3(points).getSpacedPoints(ANACONDA.segments);
  }

  // timeLeft: seconds left in the match. The strike starts when it reaches zero
  update(dt, timeLeft) {
    this.t += dt;
    if (timeLeft <= 0) this.strikeT += dt;
    const k = smooth(Math.min(1, this.strikeT / ANACONDA.strikeSeconds));
    const pop = smooth(Math.min(1, this.t / ANACONDA.popSeconds));

    const pts = this.spine(k), { segments } = ANACONDA, m = new THREE.Matrix4();
    for (let i = 0; i < segments; i++) {
      const u = i / segments, r = R * pop * (0.18 + 0.82 * Math.min(1, u * 2.2));   // thin tail, full body from the middle on
      this.body.setMatrixAt(i, m.makeScale(r, r, r).setPosition(pts[i]));
    }
    this.body.instanceMatrix.needsUpdate = true;

    const end = pts[segments];
    this.head.position.copy(end);
    this.head.scale.setScalar(pop || 0.001);
    this.head.lookAt(end.clone().add(end.clone().sub(pts[segments - 1])));
    this.tongue.scale.z = 0.4 + 0.6 * Math.abs(Math.sin(this.t * 14));   // flicks in and out

    if (this.strikeT > 0 && this.impactT === null && k === 1) this.hit();
    if (this.impactT !== null) this.updateDust(dt);
    this.done = this.strikeT >= ANACONDA.strikeSeconds + ANACONDA.settleSeconds;
  }

  hit() {
    this.impactT = 0;
    this.dust.visible = true;
    sfx.explosion(0.6);
  }

  updateDust(dt) {
    this.impactT += dt;
    const p = Math.min(1, this.impactT / ANACONDA.dustSeconds);
    this.dust.scale.setScalar(1 + (ANACONDA.dustRadius - 1) * p);
    this.dust.material.opacity = 0.8 * (1 - p);
  }

  // Rumble at the moment of impact
  shake(camera) {
    if (this.impactT === null || this.impactT > ANACONDA.shakeSeconds) return;
    const k = ANACONDA.shake * (1 - this.impactT / ANACONDA.shakeSeconds);
    camera.position.add(new THREE.Vector3(rand(-k, k), rand(-k, k), rand(-k, k)));
  }
}
