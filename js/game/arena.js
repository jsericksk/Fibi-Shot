import * as THREE from 'three';
import { M } from '../utils.js';
import { WORLD } from '../config.js';

export const ARENA_HALF = WORLD.arenaHalf;

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

const FLOORS = { tiles: tilesFloor, moon: moonFloor };

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
  const t = 0.6, h = 3.5, len = ARENA_HALF * 2 + t * 2;
  for (const [x, z, w, d] of [[0, ARENA_HALF + t / 2, len, t], [0, -ARENA_HALF - t / 2, len, t], [ARENA_HALF + t / 2, 0, t, len], [-ARENA_HALF - t / 2, 0, t, len]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = wall.receiveShadow = true;
    scene.add(wall);
    blockers.push(wall);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.25, d + 0.02), glow(map.wall.stripe));
    stripe.position.set(x, h - 0.2, z);
    scene.add(stripe);
  }

  const cover = [
    ...map.center,
    ...map.quarter.flatMap(([x, z, w, d, ch, k]) => [[x, z, w, d, ch, k], [-x, z, w, d, ch, k], [x, -z, w, d, ch, k], [-x, -z, w, d, ch, k]]),
  ];
  for (const [x, z, w, d, ch, kind] of cover) {
    const { color, trim } = map.kinds[kind];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, ch, d), M(color));
    mesh.position.set(x, ch / 2, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    const edgeColor = trim ?? 0x20202a;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: trim ? 0.55 : 0.4 })));
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
      l.position.set(x, 3, z);
      scene.add(l);
    }
  }
  if (map.space) addSpace(scene);

  // True when a circle of `margin` radius at (x, z) does not touch any cover
  const isFree = (x, z, margin = 1) =>
    colliders.every(c => x < c.minX - margin || x > c.maxX + margin || z < c.minZ - margin || z > c.maxZ + margin);

  return { blockers, colliders, isFree };
}
