import * as THREE from 'three';
import { WEAPON_ORDER } from './weapons.js';
import { rand, randInt, lerpAngle, clamp } from '../utils.js';
import { ENEMY, PLAYER, SHOWCASE, EMOTES, WORLD } from '../config.js';

const SPEED = PLAYER.walkSpeed;   // bots move as fast as the player
const MIN_RANGE = ENEMY.minRange, MAX_RANGE = ENEMY.maxRange;
const AWP_CHARGE = ENEMY.awpCharge;
const ERROR = ENEMY.aimError;
const FIRE_RANGE = ENEMY.fireRange;

// Soft white glint (glow with a small sparkle) shown on the scope lens while the enemy aims the AWP
function makeGlint() {
  const S = 128, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  glow.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, S, S);
  // Thin cross-shaped streaks
  for (const [x0, y0, x1, y1] of [[0, 64, S, 64], [64, 0, 64, S]]) {
    const l = g.createLinearGradient(x0, y0, x1, y1);
    l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.9)'); l.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = l; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
  sprite.renderOrder = 10;
  sprite.visible = false;
  return sprite;
}

// Simple enemy brain: hunts the player, strafes, switches weapons and fires in bursts
export class EnemyAI {
  // wander = showcase mode (training): roams, jumps and dances, never hunts or shoots
  constructor(game, fighter, target, wander = false) {
    this.wander = wander;
    this.game = game;
    this.f = fighter;
    this.target = target;

    // Glint on the AWP scope lens while charging a shot
    this.scopeIcon = makeGlint();
    game.scene.add(this.scopeIcon);

    this.onRespawn();
  }

  // Resets timers and picks a fresh weapon (also used for the first spawn)
  onRespawn() {
    this.strafeDir = 1;
    this.strafeT = 0;
    this.lastTarget = null;   // where the player was last frame, to read which way it slides
    this.playerSide = 0;      // -1 / 1: the side the player has been sliding to
    this.mirrorT = 0;         // countdown to answering a side change (0 = none pending)
    this.detourT = 0;
    this.noLosT = 0;
    this.los = false;
    this.switchT = rand(5, 9);
    this.jumpT = rand(...ENEMY.jumpEvery);
    this.seeAwpT = 0;
    this.emoteT = rand(...SHOWCASE.emoteEvery);
    this.way = null;
    this.wayT = 0;
    this.reaction = ENEMY.firstShotDelay;     // delay before the first shot
    this.burstLeft = 0;
    this.burstWait = 0.3;
    this.charge = 0;
    this.f.setWeapon(this.pickWeapon());
  }

  update(dt, canAct) {
    const f = this.f, t = this.target;
    this.scopeIcon.visible = false;
    if (f.dead) return;
    if (this.wander) return this.updateWander(dt, canAct);

    // Face the target
    const dx = t.pos.x - f.pos.x, dz = t.pos.z - f.pos.z;
    const dist = Math.hypot(dx, dz);
    f.yaw = lerpAngle(f.yaw, Math.atan2(dx, dz), Math.min(1, dt * 7));
    f.root.rotation.y = f.yaw;
    const to = t.chestPos(new THREE.Vector3()).sub(f.chestPos(new THREE.Vector3()));
    f.pitch = clamp(Math.atan2(to.y, dist), -0.5, 0.5);

    if (!canAct) { f.moving = false; return; }
    if (f.emote) {   // taunting: stands still until the dance ends, it is hit or it sees the player aiming at it
      if (this.noticesDanger()) f.emote = null;
      else { f.moving = false; return; }
    }

    this.los = this.game.hasLineOfSight(f.chestPos(new THREE.Vector3()), t.chestPos(new THREE.Vector3()));
    this.noLosT = this.los ? 0 : this.noLosT + dt;

    this.followPlayerSide(dt, dx, dz, dist);
    this.move(dt, dist);
    if (t.dead) return;   // keeps moving after a kill so it does not look frozen
    this.handleWeapons(dt);
    if (!this.game.training) this.fire(dt, dist);   // in training the enemy only roams, it never shoots
  }

  startEmote() {
    const list = EMOTES[this.f.def.id] ?? EMOTES.default;
    this.f.emote = { ...list[randInt(0, list.length - 1)], t: 0 };
    this.emoteHp = this.f.hp;
  }

  // True when the bot got hurt or the player is aiming (scoped) at it in plain sight
  noticesDanger() {
    const f = this.f, t = this.target, controls = this.game.controls;
    if (f.hp < this.emoteHp) return true;
    if (t.dead || !controls.scoped) return false;
    const toBot = f.chestPos().sub(t.chestPos());
    if (controls.aimDir().dot(toBot.clone().normalize()) < ENEMY.noticeAimDot) return false;
    return this.game.hasLineOfSight(t.chestPos(), f.chestPos());
  }

  // Now and then the bot dances over the player it just eliminated
  taunt() {
    if (Math.random() < ENEMY.tauntChance) this.startEmote();
  }

  // Showcase behaviour: walk to random spots, hop around and now and then dance
  updateWander(dt, canAct) {
    const f = this.f;
    f.pitch = 0;
    if (!canAct) { f.moving = false; return; }
    if (f.emote) { f.moving = false; return; }          // stands still while dancing

    this.emoteT -= dt;
    if (this.emoteT <= 0) {
      this.startEmote();
      this.emoteT = rand(...SHOWCASE.emoteEvery);
      f.moving = false;
      return;
    }

    this.wayT -= dt;
    if (!this.way || this.wayT <= 0 || Math.hypot(this.way.x - f.pos.x, this.way.z - f.pos.z) < 1) {
      const lim = WORLD.arenaHalf - 3;
      for (let i = 0; i < 30; i++) {
        const x = rand(-lim, lim), z = rand(-lim, lim);
        if (this.game.arena.isFree(x, z, 1.2)) { this.way = { x, z }; break; }
      }
      this.wayT = rand(...SHOWCASE.waypointTime);
    }
    if (!this.way) return;

    const dx = this.way.x - f.pos.x, dz = this.way.z - f.pos.z, len = Math.hypot(dx, dz) || 1;
    f.yaw = lerpAngle(f.yaw, Math.atan2(dx, dz), Math.min(1, dt * 6));
    f.root.rotation.y = f.yaw;
    f.moving = true;

    this.jumpT -= dt;
    if (this.jumpT <= 0 && f.onGround) { f.jump(PLAYER.jumpSpeed); this.jumpT = rand(...ENEMY.jumpEvery); }

    const before = f.pos.clone();
    f.move((dx / len) * SHOWCASE.walkSpeed * dt, (dz / len) * SHOWCASE.walkSpeed * dt, this.game.arena.colliders);
    // Stuck behind cover: hop and choose somewhere else
    if (f.pos.distanceTo(before) < SHOWCASE.walkSpeed * dt * 0.3) {
      if (f.onGround) f.jump(PLAYER.jumpSpeed);
      this.wayT = 0;
    }
  }

  // When the player starts sliding to the other side, the bot turns around too (after a short reaction)
  followPlayerSide(dt, dx, dz, dist) {
    const t = this.target, last = this.lastTarget;
    this.lastTarget = { x: t.pos.x, z: t.pos.z };
    if (last && dt > 0 && dist > 0) {
      const across = ((t.pos.x - last.x) * -dz + (t.pos.z - last.z) * dx) / (dist * dt);   // speed across the line between them
      const side = Math.abs(across) > ENEMY.mirrorMinSpeed ? Math.sign(across) : 0;
      if (side && side !== this.playerSide) {
        if (this.playerSide && Math.random() < ENEMY.mirrorChance) this.mirrorT = rand(...ENEMY.mirrorDelay);
        this.playerSide = side;
      }
    }
    if (this.mirrorT > 0 && (this.mirrorT -= dt) <= 0) {
      this.strafeDir = this.strafeDir ? -this.strafeDir : (Math.random() < 0.5 ? -1 : 1);
      this.strafeT = rand(0.7, 2);
    }
  }

  move(dt, dist) {
    const f = this.f;
    this.strafeT -= dt;
    this.detourT -= dt;
    if (this.strafeT <= 0) {
      this.strafeDir = Math.random() < 0.15 ? 0 : (Math.random() < 0.5 ? -1 : 1);
      this.strafeT = rand(0.7, 2);
    }
    // Chase when far or when cover has hidden the player for a while; slide sideways around obstacles
    // The shotgun wants to be close; everything else keeps its distance
    const close = f.weapon.id === 'shotgun';
    const minRange = close ? 3 : MIN_RANGE, maxRange = close ? 9 : MAX_RANGE;
    let range = dist > maxRange || this.noLosT > 1.5 ? 1 : dist < minRange ? -1 : 0;
    let strafe = this.strafeDir;
    if (this.detourT > 0) { range = 0; strafe = this.strafeDir || 1; }

    const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
    const vx = fx * range * 0.8 + -fz * strafe;
    const vz = fz * range * 0.8 + fx * strafe;
    const len = Math.hypot(vx, vz);
    f.moving = len > 0;
    if (len === 0) return;

    // Hops now and then, and tries to hop over low cover that blocks the way
    this.jumpT -= dt;
    if (this.jumpT <= 0 && f.onGround) { f.jump(PLAYER.jumpSpeed); this.jumpT = rand(...ENEMY.jumpEvery); }

    const before = f.pos.clone();
    f.move((vx / len) * SPEED * dt, (vz / len) * SPEED * dt, this.game.arena.colliders);
    // Blocked by cover: turn around and slide along it for a moment
    if (f.pos.distanceTo(before) < SPEED * dt * 0.3) {
      this.strafeDir = (this.strafeDir || 1) * -1;
      this.strafeT = rand(0.5, 1.2);
      this.detourT = rand(0.6, 1.2);
      if (f.onGround) f.jump(PLAYER.jumpSpeed);
    }
  }

  // Random weapon, but when the player is on the AWP the bot likes to answer with its own
  pickWeapon() {
    if (this.target.weaponId === 'awp' && Math.random() < ENEMY.awpCounterChance) return 'awp';
    return WEAPON_ORDER[randInt(0, WEAPON_ORDER.length - 1)];
  }

  handleWeapons(dt) {
    const f = this.f;
    this.switchT -= dt;
    if (this.switchT <= 0 && !f.reloading) {
      f.setWeapon(this.pickWeapon());
      this.switchT = rand(6, 11);
      this.charge = 0;
      this.burstLeft = 0;
    }

    // Noticed the player aiming with an AWP for a moment: switch to the AWP too
    this.seeAwpT = this.target.weaponId === 'awp' && f.weaponId !== 'awp' ? this.seeAwpT + dt : 0;
    if (this.seeAwpT > 1.2 && !f.reloading && Math.random() < ENEMY.awpCounterChance) {
      f.setWeapon('awp');
      this.switchT = rand(8, 12);
      this.charge = 0;
      this.burstLeft = 0;
      this.seeAwpT = 0;
    } else if (this.seeAwpT > 1.2) this.seeAwpT = 0;
    if (f.ammoNow <= 0 && !f.reloading) f.startReload();
  }

  fire(dt, dist) {
    const f = this.f, w = f.weapon, t = this.target;
    this.reaction -= dt;
    if (this.reaction > 0 || f.reloading || f.ammoNow <= 0 || !this.los || dist > FIRE_RANGE[w.id]) { this.charge = 0; return; }

    const origin = f.chestPos(new THREE.Vector3());
    const aim = t.chestPos(new THREE.Vector3());

    if (w.id === 'awp') {
      this.charge += dt;
      this.showScopeGlint();
      if (this.charge >= AWP_CHARGE && f.canFire()) { this.shoot(origin, aim); this.charge = 0; this.reaction = rand(0.4, 1); }
    } else if (w.id === 'pistol' || w.id === 'shotgun') {
      this.burstWait -= dt;
      if (this.burstWait <= 0 && f.canFire()) { this.shoot(origin, aim); this.burstWait = w.id === 'shotgun' ? rand(0.6, 1.2) : rand(0.3, 0.9); }
    } else {
      if (this.burstLeft > 0) {
        if (f.canFire()) { this.shoot(origin, aim); this.burstLeft--; if (this.burstLeft === 0) this.burstWait = rand(0.9, 1.9); }
      } else {
        this.burstWait -= dt;
        if (this.burstWait <= 0) this.burstLeft = randInt(3, 7);
      }
    }
  }

  showScopeGlint() {
    this.scopeIcon.position.copy(this.f.guns.awp.group.localToWorld(new THREE.Vector3(0, 0.16, 0.5)));
    this.scopeIcon.scale.setScalar(0.55 + Math.sin(this.game.t * 14) * 0.12);
    this.scopeIcon.material.opacity = 0.75 + Math.sin(this.game.t * 14) * 0.25;
    this.scopeIcon.visible = true;
  }

  shoot(origin, aim) {
    const f = this.f, t = this.target;
    const dir = aim.clone().sub(origin).normalize();
    // Random aim error, worse when the player is moving
    const err = ERROR[f.weapon.id] * (t.moving ? 1.3 : 1) + f.bloom * 0.6 + (f.onGround ? 0 : PLAYER.airSpread);
    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * err;
    dir.addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
    f.consumeShot();
    this.game.fire(f, origin, dir);
  }

  dispose() {
    this.game.scene.remove(this.scopeIcon);
    this.scopeIcon.material.map.dispose();
    this.scopeIcon.material.dispose();
  }
}
