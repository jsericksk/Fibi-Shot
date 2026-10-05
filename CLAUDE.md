# Fibi Shot

A small 3D chibi shooter that runs in the browser (plain JavaScript modules + three.js, no build step).
Run it with any static server, for example `python3 -m http.server`, and open `index.html`.

## Code rules

- Write clean, simple, readable code. Prefer small functions with one clear job.
- Match the style of the surrounding code: naming, comment density, formatting.
- Comment the "why", not the "what". Keep comments short and in English.
- Do not leave dead code, debug logs or temporary test hooks behind.
- Do not repeat yourself: reuse existing helpers (`utils.js`, `rig.js`) before writing new ones.
- Keep changes focused. Do not refactor unrelated code in the same change.

## Project organization

- Tunable numbers (times, speeds, damage, ranges, volumes) go in `js/config.js`. No magic numbers in game code.
- Maps live in `js/maps.js`, characters in `js/characters/`, dances in `js/characters/dances.js`.
- Every text the player sees goes in `js/i18n.js` in both English and Portuguese. Never hardcode UI text.
- Audio files go in `audio/<kind>/` (for example `audio/emotes/`). Keep them small and mono.
- Keep files focused: game logic in `js/game/`, screens and HUD in `js/ui/`.

## Working rules

- Check that the game still loads and the changed feature works before saying it is done.
- Browsers cache modules heavily, so tell the user to hard refresh after changes.
- Be honest about what was tested and what was not.

## Git

- Commit messages: short, clear, in English, in the imperative ("Add shotgun").
- Never add `Co-Authored-By` or any other attribution line to commits.
- When the user asks for a commit, push right after.
