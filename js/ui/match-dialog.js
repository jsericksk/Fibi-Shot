import { MATCH } from '../config.js';
import { sfx } from '../audio.js';
import { t, applyI18n } from '../i18n.js';
import { formatTime } from '../utils.js';

const $ = id => document.getElementById(id);

// Asks for the match length in a dialog with one square per option: unlimited or timed.
// Calls onPick(seconds) with 0 for unlimited. A click outside the box cancels.
export function askMatchDuration(onPick) {
  const options = [
    { seconds: 0, big: '∞', label: t('matchDialog.unlimited') },
    ...MATCH.timedSeconds.map(seconds => ({ seconds, big: formatTime(seconds), label: seconds < 60 ? t('matchDialog.seconds', { n: seconds }) : t('matchDialog.timed', { min: seconds / 60 }) })),
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
