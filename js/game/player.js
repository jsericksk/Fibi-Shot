import * as THREE from 'three';
import { clamp } from '../utils.js';
import { sfx } from '../audio.js';
import { toggleFullscreen } from '../fullscreen.js';
import { settings } from '../settings.js';
import { WEAPON_ORDER } from './weapons.js';
import { CAMERA, PLAYER, EMOTES } from '../config.js';

const BASE_FOV = CAMERA.fov;
const JUMP_SPEED = PLAYER.jumpSpeed;
const WALK_SPEED = PLAYER.walkSpeed;
const SCOPED_SPEED = PLAYER.scopedSpeed;
const ZOOM_RATE = CAMERA.scopeZoomRate;
const CAM_DISTANCE = CAMERA.distance;
const SHOULDER = CAMERA.shoulder;
const CAM_HEIGHT = CAMERA.height;

// Reads keyboard/mouse input, moves the player, drives the over-the-shoulder camera and fires
export class PlayerControls {
  constructor(game, fighter) {
    this.game = game;
    this.f = fighter;
    this.camera = game.camera;
    this.keys = new Set();
    this.mouseDown = false;
    this.fireQueued = false;
    this.scoped = false;
    this.fov = BASE_FOV;
    this.tmp = new THREE.Vector3();
    this.orbit = false;      // Alt held: free camera around the character
    this.orbitYaw = 0;
    this.orbitPitch = 0.15;

    this.onKeyDown = e => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'AltLeft' || e.code === 'AltRight') {
        e.preventDefault();
        if (!this.orbit) { this.orbit = true; this.orbitYaw = 0; this.orbitPitch = 0.15; }
      }
      const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (e.code === 'Space') e.preventDefault();
      if (this.f.emote && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) this.f.emote = null;   // a fresh move key ends the dance
      if (e.code === 'KeyF') toggleFullscreen();
      if (e.code === 'KeyH' && this.game.canAct && !this.f.dead && !this.f.emote) this.startEmote();
      // Weapons can be changed freely during the countdown too
      if (idx >= 0 && this.game.canSwitch && !this.f.dead) this.switchWeapon(WEAPON_ORDER[idx]);
      if (e.code === 'Space' && this.game.canAct) { this.f.emote = null; if (this.f.jump(JUMP_SPEED)) sfx.jump(); }
      if (e.code === 'KeyR' && this.game.canAct && !this.f.dead && this.f.startReload()) { sfx.reload(); this.setScope(false); }
    };
    this.onKeyUp = e => {
      this.keys.delete(e.code);
      if (e.code === 'AltLeft' || e.code === 'AltRight') this.orbit = false;
    };
    this.onBlur = () => { this.orbit = false; this.keys.clear(); };
    this.onMouseMove = e => {
      if (document.pointerLockElement !== this.game.canvas) return;
      const sens = PLAYER.sensitivity * settings.sensitivity;
      if (this.orbit) {
        this.orbitYaw -= e.movementX * sens * 1.4;
        this.orbitPitch = clamp(this.orbitPitch + e.movementY * sens, -0.5, 1.2);
        return;
      }
      if (this.f.dead) return;   // a dead fighter cannot turn
      const k = sens * (this.scoped ? this.fov / BASE_FOV : 1);
      this.f.yaw -= e.movementX * k;
      this.f.pitch = clamp(this.f.pitch - e.movementY * k, -1.2, 1.2);
    };
    this.onMouseDown = e => {
      if (document.pointerLockElement !== this.game.canvas) return;
      if (e.button === 0) { this.mouseDown = true; this.fireQueued = true; }
      if (e.button === 2 && this.game.canAct && !this.f.dead) this.setScope(!this.scoped);
    };
    this.onMouseUp = e => { if (e.button === 0) this.mouseDown = false; };
    this.onContextMenu = e => e.preventDefault();

    addEventListener('keydown', this.onKeyDown);
    addEventListener('keyup', this.onKeyUp);
    addEventListener('blur', this.onBlur);
    addEventListener('mousemove', this.onMouseMove);
    addEventListener('mousedown', this.onMouseDown);
    addEventListener('mouseup', this.onMouseUp);
    addEventListener('contextmenu', this.onContextMenu);
  }

  dispose() {
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
    removeEventListener('blur', this.onBlur);
    removeEventListener('mousemove', this.onMouseMove);
    removeEventListener('mousedown', this.onMouseDown);
    removeEventListener('mouseup', this.onMouseUp);
    removeEventListener('contextmenu', this.onContextMenu);
  }

  setScope(on) {
    if (on && (!this.f.weapon.scoped || this.f.reloading || this.f.dead)) return;
    if (on !== this.scoped) sfx.switch();
    this.scoped = on;
    this.game.hud.setScope(on);
  }

  // Random dance from the character's list (the camera stays where it is)
  startEmote() {
    const list = EMOTES[this.f.def.id] ?? EMOTES.default;
    this.f.emote = { ...list[Math.floor(Math.random() * list.length)], t: 0, id: performance.now() };   // id lets the friend tell dances apart
    this.setScope(false);
  }

  switchWeapon(id) {
    if (this.f.setWeapon(id)) {
      sfx.switch();
      this.setScope(false);
      this.game.hud.showWeapon(id);
    }
  }

  // Direction the crosshair points to, including recoil kick
  aimDir(out = new THREE.Vector3()) {
    const p = this.f.pitch + this.f.kick, y = this.f.yaw;
    return out.set(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
  }

  update(dt, canAct) {
    const f = this.f;
    if (!f.dead && canAct && !f.emote) {
      // Movement relative to the facing direction
      const fa = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
      const ra = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
      const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
      let vx = fx * fa - fz * ra, vz = fz * fa + fx * ra;
      const len = Math.hypot(vx, vz);
      f.moving = len > 0;
      if (len > 0) {
        const speed = this.scoped ? SCOPED_SPEED : WALK_SPEED;
        f.move((vx / len) * speed * dt, (vz / len) * speed * dt, this.game.arena.colliders);
      }
    } else {
      f.moving = false;
    }

    f.root.rotation.y = f.yaw;
    this.updateCamera(dt);

    // Shooting
    const w = f.weapon;
    let wantFire = w.auto ? this.mouseDown : this.fireQueued;
    // While dancing, held keys/buttons are ignored; a fresh click ends the dance
    if (f.emote) { if (this.fireQueued) f.emote = null; wantFire = false; }
    this.fireQueued = false;
    if (wantFire && canAct && !f.dead) {
      if (f.ammoNow <= 0) {
        if (f.startReload()) { sfx.reload(); this.setScope(false); } else sfx.empty();
      } else if (f.canFire()) {
        this.shoot();
      }
    }
    if (canAct && f.ammoNow <= 0 && !f.reloading && !f.dead) { f.startReload(); sfx.reload(); this.setScope(false); }
  }

  shoot() {
    const f = this.f, w = f.weapon;
    let spread = w.scoped ? (this.scoped ? w.scoped.spread : w.spread) : w.spread + f.bloom;
    // Scoped AWP is pinpoint (quick scope); everything else loses only a hair of accuracy while moving
    if (f.moving && !(w.scoped && this.scoped)) spread += w.scoped ? PLAYER.moveSpreadAwp : PLAYER.moveSpread;
    if (!f.onGround) spread += PLAYER.airSpread;   // jump shots are inaccurate

    const dir = this.aimDir();
    const right = this.tmp.set(-dir.z, 0, dir.x).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
    dir.addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();

    f.consumeShot();
    f.kick += w.recoil;
    this.game.fire(f, this.orbit ? f.headPos() : this.camera.position, dir);
  }

  updateCamera(dt) {
    const f = this.f, cam = this.camera;
    const dir = this.aimDir();
    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const pivot = new THREE.Vector3(f.pos.x, CAM_HEIGHT + f.pos.y, f.pos.z);

    // Smooth zoom toward the target field of view
    const targetFov = this.scoped ? f.weapon.scoped.fov : BASE_FOV;
    this.fov += (targetFov - this.fov) * Math.min(1, dt * ZOOM_RATE);
    cam.fov = this.fov;
    cam.updateProjectionMatrix();

    f.rig.root.visible = !(this.scoped && this.fov < 30) || this.orbit;

    if (this.orbit) {
      // Orbit around the character to look at the model
      const c = new THREE.Vector3(f.pos.x, f.pos.y + 1.0, f.pos.z);
      const a = f.yaw + Math.PI + this.orbitYaw, r = CAMERA.orbitDistance;
      const hz = Math.cos(this.orbitPitch) * r;
      const off = new THREE.Vector3(Math.sin(a) * hz, Math.sin(this.orbitPitch) * r, Math.cos(a) * hz);
      // Pull the camera in when a wall or cover is in the way
      this.game.raycaster.set(c, off.clone().normalize());
      this.game.raycaster.far = r;
      const hit = this.game.raycaster.intersectObjects(this.game.arena.blockers, false)[0];
      if (hit) off.setLength(Math.max(0.5, hit.distance - 0.3));
      cam.position.copy(c).add(off);
      cam.lookAt(c);
      return;
    }
    if (this.scoped) {
      cam.position.copy(pivot).addScaledVector(dir, 0.35);
    } else {
      // Boom behind the shoulder, shortened if it would clip into cover
      const origin = pivot.clone().addScaledVector(right, SHOULDER);
      const back = dir.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0.08, 0)).normalize();
      this.game.raycaster.set(origin, back);
      this.game.raycaster.far = CAM_DISTANCE;
      const hit = this.game.raycaster.intersectObjects(this.game.arena.blockers, false)[0];
      const d = hit ? Math.max(0.4, hit.distance - 0.25) : CAM_DISTANCE;
      cam.position.copy(origin).addScaledVector(back, d);
    }
    cam.lookAt(this.tmp.copy(cam.position).add(dir));
  }
}
