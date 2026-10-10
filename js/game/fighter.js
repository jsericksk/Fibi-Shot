import * as THREE from 'three';
import { WEAPONS, WEAPON_ORDER, buildGun } from './weapons.js';
import { WORLD, MATCH } from '../config.js';
import { MODEL_SCALE } from '../characters/rig.js';
import { floorHeight } from './arena.js';

const STEP_UP = WORLD.stepUp;
export const MAX_HP = MATCH.maxHp;

// Each fall is different: on the back or on the belly, arms raised or at the sides
export const randomDeathPose = () => ({ faceUp: Math.random() < 0.5, armsUp: Math.random() < 0.5 });

// Shared state for the player and the enemy: model, health, weapons and movement
export class Fighter {
  constructor(def, isPlayer, arenaHalf) {
    this.def = def;
    this.arenaHalf = arenaHalf;
    this.radius = def.radius ?? WORLD.fighterRadius;
    this.isPlayer = isPlayer;
    this.rig = def.build();
    this.root = this.rig.root;
    this.pos = this.root.position;
    this.hp = MAX_HP;
    this.dead = false;
    this.deadT = 0;
    this.moving = false;
    this.yaw = 0;
    this.pitch = 0;
    this.kick = 0;
    this.vy = 0;
    this.onGround = true;

    this.hitboxes = this.rig.hitboxes;
    this.hitboxes.forEach(h => { h.userData.fighter = this; });

    // Every weapon model is mounted; only the active one is visible
    this.guns = {};
    this.ammo = {};
    for (const id of WEAPON_ORDER) {
      const gun = buildGun(id);
      gun.group.visible = false;
      this.rig.gunMount.add(gun.group);
      this.guns[id] = gun;
      this.ammo[id] = WEAPONS[id].mag;
    }
    this.weaponId = 'ak47';
    this.guns[this.weaponId].group.visible = true;
    this.cooldown = 0;
    this.reloadT = 0;
    this.reloading = false;
    this.bloom = 0;
    this.invuln = 0;     // spawn protection (seconds)
    this.respawnT = 0;
    this.emote = null;       // { dance, duration, sound, t } while dancing
    this.deathPose = { faceUp: true, armsUp: false };   // how the body lies once dead (see randomDeathPose)
    this.training = false;   // training: infinite ammo, cannot die
  }

  get weapon() { return WEAPONS[this.weaponId]; }
  get ammoNow() { return this.ammo[this.weaponId]; }

  chestPos(out = new THREE.Vector3()) {
    return out.set(this.pos.x, this.pos.y + 0.9 * MODEL_SCALE + 0.15, this.pos.z);
  }

  headPos(out = new THREE.Vector3()) {
    return out.set(this.pos.x, this.pos.y + 1.5 * MODEL_SCALE, this.pos.z);
  }

  muzzleWorld(out = new THREE.Vector3()) {
    return this.guns[this.weaponId].muzzle.getWorldPosition(out);
  }

  setWeapon(id) {
    if (id === this.weaponId || this.dead) return false;
    this.guns[this.weaponId].group.visible = false;
    this.weaponId = id;
    this.guns[id].group.visible = true;
    this.reloading = false;
    this.cooldown = 0;   // a freshly drawn weapon fires right away
    this.bloom = 0;
    return true;
  }

  canFire() { return !this.dead && this.cooldown <= 0 && !this.reloading && this.ammoNow > 0; }

  // Spends one bullet and starts the cooldown
  consumeShot() {
    const w = this.weapon;
    if (!this.training) this.ammo[w.id]--;
    this.cooldown = w.interval;
    this.bloom = Math.min(w.bloomMax, this.bloom + w.bloom);
  }

  startReload() {
    if (this.reloading || this.dead || this.ammoNow >= this.weapon.mag) return false;
    this.reloading = true;
    this.reloadT = this.weapon.reload;
    return true;
  }

  // Shooting interrupts a reload as long as there are bullets left
  cancelReload() {
    if (this.reloading && this.ammoNow > 0) this.reloading = false;
  }

  update(dt) {
    this.cooldown -= dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.bloom = Math.max(0, this.bloom - dt * 0.05);
    this.kick *= Math.exp(-dt * 5);
    if (this.reloading) {
      this.reloadT -= dt;
      if (this.reloadT <= 0) { this.reloading = false; this.ammo[this.weaponId] = this.weapon.mag; }
    }
    if (this.emote && (this.emote.t += dt) >= this.emote.duration) this.emote = null;
    if (this.dead) this.deadT += dt;
  }

  // Brings a dead fighter back at a new spot with full health and ammo
  respawn(x, z, yaw) {
    this.pos.set(x, 0, z);
    this.yaw = yaw;
    this.pitch = 0;
    this.kick = 0;
    this.vy = 0;
    this.hp = MAX_HP;
    this.dead = false;
    this.deadT = 0;
    this.emote = null;
    this.moving = false;
    for (const id of WEAPON_ORDER) this.ammo[id] = WEAPONS[id].mag;
    this.reloading = false;
    this.cooldown = 0.6;
    this.bloom = 0;
    this.invuln = MATCH.spawnProtection;
  }

  takeDamage(amount) {
    if (this.invuln > 0 || this.dead || this.training) return false;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) { this.dead = true; this.moving = false; this.emote = null; }
    return this.dead;
  }

  // Gravity, landing on the floor or on top of low cover
  updateVertical(dt, colliders, gravity) {
    this.vy -= gravity * dt;
    this.pos.y += this.vy * dt;
    const floor = floorHeight(colliders, this.pos.x, this.pos.z, this.pos.y + STEP_UP, 0.1);
    if (this.pos.y <= floor) {
      this.pos.y = floor;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  jump(speed) {
    if (!this.onGround || this.dead) return false;
    this.vy = speed;
    this.onGround = false;
    return true;
  }

  // Moves with circle-vs-box collision against cover and the arena bounds
  move(dx, dz, colliders) {
    this.pos.x += dx;
    this.pos.z += dz;
    for (const c of colliders) {
      if (this.pos.y >= c.h - 0.1) continue;   // above this cover: nothing to push against
      const cx = Math.max(c.minX, Math.min(this.pos.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(this.pos.z, c.maxZ));
      let ox = this.pos.x - cx, oz = this.pos.z - cz;
      const d = Math.hypot(ox, oz);
      if (d >= this.radius) continue;
      if (d > 1e-5) {
        this.pos.x = cx + (ox / d) * this.radius;
        this.pos.z = cz + (oz / d) * this.radius;
      } else {
        // Center is inside the box: push out along the nearest side
        const gaps = [[this.pos.x - c.minX, -1, 0], [c.maxX - this.pos.x, 1, 0], [this.pos.z - c.minZ, 0, -1], [c.maxZ - this.pos.z, 0, 1]];
        gaps.sort((a, b) => a[0] - b[0]);
        const [g, sx, sz] = gaps[0];
        this.pos.x += sx * (g + this.radius);
        this.pos.z += sz * (g + this.radius);
      }
    }
    const lim = this.arenaHalf - this.radius;
    this.pos.x = Math.max(-lim, Math.min(lim, this.pos.x));
    this.pos.z = Math.max(-lim, Math.min(lim, this.pos.z));
  }
}
