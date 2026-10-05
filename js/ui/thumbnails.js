import * as THREE from 'three';
import { setIdlePose } from '../characters/rig.js';

const cache = {};

// Renders a character once into a transparent PNG data URL (used for menu cards and the HUD)
export function thumbnail(def) {
  if (cache[def.id]) return cache[def.id];

  const W = 300, H = 380;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c4ea, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(2, 4, 5);
  scene.add(sun);

  const rig = def.build();
  setIdlePose(rig);
  rig.root.rotation.y = 0.35;
  scene.add(rig.root);

  const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 50);
  camera.position.set(0, 2.3, 5.2);
  camera.lookAt(0, 0.95, 0);
  renderer.render(scene, camera);

  cache[def.id] = renderer.domElement.toDataURL('image/png');
  renderer.dispose();
  renderer.forceContextLoss();
  return cache[def.id];
}
