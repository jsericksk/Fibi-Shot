# Fibi Shot

A small 3D chibi shooter that runs in the browser. Made just for fun, with no commitment. 🎀

The game is based on the AI-generated chibi characters that became popular in 2026, such as
**Fibi Chupi** and **Gugu Gaga**.

The whole game was made with 100% vibe coding.

Pick a cute character, grab a gun and duel a bot, hang out in a showcase of all characters,
or play 1v1 against a friend online.

## How to play

There is no build step. Serve the folder with any static server and open `index.html`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

An internet connection is needed (three.js and PeerJS are loaded from a CDN).

### Game modes

- **1v1:** an endless deathmatch against a bot.
- **Training:** every character walks around the map, jumps and dances. Infinite ammo and no deaths,
  so it is a good place to try things out.
- **Multiplayer:** a 1v1 against a friend over the network.

### Controls

| Key | Action |
|---|---|
| `W` `A` `S` `D` | Move |
| Mouse | Aim |
| Left click | Shoot |
| Right click | AWP scope |
| `1` `2` `3` `4` | Switch weapon |
| `R` | Reload |
| `Space` | Jump |
| `H` | Emote |
| Hold `Alt` + mouse | Look at your own character |
| `F` | Fullscreen |
| `Esc` | Pause menu |

## Characters

- **Fibi:** blonde girl with a wide white hat.
- **Guga:** girl in a penguin hoodie.
- **Nono:** sleepy girl with long gray-green hair.
- **Doro:** chubby, grumpy mochi girl with pink hair.

## Weapons

Pistol, AK-47, AWP (sniper) and Shotgun. Each one has its own feel: the shotgun is strong up close,
the AWP is precise when scoped, and the AK-47 is a reliable automatic.
All the numbers can be tweaked in `js/config.js`.

## Maps

- **Moon:** a lunar map with low gravity.
- **Arena:** a dark red and black arena.

## Multiplayer

1. Click **Multiplayer** and then **Create room**. Share the code or the link with a friend.
2. Your friend opens the link, or types the code and clicks **Join**.
3. Pick your characters and start the match.

Players connect directly to each other with [PeerJS](https://peerjs.com/). There is no game server.
It is made for playing with friends, not for stopping cheaters.

## Languages

English and Portuguese. The language follows your browser and can be switched in the menu.

## Project structure

```
index.html        All screens (menu, lobby, match)
css/style.css     Styles
audio/            Mp3 files
js/config.js      Every tunable number
js/maps.js        Map definitions
js/i18n.js        Texts in English and Portuguese
js/net.js         PeerJS connection
js/characters/    Character models and dances
js/game/          Game logic
js/ui/            Menu, lobby and HUD
```

See `CLAUDE.md` for the coding rules used in this project.

## Credits

Made with plain JavaScript, [three.js](https://threejs.org/) and [PeerJS](https://peerjs.com/).
