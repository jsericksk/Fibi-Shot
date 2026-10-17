import { sfx } from '../audio.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);

// Asks a yes/no question, with an optional title above it and a detail line (such as a link) below it. Calls onYes only on "yes"; "no" or a click outside the box cancels.
export function confirmDialog(text, onYes, { title = null, detail = null } = {}) {
  const dialog = $('confirm-dialog');
  $('confirm-title').classList.toggle('hidden', !title);
  if (title) $('confirm-title').textContent = t(title);
  $('confirm-text').textContent = t(text);
  $('confirm-detail').classList.toggle('hidden', !detail);
  if (detail) $('confirm-detail').textContent = detail;
  dialog.classList.remove('hidden');

  const close = yes => {
    dialog.classList.add('hidden');
    sfx.click();
    if (yes) onYes();
  };
  $('confirm-yes').onclick = () => close(true);
  $('confirm-no').onclick = () => close(false);
  dialog.onclick = e => { if (e.target === dialog) close(false); };
}
