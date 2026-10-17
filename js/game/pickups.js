import * as THREE from 'three';
import { M, add, sphere, cyl } from '../utils.js';
import { HEALTH_FLASK, WORLD } from '../config.js';
import { MAX_HP } from './fighter.js';
import { sfx } from '../audio.js';
import { net } from '../net.js';

// Red potion flask with a glass neck and a cork
function buildFlask() {
  const g = new THREE.Group();
  add(g, sphere, M(0xe0243a, { emissive: 0xc01028, emissiveIntensity: 0.6, roughness: 0.25 }), [0, 0, 0], [0.26, 0.26, 0.26]);
  add(g, cyl, M(0xdff3ff, { transparent: true, opacity: 0.7, roughness: 0.1 }), [0, 0.3, 0], [0.09, 0.2, 0.09]);
  add(g, cyl, M(0x8a5a35), [0, 0.43, 0], [0.11, 0.07, 0.11]);
  return g;
}

// Health flasks on the floor: walking over one restores all health, then it comes back after a while
export class HealthFlasks {
  constructor(game, scene, map, half) {
    this.game = game;
    const spread = half / WORLD.designHalf;
    const [x, z] = map.health.map(v => v * spread);
    this.list = [[x, z], [-x, -z]].map(([px, pz]) => {
      const mesh = buildFlask();
      mesh.position.set(px, HEALTH_FLASK.float, pz);
      scene.add(mesh);
      return { x: px, z: pz, mesh, cooldown: 0 };
    });
  }

  update(dt, fighters) {
    this.list.forEach((flask, i) => {
      if (flask.cooldown > 0) {
        flask.cooldown -= dt;
        flask.mesh.visible = flask.cooldown <= 0;
      }
      if (!flask.mesh.visible) return;
      flask.mesh.rotation.y += HEALTH_FLASK.spinSpeed * dt;
      flask.mesh.position.y = HEALTH_FLASK.float + Math.sin(this.game.t * 2.5) * HEALTH_FLASK.bob;
      const taker = fighters.find(f => this.canTake(f, flask));
      if (!taker) return;
      this.take(i);
      taker.heal();
      if (taker.isPlayer) {
        sfx.heal();
        if (this.game.multi) net.send({ t: 'flask', i });   // the friend's copy of the flask disappears too
      }
    });
  }

  canTake(f, flask) {
    return !f.dead && !f.remote && f.hp < MAX_HP && f.pos.y < HEALTH_FLASK.pickupHeight
      && Math.hypot(f.pos.x - flask.x, f.pos.z - flask.z) < HEALTH_FLASK.pickupRadius;
  }

  take(i) {
    this.list[i].cooldown = HEALTH_FLASK.respawnSeconds;
    this.list[i].mesh.visible = false;
  }

  // Closest flask that is on the floor and within `range` meters of `pos`, or null
  nearest(pos, range) {
    let best = null, bestDist = range;
    for (const flask of this.list) {
      const dist = Math.hypot(flask.x - pos.x, flask.z - pos.z);
      if (flask.mesh.visible && dist < bestDist) { best = flask; bestDist = dist; }
    }
    return best;
  }
}
