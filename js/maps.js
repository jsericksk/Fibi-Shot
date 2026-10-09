// Map definitions. Add a new entry to MAPS and it shows up in the menu.
// Cover entries: [x, z, width, depth, height, kind]. `quarter` is mirrored on both axes.
// Optional: wall.height (default 3.5), wall.stripe (null = none), kinds[].split (color of the top half of a stacked pair),
// kinds[].crown (leaves on top of a tree), forest { count, spread } (trees beyond the walls),
// ceiling { height, color } (indoor map: needs lights; light panels are drawn over `lights.at`), lights.y (default 3)
// doomsday: true (needs `space`) ends timed matches with the Earth being nuked
// Gravity is the same on every map (WORLD.gravity): fighters can jump onto cover up to ~3 m high.

export const MAPS = {
  moon: {
    id: 'moon',
    name: 'Lua',
    preview: 'radial-gradient(circle at 35% 35%, #d8d8de, #55555f 70%, #101018)',
    sky: 0x000004,
    fog: [70, 170],
    hemi: [0x8899bb, 0x222233, 0.55],
    sun: { color: 0xffffff, intensity: 2.8, pos: [35, 38, -12] },
    floor: 'moon',
    space: true,               // stars and a distant Earth
    doomsday: true,            // easter egg: timed matches end with a nuke on the Earth
    wall: { color: 0x5c5c66, stripe: 0xdfe6f2 },
    kinds: {
      rock: { color: 0x75757d, trim: null },
      module: { color: 0xc9ced8, trim: 0x4ab8ff },
      pillar: { color: 0x2a2c36, trim: 0xffffff },
      wall: { color: 0x66666f, trim: null },
    },
    lights: null,
    quarter: [
      [9, 9, 3, 3, 2.2, 'rock'],
      [19, 5, 4, 2.6, 2.6, 'module'],
      [5, 19, 2.6, 4, 2.6, 'module'],
      [16, 16, 1.6, 1.6, 3.6, 'pillar'],
      [26, 10, 5, 1, 1.1, 'wall'],
      [10, 26, 1, 5, 1.1, 'wall'],
      [24, 24, 3, 3, 2.2, 'rock'],
      [27, 18, 2, 2, 1.6, 'rock'],
      [18, 27, 2, 2, 1.6, 'rock'],
      [13, 2, 1.2, 1.2, 3.6, 'pillar'],
    ],
    center: [
      [0, 0, 6, 6, 0.9, 'wall'],
    ],
  },

  arena: {
    id: 'arena',
    name: 'Arena',
    preview: 'linear-gradient(135deg, #2a0a10, #e0182d)',
    sky: 0x0a0507,
    fog: [35, 105],
    hemi: [0xc9a0a8, 0x1a0b0e, 1.1],
    sun: { color: 0xffb0a0, intensity: 1.0, pos: [-20, 40, -15] },
    floor: 'tiles',
    wall: { color: 0x1b1519, stripe: 0xff1e2e },
    kinds: {
      crate: { color: 0x2c2326, trim: 0xff2a3a },
      container: { color: 0x4a1218, trim: 0xff5a4a },
      pillar: { color: 0x141214, trim: 0xff1e2e },
      wall: { color: 0x2d2d36, trim: 0xb01626 },
    },
    // Dim colored lights for mood: color, intensity, distance, positions
    lights: { color: 0xff2a3a, intensity: 25, distance: 26, at: [[-24, -24], [24, -24], [-24, 24], [24, 24], [0, 0]] },
    quarter: [
      [10, 8, 3, 3, 2.4, 'crate'],
      [20, 8, 6, 2.4, 2.6, 'container'],
      [8, 22, 2.4, 6, 2.6, 'container'],
      [15, 4, 1.4, 1.4, 3.4, 'pillar'],
      [4, 16, 1.4, 1.4, 3.4, 'pillar'],
      [24, 26, 1.4, 1.4, 3.4, 'pillar'],
      [14, 14, 5, 1, 1.1, 'wall'],
      [26, 20, 1, 6, 1.1, 'wall'],
      [28, 12, 1, 4, 1.1, 'wall'],
      [21, 17, 2, 2, 2.4, 'crate'],
      [15, 24, 2, 2, 1.6, 'crate'],
      [13, 28, 1.4, 1.4, 3.4, 'pillar'],
    ],
    center: [
      [0, 0, 1.6, 1.6, 3.4, 'pillar'],
      [3.8, 0, 3.4, 1, 1.1, 'wall'], [-3.8, 0, 3.4, 1, 1.1, 'wall'],
      [0, 3.8, 1, 3.4, 1.1, 'wall'], [0, -3.8, 1, 3.4, 1.1, 'wall'],
      [6, 6, 2, 2, 2.4, 'crate'], [-6, 6, 2, 2, 2.4, 'crate'],
      [6, -6, 2, 2, 2.4, 'crate'], [-6, -6, 2, 2, 2.4, 'crate'],
    ],
  },

  forest: {
    id: 'forest',
    name: 'Floresta',
    preview: 'linear-gradient(#8fd1ff 0 42%, #2f8f3a 42%)',
    sky: 0x8fd1ff,
    fog: [80, 200],
    hemi: [0xdff1ff, 0x4a7a3a, 1.0],
    sun: { color: 0xfff1cc, intensity: 2.4, pos: [30, 45, -15] },
    floor: 'grass',
    wall: { color: 0x4a9a45, stripe: null, height: 2.4 },   // a hedge around the clearing
    forest: { count: 40, spread: 55 },
    kinds: {
      rock: { color: 0x8a8f8a, trim: null },
      log: { color: 0x7a5230, trim: null },
      tree: { color: 0x6b4a2b, trim: null, crown: 0x2f8f3a },
      bush: { color: 0x3a8a3a, trim: null },
      crate: { color: 0xb88a4a, trim: null },
    },
    lights: null,
    quarter: [
      [9, 8, 4, 4, 2.4, 'rock'],
      [20, 6, 7, 2, 2.2, 'log'],
      [6, 20, 2, 7, 2.2, 'log'],
      [16, 16, 1.4, 1.4, 5, 'tree'],
      [12, 27, 1.4, 1.4, 5, 'tree'],
      [24, 24, 3.6, 3.6, 2.4, 'bush'],
      [14, 3, 2.6, 2.6, 2.3, 'crate'],
    ],
    center: [
      [0, 0, 4.4, 4.4, 2.4, 'rock'],
    ],
  },

  assault: {
    id: 'assault',
    name: 'Assault',
    preview: 'linear-gradient(135deg, #b5432f 0 38%, #2f5fa3 38% 62%, #8b8d8e 62%)',
    sky: 0x15171a,
    fog: [45, 120],
    hemi: [0xdfe3ea, 0x5a5c60, 1.1],
    sun: { color: 0xfff2dd, intensity: 0.8, pos: [20, 40, -10] },
    floor: 'concrete',
    wall: { color: 0x6d6f70, stripe: 0xb89a20, height: 9 },
    ceiling: { height: 9, color: 0x3a3d40 },
    kinds: {
      container_red: { color: 0xb5432f, trim: null },
      container_blue: { color: 0x2f5fa3, trim: null },
      stack_rb: { color: 0xb5432f, trim: null, split: 0x2f5fa3 },   // red below, blue on top
      stack_br: { color: 0x2f5fa3, trim: null, split: 0xb5432f },
      crate: { color: 0xc99a3a, trim: null },
      crate_green: { color: 0x56603a, trim: null },
      platform: { color: 0x8e9091, trim: null },
      wall: { color: 0x74767a, trim: null },
      pillar: { color: 0x77797a, trim: null },
    },
    lights: { color: 0xfff2dd, intensity: 45, distance: 42, y: 7, at: [[-15, -15], [15, -15], [-15, 15], [15, 15], [0, 0]] },
    quarter: [
      [8, 7, 6, 2.4, 5.2, 'stack_rb'],
      [19, 8, 6, 2.4, 2.6, 'container_red'],
      [8, 20, 2.4, 6, 5.2, 'stack_br'],
      [24, 23, 6, 2.4, 2.6, 'container_blue'],
      [14, 14, 1.6, 1.6, 1.6, 'crate'],
      [16, 15.4, 1.2, 1.2, 1.2, 'crate_green'],
      [13, 26, 1.6, 1.6, 1.6, 'crate_green'],
      [27, 13, 1.6, 1.6, 1.6, 'crate'],
      [24, 3, 8, 6, 0.9, 'platform'],
      [25, 3, 1.4, 1.4, 2.0, 'crate'],
      [4, 14, 1, 5, 1.1, 'wall'],
      [13, 1.5, 1.2, 1.2, 9, 'pillar'],
    ],
    center: [
      [0, 0, 5, 5, 0.9, 'platform'],
      [0, 0, 1.6, 1.6, 2.2, 'crate'],
    ],
  },
};

export const MAP_LIST = Object.values(MAPS);
