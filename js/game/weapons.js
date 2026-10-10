import * as THREE from 'three';
import { M, add, box, cyl } from '../utils.js';
import { WEAPON_STATS } from '../config.js';

export const WEAPON_ORDER = ['pistol', 'ak47', 'awp', 'shotgun', 'bazooka'];

// Stats live in config.js
export const WEAPONS = WEAPON_STATS;

const dark = M(0x2d2f38);
const metal = M(0x5b5f6e, { metalness: 0.5, roughness: 0.4 });
const wood = M(0x8a5a35);
const green = M(0x4a5a3a);

// Gun models: origin at the grip, barrel along +Z. Returns the group and its muzzle point.
export function buildGun(id) {
  const g = new THREE.Group();
  let muzzleZ = 0.3;
  if (id === 'pistol') {
    add(g, box, dark, [0, 0.03, 0.1], [0.07, 0.09, 0.34]);
    add(g, box, metal, [0, 0.07, 0.1], [0.05, 0.02, 0.3]);
    add(g, box, dark, [0, -0.07, -0.02], [0.065, 0.17, 0.08], [0.2, 0, 0]);
    muzzleZ = 0.28;
  } else if (id === 'ak47') {
    add(g, box, dark, [0, 0.02, 0.22], [0.07, 0.1, 0.62]);
    add(g, box, wood, [0, 0.0, 0.62], [0.085, 0.08, 0.32]);
    add(g, cyl, metal, [0, 0.045, 0.95], [0.022, 0.4, 0.022], [Math.PI / 2, 0, 0]);
    add(g, box, dark, [0, -0.15, 0.22], [0.055, 0.22, 0.11], [0.25, 0, 0]);
    add(g, box, wood, [0, -0.02, -0.28], [0.065, 0.13, 0.36]);
    add(g, box, dark, [0, -0.1, 0.0], [0.06, 0.15, 0.07], [0.2, 0, 0]);
    muzzleZ = 1.15;
  } else if (id === 'shotgun') {
    add(g, box, dark, [0, 0.02, 0.15], [0.08, 0.11, 0.42]);                          // receiver
    add(g, cyl, metal, [0, 0.055, 0.78], [0.03, 0.9, 0.03], [Math.PI / 2, 0, 0]);    // barrel
    add(g, cyl, dark, [0, -0.005, 0.7], [0.035, 0.7, 0.035], [Math.PI / 2, 0, 0]);   // magazine tube
    add(g, box, wood, [0, -0.02, 0.62], [0.09, 0.08, 0.3]);                          // pump
    add(g, box, wood, [0, -0.03, -0.3], [0.07, 0.14, 0.5], [-0.12, 0, 0]);           // stock
    add(g, box, dark, [0, -0.1, 0.0], [0.06, 0.15, 0.07], [0.2, 0, 0]);              // grip
    muzzleZ = 1.25;
  } else if (id === 'bazooka') {
    add(g, cyl, green, [0, 0.06, 0.4], [0.1, 1.5, 0.1], [Math.PI / 2, 0, 0]);                  // launch tube
    add(g, cyl, dark, [0, 0.06, -0.38], [0.14, 0.18, 0.14], [Math.PI / 2, 0, 0]);               // rear flare
    add(g, cyl, dark, [0, 0.06, 1.1], [0.13, 0.12, 0.13], [Math.PI / 2, 0, 0]);                 // front ring
    add(g, new THREE.ConeGeometry(0.075, 0.3, 12), M(0xc23030), [0, 0.06, 1.3], [1, 1, 1], [Math.PI / 2, 0, 0]);   // rocket nose peeking out
    add(g, box, dark, [0, 0.18, 0.5], [0.04, 0.06, 0.2]);                                       // sight
    add(g, box, dark, [0, -0.08, 0.2], [0.06, 0.15, 0.07], [0.2, 0, 0]);                        // grip
    muzzleZ = 1.4;
  } else {
    add(g, box, green, [0, 0.02, 0.2], [0.075, 0.1, 0.9]);
    add(g, cyl, dark, [0, 0.04, 1.0], [0.026, 0.9, 0.026], [Math.PI / 2, 0, 0]);
    add(g, box, green, [0, -0.02, -0.36], [0.07, 0.15, 0.5]);   // stock ends inside the slim jackets, so it never pokes out of a back
    add(g, box, dark, [0, -0.1, 0.0], [0.06, 0.15, 0.07], [0.2, 0, 0]);
    add(g, cyl, dark, [0, 0.14, 0.25], [0.05, 0.42, 0.05], [Math.PI / 2, 0, 0]);   // scope tube
    add(g, cyl, M(0x4aa8ff, { emissive: 0x2266aa, emissiveIntensity: 0.6 }), [0, 0.14, 0.47], [0.052, 0.02, 0.052], [Math.PI / 2, 0, 0]); // lens
    add(g, box, dark, [0.06, 0.04, 0.05], [0.06, 0.025, 0.025]);                    // bolt handle
    muzzleZ = 1.46;
  }
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0.04, muzzleZ);
  g.add(muzzle);
  return { group: g, muzzle };
}
