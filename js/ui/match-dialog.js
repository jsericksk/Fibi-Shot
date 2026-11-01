import { MATCH } from '../config.js';
import { CHARACTERS } from '../characters/index.js';
import { sfx } from '../audio.js';
import { t } from '../i18n.js';
import { formatTime } from '../utils.js';

const $ = id => document.getElementById(id);

// Asks how to play in a dialog with one square per option: unlimited or timed, and the special modes (never timed,
// Gun Game and Survival) when `variants` is true. Calls onPick(seconds, variant) with 0 seconds for unlimited and
// the variant id of a special mode. A click outside the box cancels.
export function askMatchDuration(onPick, { variants = false } = {}) {
  const options = [
    { seconds: 0, big: '∞', label: t('matchDialog.unlimited') },
    ...MATCH.timedSeconds.map(seconds => ({ seconds, big: formatTime(seconds), label: t('matchDialog.timed', { min: seconds / 60 }) })),
    ...(variants ? [
      { seconds: 0, variant: 'gungame', big: '∞', label: t('matchDialog.gungame') },
      { seconds: 0, variant: 'survival', big: CHARACTERS.length, label: t('matchDialog.survival') },
    ] : []),
  ];
  $('match-title').textContent = t(variants ? 'matchDialog.title' : 'matchDialog.length');
  $('match-options').innerHTML = options.map((o, i) => `
    <button class="match-option" data-i="${i}"><b>${o.big}</b><span>${o.label}</span></button>`).join('');
  const dialog = $('match-dialog');
  dialog.classList.remove('hidden');

  dialog.onclick = e => {
    const btn = e.target.closest('.match-option');
    if (!btn && e.target !== dialog) return;
    dialog.classList.add('hidden');
    sfx.click();
    if (btn) onPick(options[btn.dataset.i].seconds, options[btn.dataset.i].variant);
  };
}
