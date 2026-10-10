import { buildFibi } from './fibi.js';
import { buildGuga } from './guga.js';
import { buildNono } from './nono.js';
import { buildDoro } from './doro.js';
import { buildMambo } from './mambo.js';
import { buildYotsuba } from './yotsuba.js';

// skins: other looks of the same character, picked with ids like 'fibi:noir'. options go to the build function,
// radius replaces the character's own collision size (the Fibi without a hat has no brim)
export const CHARACTERS = [
  {
    id: 'fibi', name: 'Fibi', build: buildFibi, radius: 0.95,   // radius: collision size when wider than the default (her hat brim, Nono's hair)
    skins: [
      { id: 'nohat', options: { hat: false }, radius: 0.7 },
      { id: 'noir', options: { look: 'noir' } },
    ],
  },
  { id: 'guga', name: 'Guga', build: buildGuga },
  { id: 'nono', name: 'Nono', build: buildNono, radius: 0.7 },
  { id: 'doro', name: 'Doro', build: buildDoro },
  { id: 'mambo', name: 'Mambo', build: buildMambo },
  { id: 'yotsuba', name: 'Yotsuba', build: buildYotsuba },
].map(c => ({ ...c, key: c.id }));   // key tells looks apart (thumbnails and stages are cached by it); id stays the character's

const skinned = {};

// A character by id, or by 'id:skin' for one of its other looks (an unknown skin gives the normal look)
export function getCharacter(id) {
  const [baseId, skinId] = id.split(':');
  const base = CHARACTERS.find(c => c.id === baseId);
  const skin = base.skins?.find(s => s.id === skinId);
  if (!skin) return base;
  return skinned[id] ??= { ...base, key: id, build: () => base.build(skin.options), radius: skin.radius ?? base.radius };
}

// Ids of every look of a character, the normal one first
export function lookIds(id) {
  const base = getCharacter(id);
  return [base.id, ...(base.skins ?? []).map(s => `${base.id}:${s.id}`)];
}
