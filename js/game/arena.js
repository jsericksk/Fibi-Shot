import * as THREE from 'three';
import { M, add, sphere, rand } from '../utils.js';
import { WORLD } from '../config.js';


const glow = color => M(color, { emissive: color, emissiveIntensity: 1.2 });

// Dark tiled floor with thin red grid lines
function tilesFloor(half) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#17121a'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#1e171f'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  g.fillStyle = '#5a1119'; g.fillRect(0, 0, 128, 2); g.fillRect(0, 0, 2, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(half / 2, half / 2);
  return { tex, roughness: 0.7, metalness: 0.2 };
}

// Grey lunar dust with speckles and craters (one texture for the whole floor)
function moonFloor() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#8a8a92'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) {
    const v = 90 + Math.random() * 90;
    g.fillStyle = `rgba(${v},${v},${v + 6},0.35)`;
    g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }
  for (let i = 0; i < 38; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 14 + Math.random() * 60;
    const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, 'rgba(50,50,58,0.75)');
    grad.addColorStop(0.8, 'rgba(70,70,78,0.5)');
    grad.addColorStop(0.92, 'rgba(190,190,200,0.55)');
    grad.addColorStop(1, 'rgba(140,140,150,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return { tex, roughness: 1, metalness: 0 };
}

// Short grass with lighter and darker blades, tiled
function grassFloor(half) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#4f9a3c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    const v = Math.random();
    g.fillStyle = v < 0.5 ? 'rgba(40,110,40,0.5)' : 'rgba(130,200,80,0.45)';
    g.fillRect(Math.random() * S, Math.random() * S, 2, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(half / 5, half / 5);
  return { tex, roughness: 1, metalness: 0 };
}

// Warehouse concrete with stains and a yellow dashed lane down the middle (one texture for the whole floor)
function concreteFloor() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#8b8d8e'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 7000; i++) {
    const v = 100 + Math.random() * 70;
    g.fillStyle = `rgba(${v},${v},${v},0.3)`;
    g.fillRect(Math.random() * S, Math.random() * S, 3, 3);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 20 + Math.random() * 70;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(60,62,64,0.35)');
    grad.addColorStop(1, 'rgba(60,62,64,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.fillStyle = '#d6b92e';
  for (let y = 12; y < S; y += 96) g.fillRect(S / 2 - 7, y, 14, 52);
  return { tex: new THREE.CanvasTexture(c), roughness: 0.9, metalness: 0.05 };
}

// Terracotta hexagon pavers (the hexagons are squashed a bit so the pattern tiles exactly in the square texture)
function paversFloor(half) {
  const S = 256, W = 32, ROW = 32, RY = ROW * 2 / 3;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#a8704f'; g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(70,40,28,0.55)';
  g.lineWidth = 1.5;
  for (let row = -1; row <= S / ROW; row++) {
    for (let col = -1; col <= S / W; col++) {
      const cx = col * W + (row % 2 ? W / 2 : 0), cy = row * ROW;
      g.beginPath();
      [[0, -RY], [W / 2, -RY / 2], [W / 2, RY / 2], [0, RY], [-W / 2, RY / 2], [-W / 2, -RY / 2]].forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo'](cx + x, cy + y));
      g.closePath();
      g.fillStyle = `hsl(${18 + Math.random() * 6},${42 + Math.random() * 8}%,${48 + Math.random() * 9}%)`;
      g.fill();
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(half / 2, half / 2);
  tex.anisotropy = 4;
  return { tex, roughness: 0.95, metalness: 0 };
}

const FLOORS = { tiles: tilesFloor, moon: moonFloor, grass: grassFloor, concrete: concreteFloor, pavers: paversFloor };

// Trees all around the playable area, beyond the walls (instanced: two draw calls for the whole forest)
function addForest(scene, { count, spread }, half) {
  const inner = half + 4;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 8), M(0x6b4a2b), count);
  const leaves = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 6, 8), M(0xffffff), count);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    let x, z;
    do { x = rand(-inner - spread, inner + spread); z = rand(-inner - spread, inner + spread); } while (Math.max(Math.abs(x), Math.abs(z)) < inner);
    const k = rand(0.8, 1.7);
    trunks.setMatrixAt(i, m.makeScale(k, k, k).setPosition(x, 1.5 * k, z));
    leaves.setMatrixAt(i, m.makeScale(k, k, k).setPosition(x, 6 * k, z));
    leaves.setColorAt(i, color.setHSL(rand(0.26, 0.36), 0.55, rand(0.26, 0.4)));
  }
  scene.add(trunks, leaves);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x3f8a35, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);
}

// Two rows of small houses beyond the walls on every side, on dirt ground (instanced: two draw calls for the whole town)
const HOUSE_COLORS = [0xe9dcc0, 0xf1d9a8, 0xe8b9a8, 0xc9dcc0, 0xf4efe4, 0xd9c2a4];
function addTown(scene, { ground }, half) {
  const spots = [];
  for (let row = 0; row < 2; row++) {
    const offset = half + 6 + row * 10;
    for (let along = -half - 14; along <= half + 14; along += 9) {
      for (const [x, z] of [[along, offset], [along, -offset], [offset, along], [-offset, along]]) {
        spots.push([x + rand(-1.5, 1.5), z + rand(-1.5, 1.5), rand(5, 7), rand(5, 7), rand(3.6, 4.8)]);
      }
    }
  }
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M(0xffffff), spots.length);
  const roofGeo = new THREE.ConeGeometry(1, 1, 4);
  roofGeo.rotateY(Math.PI / 4);   // square roof with its sides facing the house walls
  const roofs = new THREE.InstancedMesh(roofGeo, M(0xb5502f), spots.length);
  const m = new THREE.Matrix4(), color = new THREE.Color();
  spots.forEach(([x, z, w, d, h], i) => {
    const roofH = rand(1.4, 2);
    bodies.setMatrixAt(i, m.makeScale(w, h, d).setPosition(x, h / 2, z));
    bodies.setColorAt(i, color.set(HOUSE_COLORS[Math.floor(rand(0, HOUSE_COLORS.length))]));
    roofs.setMatrixAt(i, m.makeScale(w * 0.78, roofH, d * 0.78).setPosition(x, h + roofH / 2, z));
  });
  scene.add(bodies, roofs);

  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: ground, roughness: 1 }));
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = -0.05;
  dirt.receiveShadow = true;
  scene.add(dirt);
}

// Asphalt strip across the map with a dashed white center line (flat, so it never blocks anyone)
function addRoad(scene, { z, width, color }, half) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, width), M(color, { roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, z);
  road.receiveShadow = true;
  scene.add(road);
  const dash = new THREE.PlaneGeometry(2, 0.2);
  for (let x = -half + 2; x < half; x += 4) {
    const line = new THREE.Mesh(dash, M(0xf2f2f2, { roughness: 1 }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.02, z);
    scene.add(line);
  }
}

// Roof of an indoor map: dark ceiling, beams and glowing light panels over each light
function addCeiling(scene, map, blockers, half) {
  const { height, color } = map.ceiling;
  const spread = half / WORLD.designHalf;
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(half * 2 + 1.2, half * 2 + 1.2), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }));
  roof.rotation.x = Math.PI / 2;
  roof.position.y = height;
  scene.add(roof);
  blockers.push(roof);
  for (const z of [-20 * spread, 0, 20 * spread]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 0.4, 0.5), M(0x2a2018));
    beam.position.set(0, height - 0.25, z);
    scene.add(beam);
  }
  for (const [x, z] of map.lights.at) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.1), glow(0xfff6e0));
    panel.position.set(x * spread, height - 0.1, z * spread);
    scene.add(panel);
  }
}

// A sun disc with a soft glow, high in the sky where the light comes from (fog does not affect it)
function addSunDisc(scene, { pos }) {
  const dir = new THREE.Vector3(...pos).normalize().multiplyScalar(200);
  const disc = (radius, opacity) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff4c8, transparent: opacity < 1, opacity, depthWrite: false, fog: false }));
    mesh.position.copy(dir);
    scene.add(mesh);
  };
  disc(9, 1);
  disc(15, 0.25);
}

// Stars and a distant Earth for space maps (fog does not affect them). Returns the Earth mesh
function addSpace(scene) {
  const pts = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.02, Math.random() - 0.5).normalize().multiplyScalar(180);
    pts.push(v.x, v.y, v.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false })));

  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#2a63c9'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(60,150,80,0.9)' : 'rgba(255,255,255,0.7)';
    g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 30, 5 + Math.random() * 14, Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
  const earth = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), fog: false }));
  earth.position.set(-70, 55, -110);
  scene.add(earth);
  return earth;
}

// Builds floor, walls and cover for a map definition.
// Height of the highest cover top at (x, z) that is not above maxY (0 = the floor); margin widens the cover boxes
export function floorHeight(colliders, x, z, maxY, margin = 0) {
  let floor = 0;
  for (const c of colliders) {
    const inside = x > c.minX - margin && x < c.maxX + margin && z > c.minZ - margin && z < c.maxZ + margin;
    if (inside && c.h <= maxY && c.h > floor) floor = c.h;
  }
  return floor;
}

// blockers: meshes that stop bullets; colliders: 2D boxes that block movement
export function buildArena(scene, map) {
  const half = map.half ?? WORLD.arenaHalf;
  const spread = half / WORLD.designHalf;   // stretches the positions written in maps.js
  const blockers = [];
  const colliders = [];

  const f = FLOORS[map.floor](half);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.MeshStandardMaterial({ map: f.tex, roughness: f.roughness, metalness: f.metalness }));
  f.tex.colorSpace = THREE.SRGBColorSpace;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  blockers.push(floor);

  const wallMat = M(map.wall.color);
  const t = 0.6, h = map.wall.height ?? 3.5, len = half * 2 + t * 2;
  for (const [x, z, w, d] of [[0, half + t / 2, len, t], [0, -half - t / 2, len, t], [half + t / 2, 0, t, len], [-half - t / 2, 0, t, len]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = wall.receiveShadow = true;
    scene.add(wall);
    blockers.push(wall);
    if (!map.wall.stripe) continue;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.25, d + 0.02), glow(map.wall.stripe));
    stripe.position.set(x, h - 0.2, z);
    scene.add(stripe);
  }

  const cover = [
    ...map.center,
    ...map.quarter.flatMap(([x, z, w, d, ch, k]) => {
      const sx = x * spread, sz = z * spread;
      return [[sx, sz, w, d, ch, k], [-sx, sz, w, d, ch, k], [sx, -sz, w, d, ch, k], [-sx, -sz, w, d, ch, k]];
    }),
  ];
  for (const [x, z, w, d, ch, kind] of cover) {
    const { color, trim, split, crown } = map.kinds[kind];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, ch, d), M(color));
    mesh.position.set(x, ch / 2, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    const edgeColor = trim ?? 0x20202a;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: trim ? 0.55 : 0.4 })));
    // Stacked pair (e.g. two containers of different colors) and tree crowns (visual only)
    if (split) {
      // A hair taller and wider than the lower half, so the two top faces do not flicker (z-fighting)
      const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, ch / 2 + 0.02, d + 0.02), M(split));
      top.position.y = ch / 4 + 0.01;
      top.castShadow = true;
      mesh.add(top);
    }
    if (crown) {
      const r = Math.max(w, d) * 1.5;
      add(mesh, sphere, M(crown), [0, ch / 2 + r * 0.4, 0], [r, r * 0.8, r]);
    }
    // Glowing trim bands (visual only)
    if (trim) {
      const bands = kind === 'pillar' ? [0.9, 0.15] : kind === 'container' || kind === 'module' ? [0.5] : [0.97];
      for (const fr of bands) {
        const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, kind === 'pillar' ? 0.1 : 0.12, d + 0.04), glow(trim));
        band.position.y = (fr - 0.5) * ch;
        mesh.add(band);
      }
    }
    blockers.push(mesh);
    colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, h: ch });
  }

  if (map.lights) {
    const L = map.lights;
    for (const [x, z] of L.at) {
      const l = new THREE.PointLight(L.color, L.intensity, L.distance, 1.6);
      l.position.set(x * spread, L.y ?? 3, z * spread);
      scene.add(l);
    }
  }
  const earth = map.space ? addSpace(scene) : null;
  if (map.forest) addForest(scene, map.forest, half);
  if (map.ceiling) addCeiling(scene, map, blockers, half);
  if (map.road) addRoad(scene, map.road, half);
  if (map.town) addTown(scene, map.town, half);
  if (map.sunDisc) addSunDisc(scene, map.sun);

  // True when a circle of `margin` radius at (x, z) does not touch any cover
  const isFree = (x, z, margin = 1) =>
    colliders.every(c => x < c.minX - margin || x > c.maxX + margin || z < c.minZ - margin || z > c.maxZ + margin);

  return { blockers, colliders, isFree, earth, half };
}
