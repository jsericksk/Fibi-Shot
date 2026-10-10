import * as THREE from 'three';
import { lerpAngle } from '../utils.js';
import { NET } from '../config.js';

// The other human player, drawn from the state messages they send. Same shape as EnemyAI so the
// game treats it as just another entry in `game.bots`.
export class RemotePlayer {
  constructor(game, fighter) {
    this.game = game;
    this.f = fighter;
    this.f.remote = true;
    this.f.root.visible = false;   // hidden until the first state arrives
    this.target = null;
  }

  // Latest state of the friend: position, aim, weapon, health and emote
  applyState(s) {
    const f = this.f;
    if (!this.target) {
      f.pos.set(s.x, s.y, s.z);
      f.yaw = s.yaw;
      f.root.visible = true;
    }
    this.target = s;
    f.moving = s.mv;
    f.onGround = s.gr;
    f.hp = s.hp;
    f.pitch = s.pitch;
    [f.stats.shots, f.stats.hits, f.stats.headshots, f.stats.damage] = s.st;   // kills and deaths are counted on both sides
    if (s.dead && !f.dead) f.deadT = 0;
    f.dead = s.dead;
    if (!f.dead && s.w !== f.weaponId) f.setWeapon(s.w);
    // A new dance starts when its id changes (it also ends by itself after its duration)
    if (!s.em) { f.emote = null; this.emoteId = null; }
    else if (s.em.id !== this.emoteId) { this.emoteId = s.em.id; f.emote = { ...s.em, t: 0 }; }
  }

  // Slides the model toward the latest known position so 30 updates per second look smooth
  update(dt) {
    const s = this.target, f = this.f;
    if (!s) return;
    const dist = Math.hypot(s.x - f.pos.x, s.z - f.pos.z);
    const k = dist > NET.snapDistance ? 1 : Math.min(1, dt * NET.smoothing);
    f.pos.x += (s.x - f.pos.x) * k;
    f.pos.z += (s.z - f.pos.z) * k;
    f.pos.y += (s.y - f.pos.y) * k;
    f.yaw = lerpAngle(f.yaw, s.yaw, k);
    f.root.rotation.y = f.yaw;
  }

  onRespawn() {}

  dispose() {}
}
