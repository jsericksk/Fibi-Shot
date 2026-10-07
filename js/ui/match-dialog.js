import { MATCH } from '../config.js';
import { sfx } from '../audio.js';
import { t, applyI18n } from '../i18n.js';
import { formatTime } from '../utils.js';

const $ = id => document.getElementById(id);

// Asks for the match length in a dialog with two squares: timed or unlimited.
// Calls onPick(seconds) with 0 for unlimited. A click outside the box cancels.
export function askMatchDuration(onPick) {
  const options = [
    { seconds: MATCH.timedSeconds, big: formatTime(MATCH.timedSeconds), label: t('matchDialog.timed', { min: MATCH.timedSeconds / 60 }) },
    { seconds: 0, big: '∞', label: t('matchDialog.unlimited') },
  ];
  const dialog = $('match-dialog');
  $('match-options').innerHTML = options.map((o, i) => `
    <button class="match-option" data-i="${i}"><b>${o.big}</b><span>${o.label}</span></button>`).join('');
  applyI18n();
  dialog.classList.remove('hidden');

  dialog.onclick = e => {
    const btn = e.target.closest('.match-option');
    if (!btn && e.target !== dialog) return;
    dialog.classList.add('hidden');
    sfx.click();
    if (btn) onPick(options[btn.dataset.i].seconds);
  };
}
