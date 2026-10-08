import * as THREE from 'three';
import { M, add, sphere, rand } from '../utils.js';
import { WORLD } from '../config.js';

export const ARENA_HALF = WORLD.arenaHalf;
const SPREAD = ARENA_HALF / WORLD.designHalf;   // stretches the positions written in maps.js

const glow = color => M(color, { emissive: color, emissiveIntensity: 1.2 });

// Dark tiled floor with thin red grid lines
function tilesFloor() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#17121a'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#1e171f'; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  g.fillStyle = '#5a1119'; g.fillRect(0, 0, 128, 2); g.fillRect(0, 0, 2, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ARENA_HALF / 2, ARENA_HALF / 2);
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
function grassFloor() {
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
  tex.repeat.set(ARENA_HALF / 5, ARENA_HALF / 5);
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

const FLOORS = { tiles: tilesFloor, moon: moonFloor, grass: grassFloor, concrete: concreteFloor };

// Trees all around the playable area, beyond the walls (instanced: two draw calls for the whole forest)
function addForest(scene, { count, spread }) {
  const inner = ARENA_HALF + 4;
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

// Roof of an indoor map: dark ceiling, beams and glowing light panels over each light
function addCeiling(scene, map, blockers) {
  const { height, color } = map.ceiling;
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_HALF * 2 + 1.2, ARENA_HALF * 2 + 1.2), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 1 }));
  roof.rotation.x = Math.PI / 2;
  roof.position.y = height;
  scene.add(roof);
  blockers.push(roof);
  for (const z of [-20 * SPREAD, 0, 20 * SPREAD]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ARENA_HALF * 2, 0.4, 0.5), M(0x2a2018));
    beam.position.set(0, height - 0.25, z);
    scene.add(beam);
  }
  for (const [x, z] of map.lights.at) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.1), glow(0xfff6e0));
    panel.position.set(x * SPREAD, height - 0.1, z * SPREAD);
    scene.add(panel);
  }
}

// Stars and a distant Earth for space maps (fog does not affect them)
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
}

// Builds floor, walls and cover for a map definition.
// blockers: meshes that stop bullets; colliders: 2D boxes that block movement
export function buildArena(scene, map) {
  const blockers = [];
  const colliders = [];

  const f = FLOORS[map.floor]();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2), new THREE.MeshStandardMaterial({ map: f.tex, roughness: f.roughness, metalness: f.metalness }));
  f.tex.colorSpace = THREE.SRGBColorSpace;
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  blockers.push(floor);

  const wallMat = M(map.wall.color);
  const t = 0.6, h = map.wall.height ?? 3.5, len = ARENA_HALF * 2 + t * 2;
  for (const [x, z, w, d] of [[0, ARENA_HALF + t / 2, len, t], [0, -ARENA_HALF - t / 2, len, t], [ARENA_HALF + t / 2, 0, t, len], [-ARENA_HALF - t / 2, 0, t, len]]) {
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
      const sx = x * SPREAD, sz = z * SPREAD;
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
      l.position.set(x * SPREAD, L.y ?? 3, z * SPREAD);
      scene.add(l);
    }
  }
  if (map.space) addSpace(scene);
  if (map.forest) addForest(scene, map.forest);
  if (map.ceiling) addCeiling(scene, map, blockers);

  // True when a circle of `margin` radius at (x, z) does not touch any cover
  const isFree = (x, z, margin = 1) =>
    colliders.every(c => x < c.minX - margin || x > c.maxX + margin || z < c.minZ - margin || z > c.maxZ + margin);

  return { blockers, colliders, isFree };
}
