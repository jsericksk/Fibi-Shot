import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const tracerGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
const flashGeo = new THREE.SphereGeometry(1, 8, 6);
const sparkGeo = new THREE.BoxGeometry(1, 1, 1);

// Short-lived visuals: bullet tracers, muzzle flashes and impact sparks
export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
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

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.vel) {
        it.vel.y -= 9 * dt;
        it.mesh.position.addScaledVector(it.vel, dt);
      }
      if (it.life <= 0) {
        this.scene.remove(it.mesh);
        it.mesh.material.dispose();
        this.items.splice(i, 1);
      } else if (it.fade) {
        it.mesh.material.opacity = it.life / it.max;
      }
    }
  }
}
