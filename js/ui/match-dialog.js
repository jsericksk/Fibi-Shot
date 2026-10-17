import { MATCH } from '../config.js';
import { sfx } from '../audio.js';
import { t } from '../i18n.js';
import { formatTime } from '../utils.js';

const $ = id => document.getElementById(id);

// Asks how to play in a dialog with one square per option: unlimited or timed, and Gun Game (never timed) when
// `gungame` is true. Calls onPick(seconds, gungame) with 0 seconds for unlimited. A click outside the box cancels.
export function askMatchDuration(onPick, { gungame = false } = {}) {
  const options = [
    { seconds: 0, big: '∞', label: t('matchDialog.unlimited') },
    ...MATCH.timedSeconds.map(seconds => ({ seconds, big: formatTime(seconds), label: t('matchDialog.timed', { min: seconds / 60 }) })),
    ...(gungame ? [{ seconds: 0, gungame: true, big: '∞', label: t('matchDialog.gungame') }] : []),
  ];
  $('match-title').textContent = t(gungame ? 'matchDialog.title' : 'matchDialog.length');
  $('match-options').innerHTML = options.map((o, i) => `
    <button class="match-option" data-i="${i}"><b>${o.big}</b><span>${o.label}</span></button>`).join('');
  const dialog = $('match-dialog');
  dialog.classList.remove('hidden');

  dialog.onclick = e => {
    const btn = e.target.closest('.match-option');
    if (!btn && e.target !== dialog) return;
    dialog.classList.add('hidden');
    sfx.click();
    if (btn) onPick(options[btn.dataset.i].seconds, !!options[btn.dataset.i].gungame);
  };
}
