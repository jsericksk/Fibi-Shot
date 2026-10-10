import * as THREE from 'three';
import { WORLD, THROWN } from '../config.js';
import { rand } from '../utils.js';

const UP = new THREE.Vector3(0, 1, 0);
const tracerGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
const flashGeo = new THREE.SphereGeometry(1, 8, 6);
const sparkGeo = new THREE.BoxGeometry(1, 1, 1);

const box = new THREE.Box3();
const lowestY = obj => box.setFromObject(obj).min.y;

// Short-lived visuals: bullet tracers, muzzle flashes and impact sparks
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.thrown = [];   // weapons and hats thrown off fallen fighters
  }

  tracer(from, to, color = 0xfff1a8, width = 0.015, life = 0.09) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    if (len < 0.01) return;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false });
    const mesh = new THREE.Mesh(tracerGeo, mat);
    mesh.scale.set(width, len, width);
    mesh.position.copy(from).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    this.scene.add(mesh);
    this.items.push({ mesh, life, max: life, fade: true });
  }

  flash(pos, size = 0.22) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(flashGeo, mat);
    mesh.position.copy(pos);
    mesh.scale.setScalar(size);
    this.scene.add(mesh);
    this.items.push({ mesh, life: 0.05, max: 0.05, fade: true });
  }

  impact(point, color = 0xffe9a0) {
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(sparkGeo, mat);
      mesh.scale.setScalar(0.04);
      mesh.position.copy(point);
      this.scene.add(mesh);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3);
      this.items.push({ mesh, life: 0.35, max: 0.35, fade: true, vel });
    }
  }

  // Floating damage number above a target (white, bigger and gold on a headshot); `size` keeps it readable from afar
  damageNumber(pos, amount, headshot, size = 1) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.font = '900 46px sans-serif';
    g.textAlign = g.textBaseline = 'center';
    g.lineWidth = 8;
    g.strokeStyle = '#000';
    g.strokeText(Math.round(amount), 64, 34);
    g.fillStyle = headshot ? '#ffd23a' : '#fff';
    g.fillText(Math.round(amount), 64, 34);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false }));
    sprite.renderOrder = 10;
    sprite.scale.set((headshot ? 1.4 : 1.1) * size, (headshot ? 0.7 : 0.55) * size, 1);
    sprite.position.copy(pos).add(new THREE.Vector3(rand(-0.3, 0.3), 0.3, rand(-0.3, 0.3)));
    this.scene.add(sprite);
    this.items.push({ mesh: sprite, life: 0.9, max: 0.9, fade: true, float: 1.2 });
  }

  // Smoke puff that swells and fades (rocket trail)
  puff(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xb8b8c0, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(flashGeo, mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.items.push({ mesh, life: 0.7, max: 0.7, fade: true, alpha: 0.45, grow: [0.06, 0.28] });
  }

  // Fireball, bright core, sparks and smoke of a rocket blast
  explosion(pos, radius) {
    for (const [color, size, life] of [[0xff8a2a, radius * 0.8, 0.4], [0xfff0b0, radius * 0.5, 0.2]]) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      const mesh = new THREE.Mesh(flashGeo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.items.push({ mesh, life, max: life, fade: true, grow: [0.4, size] });
    }
    for (let i = 0; i < 3; i++) this.impact(pos, 0xffa040);
    for (let i = 0; i < 5; i++) this.puff(pos.clone().add(new THREE.Vector3(rand(-1, 1), rand(0, 1.2), rand(-1, 1))));
  }

  // Copies a part of a fighter (weapon, hat) into the scene and throws it: it tumbles, lands flat on whatever floorAt(x, z, y) says, then disappears
  throwOff(source, yaw, floorAt) {
    const mesh = source.clone(true);
    source.updateWorldMatrix(true, false);
    source.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
    this.scene.add(mesh);
    const vel = new THREE.Vector3(Math.sin(yaw) * THROWN.throwSpeed + rand(-0.8, 0.8), THROWN.upSpeed, Math.cos(yaw) * THROWN.throwSpeed + rand(-0.8, 0.8));
    const spin = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(THROWN.spin);
    this.thrown.push({ mesh, vel, spin, floorAt, life: THROWN.life, bounced: false });
  }

  updateThrown(dt) {
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const g = this.thrown[i], mesh = g.mesh;
      g.life -= dt;
      if (g.life <= 0) {
        this.scene.remove(mesh);   // geometry and materials are shared with the part it was copied from
        this.thrown.splice(i, 1);
        continue;
      }
      if (g.vel) {
        g.vel.y -= WORLD.gravity * dt;
        mesh.position.addScaledVector(g.vel, dt);
        mesh.rotation.x += g.spin.x * dt;
        mesh.rotation.y += g.spin.y * dt;
        mesh.rotation.z += g.spin.z * dt;
        // The floor under it right now: the ground, or the top of cover it is above
        const floor = g.floorAt(mesh.position.x, mesh.position.z, mesh.position.y + THROWN.coverReach);
        if (lowestY(mesh) <= floor) {
          if (g.bounced) g.vel = null;   // second landing: it stays on the floor
          else {
            g.bounced = true;
            mesh.rotation.x = mesh.rotation.z = 0;   // lands flat
            g.vel.y = -g.vel.y * THROWN.bounce;
            g.vel.x *= 0.4;
            g.vel.z *= 0.4;
            g.spin.set(0, g.spin.y * 0.4, 0);
          }
          mesh.position.y += floor - lowestY(mesh);
        }
      }
    }
  }

  update(dt) {
    this.updateThrown(dt);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.vel) {
        it.vel.y -= 9 * dt;
        it.mesh.position.addScaledVector(it.vel, dt);
      }
      if (it.float) it.mesh.position.y += it.float * dt;
      if (it.life <= 0) {
        this.scene.remove(it.mesh);
        it.mesh.material.map?.dispose();
        it.mesh.material.dispose();
        this.items.splice(i, 1);
      } else {
        const done = 1 - it.life / it.max;
        if (it.grow) it.mesh.scale.setScalar(it.grow[0] + (it.grow[1] - it.grow[0]) * done);
        if (it.fade) it.mesh.material.opacity = (it.alpha ?? 1) * (1 - done);
      }
    }
  }
}
