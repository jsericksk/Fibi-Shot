import { clamp, isTouch } from '../utils.js';
import { settings } from '../settings.js';
import { CAMERA, PLAYER, SPECTATOR } from '../config.js';

// Stands in for PlayerControls in CPU vs CPU: a free camera high above the arena that pans, turns and rises
export class SpectatorControls {
  constructor(game) {
    this.game = game;
    this.camera = game.camera;
    this.camera.fov = CAMERA.fov;   // a scoped player left it zoomed
    this.camera.updateProjectionMatrix();
    this.keys = new Set();
    this.fingers = new Map();   // touch: pointer id -> position, two of them make a pinch
    this.gesture = null;        // what the two fingers are doing: zoom | turn | tilt, decided once they start moving
    this.gestureSum = { zoom: 0, turn: 0, tilt: 0 };
    this.scoped = false;      // the bots read these two from the controls of a player
    this.mouseDown = false;
    this.pos = { x: 0, z: 0 };
    this.height = SPECTATOR.startHeight;
    this.yaw = 0;
    this.pitch = SPECTATOR.startPitch;

    this.onKeyDown = e => { if (!e.repeat) this.keys.add(e.code); };
    this.onKeyUp = e => this.keys.delete(e.code);
    this.onBlur = () => this.keys.clear();
    this.onMouseMove = e => {
      if (document.pointerLockElement === game.canvas) this.look(e.movementX, e.movementY);
    };
    this.onWheel = e => this.rise(e.deltaY * SPECTATOR.wheelStep * this.height);
    this.onPointerDown = e => { this.fingers.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.endGesture(); };
    this.onPointerMove = e => this.touchMove(e);
    this.onPointerUp = e => { this.fingers.delete(e.pointerId); this.endGesture(); };

    addEventListener('keydown', this.onKeyDown);
    addEventListener('keyup', this.onKeyUp);
    addEventListener('blur', this.onBlur);
    addEventListener('mousemove', this.onMouseMove);
    addEventListener('wheel', this.onWheel);
    if (isTouch) {
      addEventListener('pointerdown', this.onPointerDown);
      addEventListener('pointermove', this.onPointerMove);
      addEventListener('pointerup', this.onPointerUp);
      addEventListener('pointercancel', this.onPointerUp);
    }
  }

  dispose() {
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('keyup', this.onKeyUp);
    removeEventListener('blur', this.onBlur);
    removeEventListener('mousemove', this.onMouseMove);
    removeEventListener('wheel', this.onWheel);
    removeEventListener('pointerdown', this.onPointerDown);
    removeEventListener('pointermove', this.onPointerMove);
    removeEventListener('pointerup', this.onPointerUp);
    removeEventListener('pointercancel', this.onPointerUp);
  }

  // One finger drags the map along. Two fingers do one thing at a time, whichever they start with: spreading apart
  // zooms in (lower), twisting turns the view and sliding both up or down tilts it
  touchMove(e) {
    const finger = this.fingers.get(e.pointerId);
    if (!finger) return;
    const pinching = this.fingers.size === 2;
    const before = pinching ? this.fingerPair() : null;
    const dx = e.clientX - finger.x, dy = e.clientY - finger.y;
    finger.x = e.clientX;
    finger.y = e.clientY;
    if (!pinching) return this.pan(-dx * SPECTATOR.dragStep * this.height, dy * SPECTATOR.dragStep * this.height);

    const now = this.fingerPair();
    const turn = Math.atan2(Math.sin(now.angle - before.angle), Math.cos(now.angle - before.angle));   // the short way round
    const change = { zoom: now.gap - before.gap, turn, tilt: now.midY - before.midY };
    if (!this.gesture) this.chooseGesture(change, now.gap);
    if (this.gesture === 'zoom') this.rise(-change.zoom * SPECTATOR.pinchStep * this.height);
    else if (this.gesture === 'turn') this.yaw += change.turn;
    else if (this.gesture === 'tilt') this.pitch = clamp(this.pitch - change.tilt * SPECTATOR.tiltStep, ...SPECTATOR.pitchRange);
  }

  // Adds up the movement in pixels (a turn counts as the arc one finger travels) until one kind clearly leads
  chooseGesture(change, gap) {
    const sum = this.gestureSum;
    sum.zoom += change.zoom;
    sum.turn += change.turn * gap / 2;
    sum.tilt += change.tilt;
    const [kind, px] = Object.entries(sum).map(([k, v]) => [k, Math.abs(v)]).sort((a, b) => b[1] - a[1])[0];
    if (px >= SPECTATOR.gestureLockPx) this.gesture = kind;
  }

  endGesture() {
    this.gesture = null;
    this.gestureSum = { zoom: 0, turn: 0, tilt: 0 };
  }

  // Distance, angle and middle height of the two fingers on the screen
  fingerPair() {
    const [a, b] = this.fingers.values();
    return { gap: Math.hypot(a.x - b.x, a.y - b.y), angle: Math.atan2(b.y - a.y, b.x - a.x), midY: (a.y + b.y) / 2 };
  }

  // Moves the camera over the ground, relative to where it looks (meters)
  pan(right, forward) {
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const lim = this.game.arena.half * 2;   // stays around the map, the scenery is not worth flying to
    this.pos.x = clamp(this.pos.x + fx * forward - fz * right, -lim, lim);
    this.pos.z = clamp(this.pos.z + fz * forward + fx * right, -lim, lim);
  }

  // dx/dy: mouse movement in pixels (a touch drag pans instead of turning)
  look(dx, dy) {
    if (isTouch) return;
    const sens = PLAYER.sensitivity * settings.sensitivity;
    this.yaw -= dx * sens;
    this.pitch = clamp(this.pitch - dy * sens, ...SPECTATOR.pitchRange);
  }

  setScope() {}   // no scope to close when a match ends

  rise(meters) {
    this.height = clamp(this.height + meters, ...SPECTATOR.heightRange);
  }

  update(dt) {
    const axis = (plus, minus) => (this.keys.has(plus) ? 1 : 0) - (this.keys.has(minus) ? 1 : 0);
    const fa = axis('KeyW', 'KeyS'), ra = axis('KeyD', 'KeyA');
    const speed = SPECTATOR.moveSpeed * this.height * dt;
    this.pan(ra * speed, fa * speed);
    this.rise((axis('Space', 'ShiftLeft') + axis('KeyE', 'KeyQ')) * SPECTATOR.riseSpeed * dt);

    // Looks along the view direction from above the point it is panned to
    const cp = Math.cos(this.pitch);
    const eye = this.camera.position.set(this.pos.x, this.height, this.pos.z);
    this.camera.lookAt(eye.x + Math.sin(this.yaw) * cp, eye.y + Math.sin(this.pitch), eye.z + Math.cos(this.yaw) * cp);
  }
}
