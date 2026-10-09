import * as THREE from 'three';
import { DOOMSDAY, WORLD } from '../config.js';
import { sfx } from '../audio.js';
import { rand } from '../utils.js';

const TOTAL = DOOMSDAY.warnSeconds + DOOMSDAY.shockSeconds;
const fireMaterial = color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });

// Moon easter egg: a nuke goes off on the Earth and its blast sweeps across the sky to the Moon
export class Doomsday {
  constructor(scene, earth, hud) {
    this.hud = hud;
    this.earth = earth;
    this.radius = earth.geometry.parameters.radius;
    this.reach = earth.position.length() + WORLD.arenaHalf;   // the blast has crossed the whole arena by then
    this.t = 0;
    this.done = false;

    // The fireball rises on the side of the Earth that faces the Moon
    const toMoon = earth.position.clone().negate().normalize();
    this.fireball = new THREE.Group();
    this.fireball.position.copy(earth.position).addScaledVector(toMoon, this.radius * 0.6);
    this.fireball.add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fireMaterial(0xff6a14)));
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), fireMaterial(0xfff0b0));
    this.fireball.add(this.core);
    this.shock = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), fireMaterial(0xffb060));
    this.shock.position.copy(earth.position);
    this.shock.material.side = THREE.DoubleSide;
    // Mushroom cloud: a stem and a flat cap with a rolling ring, rising from the same spot
    this.mushroom = new THREE.Group();
    this.mushroom.position.copy(this.fireball.position);
    const stemGeo = new THREE.CylinderGeometry(0.6, 1, 1, 16).translate(0, 0.5, 0);
    this.stem = new THREE.Mesh(stemGeo, fireMaterial(0xd2531a));
    this.cap = new THREE.Group();
    this.cap.add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fireMaterial(0xff8a2a)));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.35, 12, 32), fireMaterial(0xffc060));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.2;
    this.cap.add(ring);
    this.mushroom.add(this.stem, this.cap);

    this.debris = this.makeDebris();
    scene.add(this.fireball, this.shock, this.mushroom, this.debris);
    this.update(0);

    sfx.nuke(DOOMSDAY.volume);
  }

  // Chunks of Earth that stay hidden until it breaks apart
  makeDebris() {
    const group = new THREE.Group();
    group.visible = false;
    for (let i = 0; i < DOOMSDAY.debrisCount; i++) {
      const chunk = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), this.earth.material);
      const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      chunk.position.copy(this.earth.position).addScaledVector(dir, this.radius * rand(0.2, 0.8));
      chunk.scale.set(rand(0.6, 1.2), rand(0.6, 1.2), rand(0.6, 1.2)).multiplyScalar(this.radius * rand(0.2, 0.4));
      chunk.userData = { dir, spin: new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(-2, 2)), from: chunk.position.clone() };
      group.add(chunk);
    }
    return group;
  }

  // 0 at the explosion, 1 when the blast reaches the Moon and the match ends
  get progress() { return this.t / TOTAL; }

  update(dt) {
    this.t = Math.min(TOTAL, this.t + dt);
    const p = this.progress;
    const size = this.radius * DOOMSDAY.fireballScale * Math.sqrt(p);
    this.fireball.scale.setScalar(Math.max(size, 0.01));
    this.shock.scale.setScalar(this.radius + (this.reach - this.radius) * p);
    this.shock.material.opacity = 0.01 + 0.05 * p;
    this.growMushroom(Math.min(1, this.t / DOOMSDAY.warnSeconds));
    this.breakEarth(Math.max(0, (this.t - DOOMSDAY.warnSeconds) / DOOMSDAY.shockSeconds));
    this.hud.setDoomFlash(this.flash());
    this.done = this.t >= TOTAL;
  }

  // k: 0..1 over the warning time. Fast at first, then slowing down like a real cloud
  growMushroom(k) {
    const height = this.radius * DOOMSDAY.mushroomHeight * (1 - (1 - k) ** 2);
    this.stem.scale.set(this.radius * 0.25, height, this.radius * 0.25);
    this.cap.position.y = height;
    const capRadius = this.radius * 0.15 + height * 0.3;
    this.cap.scale.set(capRadius, capRadius * 0.6, capRadius);
  }

  // k: 0 while the Earth is whole, then 0..1 as its pieces fly apart
  breakEarth(k) {
    this.earth.visible = k === 0;
    this.debris.visible = k > 0;
    for (const chunk of this.debris.children) {
      const { dir, spin, from } = chunk.userData;
      chunk.position.copy(from).addScaledVector(dir, this.radius * DOOMSDAY.debrisSpread * k);
      chunk.rotation.set(spin.x * k, spin.y * k, spin.z * k);
    }
  }

  // Screen whiteness: a flash at the explosion and a whiteout as the blast arrives
  flash() {
    const blast = Math.max(0, 1 - this.t / DOOMSDAY.blastFlashSeconds);
    const whiteout = Math.max(0, 1 - (TOTAL - this.t) / DOOMSDAY.whiteoutSeconds);
    return Math.max(blast * 0.8, whiteout);
  }

  // Rumble that gets stronger as the blast gets closer
  shake(camera) {
    if (this.done) return;
    const k = DOOMSDAY.shake * this.progress ** 2;
    camera.position.add(new THREE.Vector3(rand(-k, k), rand(-k, k), rand(-k, k)));
  }

  // The result screen reveals the world through the white
  fadeOut() {
    this.hud.setDoomFlash(0, DOOMSDAY.resultFadeSeconds);
  }
}
