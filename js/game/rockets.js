import * as THREE from 'three';
import { M, add, cyl } from '../utils.js';
import { MATCH } from '../config.js';
import { sfx } from '../audio.js';

const FAR = MATCH.bulletRange;
const tmp = new THREE.Vector3();

const finGeo = new THREE.BoxGeometry(0.02, 0.12, 0.14);

// Rocket model: origin at the middle, flying along +Z
function buildRocket() {
  const g = new THREE.Group();
  add(g, cyl, M(0x9aa0aa), [0, 0, 0], [0.07, 0.5, 0.07], [Math.PI / 2, 0, 0]);
  add(g, new THREE.ConeGeometry(0.07, 0.2, 12), M(0xc23030), [0, 0, 0.35], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    add(g, finGeo, M(0x4a4e58), [-Math.sin(a) * 0.08, Math.cos(a) * 0.08, -0.2], [1, 1, 1], [0, 0, a]);
  }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0xffa23a }));
  flame.rotation.x = -Math.PI / 2;
  flame.position.z = -0.4;
  g.add(flame);
  return g;
}

// Slow rockets: they fly through the arena where everyone can see (and dodge) them, and explode on impact
export class Rockets {
  constructor(game) {
    this.game = game;
    this.list = [];
  }

  // Leaves the muzzle but heads for the point under the crosshair
  launch(shooter, origin, dir) {
    const { game } = this, w = shooter.weapon;
    game.scene.updateMatrixWorld();
    const muzzle = shooter.muzzleWorld();
    game.raycaster.set(origin, dir);
    game.raycaster.far = FAR;
    const hit = game.raycaster.intersectObjects(game.hittables(shooter), false)[0];
    const target = hit ? hit.point : origin.clone().addScaledVector(dir, FAR);

    const mesh = buildRocket();
    mesh.position.copy(muzzle);
    mesh.lookAt(target);
    game.scene.add(mesh);
    this.list.push({ mesh, shooter, weapon: w, dir: target.sub(muzzle).normalize(), life: w.projectile.life, trailT: 0 });

    game.effects.flash(muzzle, 0.4);
    sfx.shot(w.id, shooter.isPlayer ? 1 : Math.max(0.3, 1 - game.player.pos.distanceTo(shooter.pos) / 60));
  }

  update(dt) {
    const { game } = this;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i], p = r.weapon.projectile, step = p.speed * dt;
      game.raycaster.set(r.mesh.position, r.dir);
      game.raycaster.far = step;
      const hit = game.raycaster.intersectObjects(game.hittables(r.shooter), false)[0];
      r.life -= dt;
      if (hit || r.life <= 0) {
        if (hit) this.explode(r, hit.point);
        game.scene.remove(r.mesh);
        this.list.splice(i, 1);
        continue;
      }
      r.mesh.position.addScaledVector(r.dir, step);
      r.trailT -= dt;
      if (r.trailT <= 0) { r.trailT = p.trailInterval; game.effects.puff(r.mesh.position); }
    }
  }

  // Everyone on the other side within the radius is hurt, less the farther from the center
  explode(r, point) {
    const { game } = this, { damage, projectile: p } = r.weapon;
    game.effects.explosion(point, p.radius);
    sfx.explosion(Math.max(0.3, 1 - game.player.pos.distanceTo(point) / 60));
    if (game.state !== 'playing') return;
    for (const target of game.opponentsOf(r.shooter)) {
      if (target.dead || target.invuln > 0) continue;
      const d = point.distanceTo(target.chestPos(tmp));
      if (d > p.radius) continue;
      game.damage(r.shooter, target, damage * (1 - (1 - p.edge) * (d / p.radius)));
    }
  }
}
