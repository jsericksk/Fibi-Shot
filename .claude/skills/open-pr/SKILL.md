---
name: open-pr
description: Open a GitHub pull request for Fibi Shot with screenshots of what changed (home, new maps, skins, result screen...). Use whenever the user asks to open a PR in this project. If nothing visual changed, the PR is opened without screenshots.
---

# Open PR

Opens the PR for the current branch against `main`. The body is a short summary grouped by area, and, when the change is visible in the game, screenshots at the top.

## 1. Look at what changed

- `git fetch origin -q`, then `git log --oneline origin/main..HEAD` and `git diff --stat origin/main..HEAD`.
- Make sure the branch is pushed (`git push -u origin <branch>`; the user already asked for the PR, so pushing is expected).
- Decide if something is **visible**: a new or changed map, character or skin, the home/menu, the HUD, the result screen, a weapon model, UI layout. If nothing is visible (audio only, config numbers, refactors, docs, network code), **skip all screenshots** and go straight to step 4 with a text-only body.

## 2. Take the screenshots (only what is relevant)

Use the claude-in-chrome tools (load them with ToolSearch if deferred) against a local dev server (`python3 -m http.server <port>` with `Cache-Control: no-store`; follow the port rule in memory). Take one picture per thing that changed, usually between 1 and 6:

- **Home / menu:** open the page and select the characters and skins that show off the change. Take a normal screenshot.
- **Maps:** one in-game shot per new or changed map.
- **Skins:** one grid with every new look, rows of the same character, the normal look first.
- **Result screen / HUD:** when those changed.

Use `computer` with `action: "screenshot"` and `save_to_disk: true` (scale 1) to get a file path for DOM screens like the home. Keep them to the width of the window; no GIFs.

For anything drawn on the game canvas, do not use that screenshot: it is a downscaled JPEG and looks blurry. Render the canvas at 2560x1280 instead (`renderer.setPixelRatio(1)`, `setSize(2560, 1280, false)`, fix the camera aspect), call `canvas.toDataURL('image/png')` right after the render, and save it with a temporary local server that accepts a POST and writes the PNG. Keep that server and the PNGs in the scratchpad, never in the repo, and stop the server afterwards.

How to get an in-game shot: the game has no public instance and background tabs do not animate, so build one by hand in `javascript_tool`. Read `js/main.js` and `js/game/game.js` for how a match is started, stepped and rendered, instead of relying on a remembered snippet. Hide the pause menu before capturing (the lost pointer lock opens it).

- Map ids are in `js/maps.js` and character/skin ids in `js/characters/index.js`.
- For the result screen, fill the fighters' stats and finish the match. Those numbers are made up, so say "sample numbers" in the caption.
- For a skin grid, build each look from its character definition and render them side by side in one overlay in the page.
- Look at every image before using it. Retake the ones that show the pause menu, a banner, the wrong camera angle or a bug.

## 3. Upload them through the GitHub web editor

Never create an extra branch or commit images for this, and never commit the temporary folder.

1. Create the PR first, without images (step 4), then open its page with `navigate` (the user is logged in to GitHub in Chrome).
2. Copy the images into a temporary folder inside the repo, `.pr-shots/` (the upload tool only accepts files in the project folder).
3. Open the description editor: the first comment's "Show options" menu, then "Edit". Use `find` to get the ref of the "Attach files" file input of that editor (not the "Add a comment" one).
4. Call `file_upload` once per image, with a 2 second `wait` between uploads. GitHub puts an `<img src="https://github.com/user-attachments/assets/...">` into the textarea for each one.
5. Read the textarea with `javascript_tool`, pull out the asset URLs in order, then set the textarea to the final body (step 4) using the native `value` setter and dispatch an `input` event, and click "Update comment".
6. Delete `.pr-shots/` (`rm -rf`) and check `git status` is clean.

## 4. The PR body

Create it with `gh pr create --base main --head <branch> --title "..." --body ...`.

- Title: short, in English, describing the main things.
- With screenshots, start the body with a `## Screenshots` section: one bold caption line per image and then `![Alt](https://github.com/user-attachments/assets/<id>)`. Without them, skip that section entirely.
- Then a short summary grouped by area (for example Gameplay, Maps, Skins, Other), based on the commits and the diff. No file-by-file lists.
- **No "Test plan" section.** Do not claim things were tested if they were not; if something was not tested on device (phone, multiplayer), say so in one line.
- End with only `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Never add a claude.ai session link.
- Commits are already made by now and get no attribution lines.

## 5. Report

Give the PR URL, say which screenshots were included and which were not, and mention anything that was not tested.
