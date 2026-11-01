import * as THREE from 'three';
import { ALIEN, MATCH } from '../config.js';
import { sfx } from '../audio.js';
import { M, add, sphere, cyl, lerpAngle, clamp } from '../utils.js';

const smooth = k => k * k * (3 - 2 * k);
const SKIN = M(0x6fd37a), BLACK = M(0x14121c);
const GLOW = M(0xff4aa0, { emissive: 0xff4aa0, emissiveIntensity: 1.2 });

// Mars easter egg: a little green alien pops up flying, spirals down to the center of the map and lands there
export class Alien {
  // groundY: height of the center of the map, where it lands (the cover there may be raised)
  constructor(scene, groundY) {
    this.groundY = groundY;
    this.t = 0;
    this.done = false;
    this.last = new THREE.Vector3();
    this.heading = 0;

    this.root = new THREE.Group();
    this.arms = [];
    this.legs = [];
    this.build();
    scene.add(this.root);

    // A glowing disc under its feet while it hovers
    this.hover = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ color: 0x6af0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.hover.rotation.x = -Math.PI / 2;
    this.hover.position.y = 0.02;
    this.root.add(this.hover);

    sfx.alien();
    this.update(0, MATCH.easterEggSeconds);
  }

  build() {
    add(this.root, sphere, SKIN, [0, 1.0, 0], [0.5, 0.7, 0.4]);
    add(this.root, sphere, SKIN, [0, 2.1, 0], [0.85, 0.7, 0.75]);
    for (const side of [-1, 1]) {
      add(this.root, sphere, BLACK, [side * 0.32, 2.12, 0.62], [0.28, 0.4, 0.12], [0, 0, side * 0.35]);
      add(this.root, sphere, M(0xffffff), [side * 0.28, 2.25, 0.72], [0.06, 0.06, 0.03]);
      add(this.root, cyl, SKIN, [side * 0.3, 2.85, 0], [0.04, 0.6, 0.04], [0, 0, -side * 0.35]);   // antenna
      add(this.root, sphere, GLOW, [side * 0.42, 3.13, 0], [0.12, 0.12, 0.12]);

      const arm = new THREE.Group();
      arm.position.set(side * 0.55, 1.5, 0);
      add(arm, cyl, SKIN, [0, -0.4, 0], [0.09, 0.8, 0.09]);
      this.root.add(arm);
      this.arms.push(arm);

      const leg = new THREE.Group();
      leg.position.set(side * 0.2, 0.55, 0);
      add(leg, cyl, SKIN, [0, -0.27, 0], [0.1, 0.55, 0.1]);
      this.root.add(leg);
      this.legs.push(leg);
    }
  }

  // timeLeft: seconds left in the match. It lands at the center `landSeconds` before the end, then stays there doing nothing
  update(dt, timeLeft) {
    this.t += dt;
    const u = clamp((MATCH.easterEggSeconds - timeLeft) / (MATCH.easterEggSeconds - ALIEN.landSeconds), 0, 1);
    const k = smooth(u), air = 1 - k;
    const angle = ALIEN.startAngle + k * ALIEN.turns * Math.PI * 2, r = ALIEN.startRadius * air;
    const pos = this.root.position;
    this.last.copy(pos);
    pos.set(Math.cos(angle) * r, this.groundY + ALIEN.startHeight * air * air + Math.sin(this.t * ALIEN.bobSpeed) * ALIEN.bob * air, Math.sin(angle) * r);

    // It faces where it flies, then turns to face the player's side of the map once it has landed
    if (dt > 0) this.heading = lerpAngle(this.heading, Math.atan2(pos.x - this.last.x, pos.z - this.last.z), Math.min(1, dt * 6));
    this.root.rotation.y = lerpAngle(this.heading, 0, smooth(clamp((u - 0.8) / 0.2, 0, 1)));
    this.root.scale.setScalar(ALIEN.size * smooth(Math.min(1, this.t / ALIEN.popSeconds)) || 0.001);

    this.arms.forEach((arm, i) => { arm.rotation.z = (i ? -1 : 1) * (0.15 + air * (0.8 + 0.4 * Math.sin(this.t * 9))); });   // waves while flying, hangs once landed
    this.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(this.t * 5 + i * Math.PI) * 0.3 * air; });
    this.hover.material.opacity = 0.8 * air;
    this.done = timeLeft <= 0;
  }
}
