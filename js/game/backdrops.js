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

// Random spot in a square ring around the map center, at least rMin from the center on its nearest axis
// (the arena is square: a round ring would cut into its corners)
function ringPoint(rMin, rMax) {
  let x, z;
  do { x = rand(-rMax, rMax); z = rand(-rMax, rMax); } while (Math.max(Math.abs(x), Math.abs(z)) < rMin);
  return [x, z];
}

// Tall palm: a trunk with a crown of leaves
function addPalm(scene, x, z, k = 1) {
  add(scene, cyl, M(0x7a5a3a), [x, 3.5 * k, z], [0.5 * k, 7 * k, 0.5 * k]);
  add(scene, sphere, M(0x3f9a45), [x, 7.5 * k, z], [3 * k, 1.2 * k, 3 * k]);
}

// Round-crowned tree, k scales it
function addTree(scene, x, z, k) {
  add(scene, cyl, M(0x6b4a2b), [x, 1.5 * k, z], [0.6 * k, 3 * k, 0.6 * k]);
  add(scene, sphere, M(0x2f8a3a), [x, 5 * k, z], [2.6 * k, 2.8 * k, 2.6 * k]);
}

// Sandstone pyramids and low dunes around the oasis, with a few palms beyond the walls
function addDesert(scene, half) {
  addGround(scene, 0xdcb878);
  const pyramids = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4), M(0xd2a965), 7);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 7; i++) {
    const [x, z] = ringPoint(half + 75, 200), w = rand(25, 55), h = w * rand(0.8, 1);
    pyramids.setMatrixAt(i, m.makeRotationY(Math.PI / 4).scale(new THREE.Vector3(w, h, w)).setPosition(x, h / 2, z));
  }
  scene.add(pyramids);
  for (let i = 0; i < 14; i++) {
    const [x, z] = ringPoint(half + 70, 200);
    addHill(scene, [x, z, rand(30, 60), rand(6, 14), rand(25, 50)], 0xe2c283);
  }
  for (let i = 0; i < 12; i++) {
    const [x, z] = ringPoint(half + 6, half + 40);
    addPalm(scene, x, z, rand(0.9, 1.3));
  }
}

// A huge volcano with a glowing crater, jagged black ridges and pools of lava on the dark ground
function addVolcano(scene, half) {
  addGround(scene, 0x1a1412);
  add(scene, new THREE.ConeGeometry(1, 1, 24), M(0x2a2220), [-30, 40, -160], [110, 80, 70]);
  add(scene, new THREE.CylinderGeometry(1, 1, 1, 24), new THREE.MeshBasicMaterial({ color: 0xff7a22 }), [-30, 79, -160], [12, 3, 12]);   // unlit: the crater glows
  const count = 34, ridges = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5), M(0xffffff), count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, z] = ringPoint(half + 50, 210), w = rand(10, 26), h = rand(10, 34);
    ridges.setMatrixAt(i, m.makeScale(w, h, w).setPosition(x, h / 2, z));
    ridges.setColorAt(i, color.setHSL(rand(0.01, 0.06), 0.25, rand(0.1, 0.18)));
  }
  scene.add(ridges);
  for (let i = 0; i < 6; i++) {
    const [x, z] = ringPoint(half + 30, 160);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(rand(8, 18), 20), new THREE.MeshBasicMaterial({ color: 0xff6a1a }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, -0.03, z);
    scene.add(pool);
  }
}

// Night harbor: dark water all around, cargo ships anchored out in it and a lit lighthouse on the far side (-Z)
function addDocks(scene) {
  addGround(scene, 0x1d4468);
  for (const [x, z, len, rot] of [[-90, -110, 70, 0.2], [100, -140, 80, -0.15], [-150, 60, 60, Math.PI / 2], [140, 90, 66, Math.PI / 2 + 0.1]]) {
    const ship = new THREE.Group();
    ship.position.set(x, 0, z);
    ship.rotation.y = rot;
    scene.add(ship);
    add(ship, box, M(0x3a2a2a), [0, 3, 0], [len, 6, 14]);
    add(ship, box, M(0xe8e4dc), [-len * 0.35, 9, 0], [12, 8, 11]);
    for (let i = 0; i < 4; i++) add(ship, box, M([0xa83a2a, 0x2a5a96, 0x3a6a46, 0xc99a3a][i]), [-len * 0.1 + i * 9, 8, 0], [7, 4, 9]);
  }
  add(scene, cyl, M(0xf0ece4), [30, 18, -150], [4, 36, 4]);
  add(scene, sphere, new THREE.MeshBasicMaterial({ color: 0xffe9a0 }), [30, 38, -150], [3.5, 3.5, 3.5]);   // unlit: the lamp
  const lamp = new THREE.PointLight(0xffe9a0, 400, 120, 1.6);
  lamp.position.set(30, 38, -150);
  scene.add(lamp);
  for (let i = 0; i < 8; i++) {   // low hills of the far coast
    addHill(scene, [rand(-240, 240), -230, rand(40, 80), rand(10, 24), 30], 0x1b2a22);
  }
}

// Stone castle on a hill far ahead (-Z) with its towers, green hills and small woods around
function addCastle(scene, half) {
  addGround(scene, 0x5a9a48);
  const stone = M(0xb4aea0), roof = M(0x9a3a2a);
  const keep = new THREE.Group();
  keep.position.set(-30, 0, -150);
  keep.scale.setScalar(2);
  scene.add(keep);
  add(keep, box, stone, [0, 10, 0], [30, 20, 12]);
  for (const x of [-17, 17, 0]) {
    add(keep, cyl, stone, [x, x ? 13 : 20, x ? 4 : 0], [x ? 6 : 7, x ? 26 : 40, x ? 6 : 7]);
    add(keep, new THREE.ConeGeometry(1, 1, 12), roof, [x, x ? 28 : 43, x ? 4 : 0], [x ? 4.2 : 5, x ? 8 : 10, x ? 4.2 : 5]);
  }
  for (let i = 0; i < 12; i++) {
    const [x, z] = ringPoint(half + 90, 200);
    addHill(scene, [x, z, rand(45, 80), rand(14, 34), rand(40, 70)], 0x3f8a3a);
  }
  for (let i = 0; i < 26; i++) {
    const [x, z] = ringPoint(half + 8, half + 70);
    addTree(scene, x, z, rand(0.9, 1.5));
  }
}

// Dense jungle: a thick ring of trees beyond the walls, green hills and a mossy stepped temple far ahead (-Z)
function addJungle(scene, half) {
  addGround(scene, 0x2a5a2a);
  const count = 160;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.4, 0.6, 1, 8), M(0x5a3f26), count);
  const crowns = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), M(0xffffff), count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, z] = ringPoint(half + 6, half + 110), h = rand(9, 18), r = rand(3.5, 6);
    trunks.setMatrixAt(i, m.makeScale(1, h, 1).setPosition(x, h / 2, z));
    crowns.setMatrixAt(i, m.makeScale(r, r * 0.8, r).setPosition(x, h, z));
    crowns.setColorAt(i, color.setHSL(rand(0.27, 0.36), 0.55, rand(0.2, 0.32)));
  }
  scene.add(trunks, crowns);
  for (let i = 0; i < 8; i++) {
    const [x, z] = ringPoint(half + 100, 200);
    addHill(scene, [x, z, rand(50, 90), rand(25, 50), rand(45, 80)], 0x2f6f35);
  }
  const temple = new THREE.Group();
  temple.position.set(40, 0, -170);
  scene.add(temple);
  [[60, 10], [46, 10], [32, 10], [18, 10]].forEach(([w, h], i) => add(temple, box, M(i % 2 ? 0x7d8a6a : 0x8f9a7a), [0, 5 + i * 10, 0], [w, h, w]));
  add(temple, box, M(0x6b7a5a), [0, 44, 0], [10, 8, 10]);
}

// Window grid for tower faces: dark panes with a few lit ones (lit = list of CSS colors)
function windowTexture(base, lit) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let y = 4; y < 128; y += 16) {
    for (let x = 4; x < 128; x += 16) {
      g.fillStyle = Math.random() < 0.55 ? lit[Math.floor(Math.random() * lit.length)] : 'rgba(0,0,0,0.45)';
      g.fillRect(x, y, 9, 11);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Boxes with a window grid scattered in a ring around the map (instanced: one draw call)
function addBuildings(scene, half, { count, near, far, wMin, wMax, hMin, hMax, tint, tex }) {
  const material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const [x, z] = ringPoint(half + near, half + far), w = rand(wMin, wMax), d = rand(wMin, wMax), h = rand(hMin, hMax);
    buildings.setMatrixAt(i, m.makeScale(w, h, d).setPosition(x, h / 2, z));
    buildings.setColorAt(i, color.set(tint[Math.floor(rand(0, tint.length))]));
  }
  scene.add(buildings);
}

// Daytime city: a few far towers, small shops and houses closer in, and trees along the street
function addCity(scene, half) {
  addGround(scene, 0x56595e);
  const tex = windowTexture('#8aa4bd', ['#cfe4f5', '#e8f2fa']);
  addBuildings(scene, half, { count: 22, near: 70, far: 170, wMin: 14, wMax: 28, hMin: 30, hMax: 100, tint: [0xffffff, 0xe9e4d8, 0xcfd8e0, 0xe6d3c0], tex });
  addBuildings(scene, half, { count: 12, near: 14, far: 60, wMin: 8, wMax: 14, hMin: 5, hMax: 12, tint: [0xf0e4cc, 0xe8c9a8, 0xd9d4c8, 0xc9d8c4], tex });
  for (let i = 0; i < 24; i++) {
    const [x, z] = ringPoint(half + 6, half + 40);
    addTree(scene, x, z, rand(0.9, 1.4));
  }
}

// Amusement park: a ferris wheel and a row of coaster arches far ahead (-Z), striped circus tents around
function addPark(scene, half) {
  addGround(scene, 0x7ac060);
  const wheel = new THREE.Group();
  wheel.position.set(-35, 0, -150);
  scene.add(wheel);
  const frame = M(0xf6ecd8), colors = [0xff4a6a, 0x2a9ad8, 0xf2c230, 0x5acb6a];
  add(wheel, new THREE.TorusGeometry(40, 1.2, 8, 40), frame, [0, 46, 0], [1, 1, 1]);
  add(wheel, sphere, M(0xd8344a), [0, 46, 0], [4, 4, 4]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = Math.cos(a) * 40, y = 46 + Math.sin(a) * 40;
    const spoke = add(wheel, box, frame, [x / 2, 46 + (y - 46) / 2, 0], [40, 0.6, 0.6]);
    spoke.rotation.z = a;
    add(wheel, box, M(colors[i % colors.length]), [x, y - 3, 0], [5, 4, 4]);
  }
  for (const side of [-1, 1]) {
    const leg = add(wheel, box, frame, [side * 14, 23, 0], [1.6, 50, 1.6]);
    leg.rotation.z = -side * 0.3;
  }
  for (let i = 0; i < 9; i++) {
    add(scene, new THREE.TorusGeometry(14, 1.2, 8, 20, Math.PI), M(colors[i % colors.length]), [-100 + i * 24, 0, -120], [1, 1.3, 1]);
  }
  for (let i = 0; i < 9; i++) {
    const [x, z] = ringPoint(half + 20, half + 110), k = rand(0.9, 1.4), color = i % 2 ? 0xff4a6a : 0x2a9ad8;
    add(scene, cyl, M(0xf6ecd8), [x, 4 * k, z], [8 * k, 8 * k, 8 * k]);
    add(scene, new THREE.ConeGeometry(1, 1, 16), M(color), [x, 11 * k, z], [9 * k, 6 * k, 9 * k]);
  }
}

export const BACKDROPS = { rio: addRio, mars: addMars, snow: addSnow, desert: addDesert, volcano: addVolcano, docks: addDocks, castle: addCastle, jungle: addJungle, city: addCity, park: addPark };
