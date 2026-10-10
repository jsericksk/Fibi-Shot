import { getCharacter, lookIds } from '../characters/index.js';
import { thumbnail } from './thumbnails.js';

// Row of round portraits to pick a look of a character (e.g. 'fibi:noir'). Hidden when the character has only one.
export function renderSkins(box, id, onPick) {
  const ids = lookIds(id);
  box.classList.toggle('hidden', ids.length < 2);
  box.innerHTML = ids.map(look => `
    <button class="skin ${look === id ? 'selected' : ''}" data-id="${look}"><img src="${thumbnail(getCharacter(look))}" alt=""></button>`).join('');
  box.querySelectorAll('.skin').forEach(btn => { btn.onclick = () => onPick(btn.dataset.id); });
}
