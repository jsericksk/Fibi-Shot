import { buildFibi } from './fibi.js';
import { buildGuga } from './guga.js';
import { buildNono } from './nono.js';
import { buildDoro } from './doro.js';
import { buildMambo } from './mambo.js';
import { buildLula } from './lula.js';
import { buildBolso } from './bolso.js';

export const CHARACTERS = [
  { id: 'fibi', name: 'Fibi', build: buildFibi },
  { id: 'guga', name: 'Guga', build: buildGuga },
  { id: 'nono', name: 'Nono', build: buildNono },
  { id: 'doro', name: 'Doro', build: buildDoro },
  { id: 'mambo', name: 'Mambo', build: buildMambo },
  { id: 'lula', name: 'Lula', build: buildLula },
  { id: 'bolso', name: 'Bolso', build: buildBolso },
];

export const getCharacter = id => CHARACTERS.find(c => c.id === id);
