import { buildFibi } from './fibi.js';
import { buildGuga } from './guga.js';
import { buildNono } from './nono.js';
import { buildDoro } from './doro.js';
import { buildMambo } from './mambo.js';
import { buildYotsuba } from './yotsuba.js';

export const CHARACTERS = [
  { id: 'fibi', name: 'Fibi', build: buildFibi, radius: 1.1 },   // radius: collision size, wider than the default because of her big hat brim
  { id: 'guga', name: 'Guga', build: buildGuga },
  { id: 'nono', name: 'Nono', build: buildNono },
  { id: 'doro', name: 'Doro', build: buildDoro },
  { id: 'mambo', name: 'Mambo', build: buildMambo },
  { id: 'yotsuba', name: 'Yotsuba', build: buildYotsuba },
];

export const getCharacter = id => CHARACTERS.find(c => c.id === id);
