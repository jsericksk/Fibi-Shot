# Audio files

Put game audio here, one folder per kind of sound (mono mp3, 64–96 kbps):

- `emotes/` – dance sounds, named `<character>-emote-<n>.mp3` (e.g. `fibi-emote-1.mp3`).
- (later) `kills/`, `weapons/`, ...

Which file plays with which dance, and each emote's length, is set in `js/config.js` (`EMOTES`). Missing files are skipped silently.
