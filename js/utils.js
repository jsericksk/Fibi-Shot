import * as THREE from 'three';

// Shared unit geometries (scaled per mesh)
export const sphere = new THREE.SphereGeometry(1, 32, 24);
export const cyl = new THREE.CylinderGeometry(1, 1, 1, 32);
export const box = new THREE.BoxGeometry(1, 1, 1);

// Cached standard material per color + options
const materials = {};
export const M = (color, opts = {}) =>
  materials[color + JSON.stringify(opts)] ??= new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts });

// Creates a shadow-casting mesh and attaches it to a parent
export function add(parent, geo, mat, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rot);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Phones and tablets: the main pointer is a finger
export const isTouch = matchMedia('(pointer: coarse)').matches;

export const clamp = THREE.MathUtils.clamp;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));

// Shortest-path angle interpolation
export function lerpAngle(a, b, k) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
