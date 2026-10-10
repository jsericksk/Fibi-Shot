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

// Snowy mountains in a ring, pine woods beyond the walls and an aurora over the far side (-Z)
function addSnow(scene, half) {
  addGround(scene, 0xf4f8fc);
  const m = new THREE.Matrix4(), color = new THREE.Color();

  const count = 16, rock = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 10), M(0xffffff), count);
  const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 10), M(0xf6fafe), count);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(-0.12, 0.12), r = rand(130, 210), w = rand(35, 70), h = rand(45, 95);
    const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
    rock.setMatrixAt(i, m.makeScale(w, h, w).setPosition(x, h / 2, z));
    rock.setColorAt(i, color.setHSL(rand(0.58, 0.62), 0.15, rand(0.45, 0.55)));
    caps.setMatrixAt(i, m.makeScale(w * 0.46, h * 0.44, w * 0.46).setPosition(x, h * 0.78, z));   // the white tip: a hair wider than the rock under it, so the two surfaces do not flicker
  }
  scene.add(rock, caps);

  const pines = 70, inner = half + 4;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.45, 2.5, 8), M(0x5a3c25), pines);
  const needles = new THREE.InstancedMesh(new THREE.ConeGeometry(2.2, 6.5, 8), M(0xffffff), pines);
  for (let i = 0; i < pines; i++) {
    let x, z;
    do { x = rand(-inner - 70, inner + 70); z = rand(-inner - 70, inner + 70); } while (Math.max(Math.abs(x), Math.abs(z)) < inner);
    const k = rand(0.8, 1.6);
    trunks.setMatrixAt(i, m.makeScale(k, k, k).setPosition(x, 1.25 * k, z));
    needles.setMatrixAt(i, m.makeScale(k, k, k).setPosition(x, 5.5 * k, z));
    needles.setColorAt(i, color.setHSL(rand(0.38, 0.42), 0.4, rand(0.2, 0.3)).lerp(new THREE.Color(0xf4f8fc), rand(0.25, 0.5)));   // green needles under a coat of snow
  }
  scene.add(trunks, needles);

  // Aurora: wavy translucent ribbons high above the far mountains, fading out at every edge
  const fade = document.createElement('canvas');
  fade.width = 256; fade.height = 64;
  const g = fade.getContext('2d');
  const vertical = g.createLinearGradient(0, 0, 0, 64);
  vertical.addColorStop(0, 'rgba(255,255,255,0)'); vertical.addColorStop(0.55, 'rgba(255,255,255,1)'); vertical.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = vertical; g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = 'destination-in';
  const horizontal = g.createLinearGradient(0, 0, 256, 0);
  horizontal.addColorStop(0, 'rgba(0,0,0,0)'); horizontal.addColorStop(0.25, 'rgba(0,0,0,1)'); horizontal.addColorStop(0.75, 'rgba(0,0,0,1)'); horizontal.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = horizontal; g.fillRect(0, 0, 256, 64);
  const fadeTex = new THREE.CanvasTexture(fade);
  for (const [hex, y, offset] of [[0x4dffb0, 90, 0], [0x5ac8ff, 108, 1.7], [0xb06aff, 126, 3.1]]) {
    const geo = new THREE.PlaneGeometry(380, 46, 40, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + Math.sin(pos.getX(i) * 0.03 + offset) * 14);
    const ribbon = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: hex, map: fadeTex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    ribbon.position.set(0, y, -190);
    scene.add(ribbon);
  }
}

export const BACKDROPS = { rio: addRio, mars: addMars, snow: addSnow };
