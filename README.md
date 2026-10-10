# Fibi Shot

A small 3D chibi shooter that runs in the browser. Made just for fun, with no commitment. 🎀

The game is based on the AI-generated chibi characters that became popular in 2026, such as
**Fibi Chupi** and **Gugu Gaga**.

The whole game was made with 100% vibe coding.

Pick a cute character, grab a gun and duel one or two bots, hang out in a showcase of all characters,
or play 1v1 against a friend online. It works with mouse and keyboard on the computer and with touch
controls on phones (landscape).

## How to play

There is no build step. Serve the folder with any static server and open `index.html`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

An internet connection is needed (three.js and PeerJS are loaded from a CDN).

### Game modes

- **1v1:** a deathmatch against a bot, endless or timed (3 or 5 minutes). When a timed match ends, the result screen shows
  every player's kills, deaths, accuracy, headshots and damage dealt.
- **1v2:** the same, against two bots at once. Tap the **+** slot next to the enemy to add a second one
  and pick who it is (the **✕** removes it).
- **Training:** every character walks around the map, jumps and dances. Infinite ammo and no deaths, and every
  hit shows its damage as a floating number, so it is a good place to try things out.
- **Multiplayer:** a 1v1 against a friend over the network.

### Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| Mouse | Aim |
| Left click | Shoot |
| Right click | Aim (small zoom, exact shots; full scope on the AWP) |
| `1` `2` `3` `4` `5` `6` | Switch weapon |
| `R` | Reload |
| `Space` | Jump |
| `H` | Emote |
| Hold `Alt` + mouse | Look at your own character |
| `F` | Fullscreen |
| `Esc` | Pause menu |

On a phone the screen has a joystick and buttons for shooting, aiming, jumping, reloading, emotes and the
weapon menu. Their size and position can be changed in **Pause > Edit controls**.

## Characters

- **Fibi:** blonde girl with a wide white hat.
- **Guga:** girl in a penguin hoodie.
- **Nono:** sleepy girl with long gray-green hair.
- **Doro:** chubby, grumpy mochi girl with pink hair.
- **Mambo:** horse girl in a sailor-style outfit, with a periwinkle beret and a tail.
- **Yotsuba:** cheerful girl with spiky green hair, a white tee and mustard shorts.

Each character has its own emotes with sound (press `H`).

## Weapons

Pistol, AK-47, AWP (sniper), Shotgun, Bazooka and Sword. Each one has its own feel: the shotgun is strong up close,
the AWP is a sniper with a full scope (70 to the body, 100 to the head) and the AK-47 is a reliable automatic.
The pistol, AK-47 and shotgun lose damage with distance. The bazooka holds 3 rockets and takes a long time to
reload; its rocket flies slowly, so it can be dodged, and explodes on impact with area damage (a direct hit does
full damage).
The sword only works up close (3 meters), has no ammo and deals 50 damage, so two hits take a fighter down.
Every weapon except the sword can aim for a small zoom, and shots fired while aiming are exact.
All the numbers can be tweaked in `js/config.js`.

## Maps

- **Moon:** a lunar surface under a starry sky, with the Earth in the distance.
- **Arena:** a dark red and black arena.
- **Forest:** a green clearing with rocks, logs and trees.
- **Assault:** an indoor warehouse with stacked containers.
- **Plaza:** a bigger town square with a terrace, stairs, a street and houses around it.

## Multiplayer

1. Click **Multiplayer** and then **Create room**. Share the code or the link with a friend.
2. Your friend opens the link, or types the code and clicks **Join**.
3. Pick your characters and start the match.

Players connect directly to each other with [PeerJS](https://peerjs.com/). There is no game server.
It is made for playing with friends, not for stopping cheaters.

## Languages

English, Portuguese and Spanish. The language follows your browser and can be switched in the menu.

## Project structure

```
index.html        All screens (menu, lobby, match)
css/style.css     Styles
audio/            Mp3 files
js/config.js      Every tunable number
js/maps.js        Map definitions
js/i18n.js        Texts in English, Portuguese and Spanish
js/net.js         PeerJS connection
js/characters/    Character models and dances
js/game/          Game logic
js/ui/            Menu, lobby and HUD
```

See `CLAUDE.md` for the coding rules used in this project.

## Credits

Made with plain JavaScript, [three.js](https://threejs.org/) and [PeerJS](https://peerjs.com/).
