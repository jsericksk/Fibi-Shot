import * as THREE from 'three';
import { M, add, sphere, cyl, box, rand } from '../utils.js';

// Far scenery beyond the walls of a map (set `backdrop: 'name'` in maps.js). Everything stays inside the camera's far plane.

// Flat ground that reaches the horizon, just under the arena floor
function addGround(scene, color) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);
}

// A rounded hill: half of a stretched sphere sitting on the ground
const addHill = (scene, [x, z, rx, ry, rz], color) => add(scene, sphere, M(color), [x, 0, z], [rx, ry, rz]);

// Christ the Redeemer: pedestal, robe, outstretched arms and head, facing the arena (+Z)
function addChrist(scene, x, y, z) {
  const white = M(0xf1efe8);
  const statue = new THREE.Group();
  statue.position.set(x, y, z);
  statue.scale.setScalar(2);
  scene.add(statue);
  add(statue, box, white, [0, 1.5, 0], [4.5, 3, 4.5]);
  add(statue, cyl, white, [0, 7, 0], [1.4, 8, 1.4]);
  add(statue, box, white, [0, 10, 0], [15, 1.1, 1.1]);
  add(statue, sphere, white, [0, 11.8, 0], [1, 1.1, 1]);
}

// Apartment towers on both sides of the map (instanced: one draw call for the whole skyline)
const TOWER_COLORS = [0xf3ecd8, 0xe8d3b0, 0xd9e4ea, 0xf0c9b8, 0xe9e9e4, 0xc9d8c4];
function addSkyline(scene, half) {
  const count = 40;
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M(0xffffff), count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const w = rand(8, 14), d = rand(8, 14), h = rand(22, 60);
    const x = (i % 2 ? 1 : -1) * (half + rand(14, 60)), z = rand(-half * 0.4, half + 90);
    towers.setMatrixAt(i, m.makeScale(w, h, d).setPosition(x, h / 2, z));
    towers.setColorAt(i, color.set(TOWER_COLORS[Math.floor(rand(0, TOWER_COLORS.length))]));
  }
  scene.add(towers);
}

// Copacabana: Corcovado with the Christ far ahead (-Z), Sugarloaf beside it, towers on the sides and the sea behind (+Z)
function addRio(scene, half) {
  addGround(scene, 0xe6d9b0);   // sand
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 260), new THREE.MeshBasicMaterial({ color: 0x2f9be0 }));   // unlit: a lit flat plane looks gray at a grazing angle
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -0.03, half + 20 + 130);
  scene.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(90, 3), M(0xf4f8fa, { roughness: 1 }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, -0.02, half + 21.5);
  scene.add(foam);

  addSkyline(scene, half);
  addHill(scene, [-25, -185, 75, 62, 60], 0x2e7d46);   // Corcovado
  addChrist(scene, -25, 61, -182);
  addHill(scene, [95, -170, 30, 48, 28], 0x7b8a7a);    // Sugarloaf
  for (const hill of [[-120, -150, 55, 30, 40], [60, -215, 70, 38, 45], [-200, -60, 60, 40, 50], [200, -80, 60, 36, 50]]) addHill(scene, hill, 0x3a8248);
}

// Mars: Olympus Mons and a ring of jagged ridges on rust ground, with Phobos and Deimos in the sky
function addMars(scene) {
  addGround(scene, 0xa4552f);
  add(scene, new THREE.ConeGeometry(1, 1, 32), M(0x93482a), [-50, 22, -190], [110, 44, 90]);

  const count = 46;
  const ridges = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5), M(0xffffff), count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2), r = rand(100, 210), w = rand(10, 30), h = rand(8, 30);
    ridges.setMatrixAt(i, m.makeScale(w, h, w).setPosition(Math.cos(angle) * r, h / 2, Math.sin(angle) * r));
    ridges.setColorAt(i, color.setHSL(rand(0.03, 0.07), 0.5, rand(0.28, 0.4)));
  }
  scene.add(ridges);

  for (const [x, y, z, radius] of [[80, 70, -100, 5], [-110, 50, 60, 2.5]]) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), new THREE.MeshBasicMaterial({ color: 0x8a8580, fog: false }));
    moon.position.set(x, y, z);
    scene.add(moon);
  }
}

export const BACKDROPS = { rio: addRio, mars: addMars };
