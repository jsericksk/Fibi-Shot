// Map definitions. Add a new entry to MAPS and it shows up in the menu.
// Cover entries: [x, z, width, depth, height, kind]. `quarter` is mirrored on both axes.
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
};

export const MAP_LIST = Object.values(MAPS);
