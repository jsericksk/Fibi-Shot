import { sfx } from '../audio.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);

// Asks a yes/no question. Calls onYes only on "yes"; "no" or a click outside the box cancels.
export function confirmDialog(text, onYes) {
  const dialog = $('confirm-dialog');
  $('confirm-text').textContent = t(text);
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
