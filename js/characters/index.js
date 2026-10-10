import { buildFibi } from './fibi.js';
import { buildGuga } from './guga.js';
import { buildNono } from './nono.js';
import { buildDoro } from './doro.js';
import { buildMambo } from './mambo.js';
import { buildYotsuba } from './yotsuba.js';

export const CHARACTERS = [
  { id: 'fibi', name: 'Fibi', build: buildFibi, radius: 0.95 },   // radius: collision size when wider than the default (her hat brim, Nono's hair)
  { id: 'guga', name: 'Guga', build: buildGuga },
  { id: 'nono', name: 'Nono', build: buildNono, radius: 0.7 },
  { id: 'doro', name: 'Doro', build: buildDoro },
  { id: 'mambo', name: 'Mambo', build: buildMambo },
  { id: 'yotsuba', name: 'Yotsuba', build: buildYotsuba },
];

export const getCharacter = id => CHARACTERS.find(c => c.id === id);
