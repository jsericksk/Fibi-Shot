import * as THREE from 'three';
import { M, add, cyl } from '../utils.js';
import { sfx } from '../audio.js';
import { net } from '../net.js';

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

  // Flies along the crosshair line, so it hits exactly what the crosshair saw (the muzzle sits below the camera and a
  // straight shot from it would clip cover the crosshair clears). It is only drawn at the muzzle and eases onto the line.
  launch(shooter, origin, dir) {
    const { game } = this, w = shooter.weapon;
    game.scene.updateMatrixWorld();
    const muzzle = shooter.muzzleWorld();
    this.muzzleEffects(shooter, w, muzzle);

    // Cover between the camera and the muzzle (firing point-blank): it blows up right there
    const toMuzzle = muzzle.clone().sub(origin);
    game.raycaster.set(origin, toMuzzle.clone().normalize());
    game.raycaster.far = toMuzzle.length();
    const wall = game.raycaster.intersectObjects(game.arena.blockers, false)[0];
    if (wall) return this.explode({ shooter, weapon: w }, wall.point);

    const start = origin.clone().addScaledVector(dir, toMuzzle.dot(dir));   // the line point level with the muzzle
    const offset = muzzle.sub(start);
    this.spawn(shooter, w, start, dir, offset);
    if (game.multi && shooter.isPlayer) {
      const r = v => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
      net.send({ t: 'shot', w: w.id, mz: r(start), d: r(dir), off: r(offset) });
    }
  }

  // The friend's rocket: we only draw it, their game decides who it hurts
  launchRemote(shooter, w, start, dir, offset) {
    this.muzzleEffects(shooter, w, start.clone().add(offset));
    this.spawn(shooter, w, start, dir, offset, true);
  }

  muzzleEffects(shooter, w, muzzle) {
    const { game } = this;
    game.effects.flash(muzzle, 0.4);
    sfx.shot(w.id, shooter.isPlayer ? 1 : Math.max(0.3, 1 - game.player.pos.distanceTo(shooter.pos) / 60));
  }

  // pos is where it really flies; the mesh is drawn `offset` away from it at first
  spawn(shooter, weapon, start, dir, offset, visualOnly = false) {
    const mesh = buildRocket();
    mesh.lookAt(dir);
    this.game.scene.add(mesh);
    const r = { mesh, shooter, weapon, dir, pos: start.clone(), offset, flown: 0, life: weapon.projectile.life, trailT: 0, visualOnly };
    this.drawAt(r);
    this.list.push(r);
  }

  drawAt(r) {
    const fade = Math.max(0, 1 - r.flown / r.weapon.projectile.blendDistance);
    r.mesh.position.copy(r.pos).addScaledVector(r.offset, fade);
  }

  update(dt) {
    const { game } = this;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i], p = r.weapon.projectile, step = p.speed * dt;
      game.raycaster.set(r.pos, r.dir);
      game.raycaster.far = step;
      const hit = game.raycaster.intersectObjects(game.hittables(r.shooter), false)[0];
      r.life -= dt;
      if (hit || r.life <= 0) {
        if (hit) this.explode(r, hit.point, hit.object.userData.fighter);   // set only on a fighter's hitbox
        game.scene.remove(r.mesh);
        this.list.splice(i, 1);
        continue;
      }
      r.pos.addScaledVector(r.dir, step);
      r.flown += step;
      this.drawAt(r);
      r.trailT -= dt;
      if (r.trailT <= 0) { r.trailT = p.trailInterval; game.effects.puff(r.mesh.position); }
    }
  }

  // Everyone on the other side within the radius is hurt, less the farther from the center; a direct hit takes the full damage
  explode(r, point, direct) {
    const { game } = this, { damage, projectile: p } = r.weapon;
    game.effects.explosion(point, p.radius);
    sfx.explosion(Math.max(0.3, 1 - game.player.pos.distanceTo(point) / 60));
    if (r.visualOnly || game.state !== 'playing') return;
    for (const target of game.opponentsOf(r.shooter)) {
      if (target.dead || target.invuln > 0) continue;
      const d = point.distanceTo(target.chestPos(tmp));
      if (d > p.radius) continue;
      game.damage(r.shooter, target, target === direct ? damage : damage * (1 - (1 - p.edge) * (d / p.radius)));
    }
  }
}
