// Emote dances. Each one is a function (rig, t) that poses the rig for time t (seconds since the
// emote started) and is called every frame. They are timed to match the lengths in config.js (EMOTES).
//
// Axis cheat sheet (rotations are radians):
//   arms/legs .x: 0 hangs down, negative swings forward/up (-1.57 forward, -3 straight up), positive goes back
//   arms .z: positive moves the arm outward on its own side (side = -1 left, +1 right)
//   model .x: positive leans forward | model .y: spin | model .z: tilt sideways
const { sin: s, cos: c, abs, PI, min, max } = Math;
const ease = x => { const k = min(1, max(0, x)); return k * k * (3 - 2 * k); };   // smoothstep, clamped to 0..1
const SIDE = [-1, 1];
const FLIP_CENTER = 0.6;   // height of the body's middle: somersaults spin around it, not around the feet

// Neutral starting pose; each dance then overrides what it needs
function reset({ model, legs, arms, head }) {
  model.rotation.set(0, 0, 0);
  model.position.set(0, 0, 0);
  legs.forEach(l => l.rotation.set(0, 0, 0));
  arms.forEach((a, i) => a.rotation.set(0, 0, SIDE[i] * 0.2));
  head.rotation.set(0, 0, 0);
}

// Sets both arms; each argument is [x, z] for the left arm and the right arm (z already mirrored for you)
function armsPose(rig, left, right) {
  rig.arms[0].rotation.set(left[0], 0, -left[1]);
  rig.arms[1].rotation.set(right[0], 0, right[1]);
}

// One full backward somersault for f in 0..1, rotating around the middle of the body (not the feet)
function backSomersault({ model, legs, head, arms }, f) {
  const air = s(f * PI), turn = -ease(f) * PI * 2, mid = FLIP_CENTER;
  model.rotation.x = turn;
  model.position.set(0, mid - mid * c(turn) + air * 0.9, -mid * s(turn));
  legs[0].rotation.x = legs[1].rotation.x = -1.3 * air;                  // knees tucked
  arms.forEach((a, i) => a.rotation.set(-2.8 + 1.6 * air, 0, SIDE[i] * 0.3));   // arms up, hugging the knees mid-air
  head.rotation.set(0.3 * air, 0, 0);
}

export const DANCES = {
  // Fibi: ballet show (7 s) - curtsy, pirouettes, arabesque, backflip, final curtsy
  ballet(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    if (t < 1) {
      const w = s((t / 1) * PI);                       // down and up
      model.rotation.x = 0.3 * w;
      model.position.y = -0.14 * w;
      armsPose(rig, [-0.3, 0.5 + 0.3 * w], [-0.3, 0.5 + 0.3 * w]);
      legs[0].rotation.z = -0.15 * w; legs[1].rotation.z = 0.15 * w;
      head.rotation.set(0.25 * w, 0, 0);
    } else if (t < 3.5) {
      // Four pirouettes on tiptoe: one leg in passe, arms rounded overhead
      const u = (t - 1) / 2.5;
      model.rotation.y = ease(u) * PI * 8;
      model.position.y = 0.1;
      legs[1].rotation.set(-1.05, 0, 0.55);
      armsPose(rig, [-2.9, 0.25], [-2.9, 0.25]);
      head.rotation.set(-0.1, 0, s(u * 20) * 0.08);
    } else if (t < 5) {
      // Arabesque: lean forward, back leg raised, one arm forward and one back, slow turn
      const u = (t - 3.5) / 1.5, k = ease(u * 4) * (1 - ease((u - 0.85) * 6.7));
      model.rotation.x = 0.65 * k;
      model.rotation.y = s(u * PI) * 0.7;
      model.position.y = 0.1;
      legs[1].rotation.x = 1.35 * k;
      armsPose(rig, [-1.6 * k - 0.3 * (1 - k), 0.2], [1.1 * k, 0.5]);
      head.rotation.set(-0.35 * k, 0, 0);
    } else if (t < 6.3) {
      backSomersault(rig, min(1, (t - 5) / 1.2));      // backflip
    } else {
      // Final curtsy, holding the bow
      const w = ease((t - 6.3) / 0.3);
      model.rotation.x = 0.55 * w;
      model.position.y = -0.16 * w;
      armsPose(rig, [-0.25, 0.9 * w + 0.2], [-0.25, 0.9 * w + 0.2]);
      legs[0].rotation.z = -0.2 * w; legs[1].rotation.z = 0.2 * w;
      head.rotation.set(0.35 * w, 0, 0);
    }
  },

  // Fibi: idol dance (5 s) - sway, double pirouette, disco points, jump spin
  idol(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    if (t < 1.5) {
      model.rotation.z = s(t * 5) * 0.14;
      model.position.y = abs(s(t * 10)) * 0.08;
      armsPose(rig, [-2.8 + s(t * 10) * 0.25, 0.5 + c(t * 10) * 0.2], [-2.8 - s(t * 10) * 0.25, 0.5 - c(t * 10) * 0.2]);
      head.rotation.set(0, 0, s(t * 5) * 0.3);
    } else if (t < 3) {
      const u = (t - 1.5) / 1.5;
      model.rotation.y = ease(u) * PI * 4;
      legs[1].rotation.set(-0.9, 0, 0.5);
      model.position.y = 0.06;
      armsPose(rig, [-1.4, -0.5], [-1.4, -0.5]);   // arms crossed in front
    } else if (t < 4.5) {
      const p = s(t * 8), up = p > 0;
      model.rotation.z = p * 0.12;
      model.position.y = abs(p) * 0.1;
      armsPose(rig, up ? [0, 0.7] : [-2.7, 0.55], up ? [-2.7, 0.55] : [0, 0.7]);   // one arm points up, the other on the hip
      legs[up ? 0 : 1].rotation.x = -0.6 * abs(p);
      head.rotation.set(0, p * 0.3, -p * 0.15);
    } else {
      const u = (t - 4.5) / 0.5;
      model.rotation.y = ease(u) * PI * 2;
      model.position.y = s(u * PI) * 0.55;
      legs[0].rotation.x = legs[1].rotation.x = -0.5 * s(u * PI);
      armsPose(rig, [-2.8, 0.6], [-2.8, 0.6]);
    }
  },

  // Fibi: moonwalk (7 s) - hat tip, glide backwards with shuffling feet, spin back to the start, pose
  moonwalk(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const GLIDE = 0.9;                                                 // meters slid backwards
    if (t < 1.2) {
      const w = ease(t / 0.3) * (1 - ease((t - 0.9) / 0.3));          // one hand tips an imaginary hat, hips pop
      armsPose(rig, [-2.4 * w, 0.2 + 0.2 * w], [0, 0.7 * w + 0.2]);
      model.rotation.z = s(t * 14) * 0.08 * w;
      head.rotation.set(0.15 * w, 0, 0);
    } else if (t < 4.5) {
      const u = (t - 1.2) / 3.3, ph = t * 7;
      model.position.z = -GLIDE * ease(u);
      model.rotation.x = -0.1;                                         // leans back a little
      legs[0].rotation.x = max(0, s(ph)) * -0.7; legs[1].rotation.x = max(0, -s(ph)) * -0.7;   // the lifted foot lands on the toes while the other slides
      model.position.y = abs(s(ph)) * 0.03;
      armsPose(rig, [-0.5 + s(ph) * 0.3, 0.3], [-0.5 - s(ph) * 0.3, 0.3]);
      head.rotation.set(0, s(ph / 2) * 0.25, 0);
    } else if (t < 6) {
      const u = (t - 4.5) / 1.5;                                       // double spin that slides back to the start
      model.position.z = -GLIDE * (1 - ease(u));
      model.rotation.y = ease(u) * PI * 4;
      model.position.y = 0.1 * s(u * PI);
      legs[1].rotation.set(-0.9, 0, 0.4);
      armsPose(rig, [-2.9, 0.25], [-2.9, 0.25]);
    } else {
      const w = ease((t - 6) / 0.25);                                  // final pose: one arm points up, the other grabs the hip, on tiptoe
      model.position.y = 0.08 * w;
      model.rotation.z = 0.12 * w;
      armsPose(rig, [-2.9 * w, 0.4 * w + 0.2], [0, 0.7 * w + 0.2]);
      legs[1].rotation.x = -0.4 * w;
      head.rotation.set(-0.1 * w, 0, -0.2 * w);
    }
  },

  // Fibi: disco (7.3 s) - disco points, low twist, kick spin, final point
  disco(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    if (t < 3) {
      const ph = t * 6, p = s(ph), up = p > 0;                         // the raised arm points to the sky and back down across the body
      model.rotation.z = p * 0.14;
      model.rotation.y = p * 0.3;
      model.position.y = abs(s(ph * 2)) * 0.04;
      armsPose(rig, up ? [-2.8, 0.55] : [-0.4, -0.3], up ? [-0.4, -0.3] : [-2.8, 0.55]);
      legs[up ? 1 : 0].rotation.x = -0.35 * abs(p);
      head.rotation.set(0, -p * 0.3, -p * 0.2);
    } else if (t < 5.2) {
      const u = (t - 3) / 2.2, p = s(t * 9);                           // knees bent, twisting down and back up
      const squat = s(u * PI);
      model.position.y = -0.2 * squat;
      model.rotation.y = p * 0.5;
      legs[0].rotation.z = -0.2 * squat; legs[1].rotation.z = 0.2 * squat;
      armsPose(rig, [-1.1, 0.35 + 0.2 * p], [-1.1, 0.35 - 0.2 * p]);   // arms swing like a twist
      head.rotation.set(0.1, -p * 0.35, 0);
    } else if (t < 6.4) {
      const u = (t - 5.2) / 1.2, air = s(min(1, u * 1.2) * PI);        // jump with a full spin, one leg kicked out
      model.rotation.y = ease(u) * PI * 2;
      model.position.y = air * 0.45;
      legs[0].rotation.x = -1.4 * air; legs[1].rotation.x = 0.3 * air;
      armsPose(rig, [-2.9, 0.5], [-1.2 * air, 0.9]);
      head.rotation.set(-0.15, 0, 0);
    } else {
      const w = ease((t - 6.4) / 0.25);                                // final disco point, held
      model.rotation.z = 0.12 * w;
      model.rotation.y = 0.3 * w;
      armsPose(rig, [-2.8 * w, 0.2 + 0.35 * w], [0, 0.7 * w + 0.2]);
      legs[1].rotation.x = -0.35 * w;
      head.rotation.set(0, -0.3 * w, -0.2 * w);
    }
  },

  // Guga: penguin routine (5 s) - waddle, belly slide, flapping hops
  penguin(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    if (t < 2) {
      const ph = t * 8;
      model.rotation.z = s(ph) * 0.3;
      model.position.y = abs(s(ph)) * 0.08;
      legs[0].rotation.x = s(ph) * 0.5; legs[1].rotation.x = -s(ph) * 0.5;
      armsPose(rig, [0, 0.75 + s(ph * 2) * 0.25], [0, 0.75 + s(ph * 2) * 0.25]);   // stiff flippers
      head.rotation.set(0, 0, -s(ph) * 0.15);
    } else if (t < 3.5) {
      const u = (t - 2) / 1.5, w = min(1, u * 5) * (1 - ease((u - 0.8) * 5));
      model.rotation.x = 1.15 * w;
      model.position.y = 0.1 * w;
      model.position.z = s(u * PI) * 0.7;               // slides forward and glides back
      legs.forEach((l, i) => l.rotation.set(0.3 * w, 0, SIDE[i] * 0.2 * w));
      armsPose(rig, [0.9 * w, 0.4 * w], [0.9 * w, 0.4 * w]);
      head.rotation.set(-0.8 * w, 0, 0);
    } else {
      const u = (t - 3.5) / 1.5;
      model.position.y = abs(s(u * PI * 2)) * 0.6;       // two hops
      model.rotation.y = ease(u) * PI * 2;
      legs[0].rotation.x = legs[1].rotation.x = -0.5;
      armsPose(rig, [0, 1.0 + s(t * 32) * 0.7], [0, 1.0 + s(t * 32) * 0.7]);   // fast flapping
      head.rotation.set(-0.15, 0, 0);
    }
  },

  // Nono: party groove (5 s, 120 BPM) - bouncing roof raises, side shuffle, floss, spinning jump finish
  groove(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    const beat = t * PI * 2;                                           // one bounce per 0.5 s
    if (t < 1.5) {
      model.position.y = abs(s(beat)) * 0.12;
      model.rotation.z = s(beat / 2) * 0.1;
      const up = s(beat / 2) > 0;                                      // arms pump up one after the other
      armsPose(rig, [up ? -2.9 : -1.6, 0.35], [up ? -1.6 : -2.9, 0.35]);
      legs[0].rotation.x = -0.35 * max(0, s(beat / 2)); legs[1].rotation.x = -0.35 * max(0, -s(beat / 2));
      head.rotation.set(0, 0, s(beat / 2) * 0.25);
    } else if (t < 3) {
      const p = s(beat / 2);                                           // two steps to each side
      model.position.set(p * 0.3, abs(s(beat)) * 0.1, 0);
      model.rotation.y = p * 0.4;
      legs[0].rotation.x = p * 0.7; legs[1].rotation.x = -p * 0.7;
      armsPose(rig, [-1.3 + p * 0.4, -0.4], [-1.3 - p * 0.4, -0.4]);   // hands pumping in front
      head.rotation.set(0, -p * 0.3, 0);
    } else if (t < 4.2) {
      const p = s(beat);                                               // floss: hips one way, both arms the other
      model.rotation.z = -p * 0.2;
      model.position.set(-p * 0.1, abs(p) * 0.04, 0);
      arms.forEach(a => a.rotation.set(-0.25, 0, p * 0.95));
      legs[0].rotation.z = -0.1; legs[1].rotation.z = 0.1;
      head.rotation.set(0, 0, p * 0.15);
    } else {
      const u = (t - 4.2) / 0.8;                                       // jump with a full spin, arms up
      model.rotation.y = ease(u) * PI * 2;
      model.position.y = s(min(1, u) * PI) * 0.5;
      legs[0].rotation.x = legs[1].rotation.x = -0.5 * s(min(1, u) * PI);
      armsPose(rig, [-2.9, 0.3], [-2.9, 0.3]);
      head.rotation.set(-0.2, 0, 0);
    }
  },

  // Doro 1: robot (6 s, 120 BPM) - stiff poses that snap every beat, head ticks, moonwalk, spin and freeze
  robot(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const POSES = [[[-1.57, 0.05], [-1.57, 0.05]], [[-1.57, 0.05], [0, 0.75]], [[-2.9, 0.2], [0, 0.75]], [[0, 0.75], [-2.9, 0.2]], [[-1.57, 0.9], [-1.57, 0.9]]];
    const snap = Math.floor(t * 4);                                    // a new pose every 0.25 s, no easing
    if (t < 3) {
      armsPose(rig, ...POSES[snap % POSES.length]);
      const side = snap % 4 < 2 ? 1 : -1;
      head.rotation.set(0, side * 0.5, 0);
      model.rotation.y = side * 0.25;
      model.position.y = snap % 2 ? 0.03 : 0;
    } else if (t < 5) {
      const u = (t - 3) / 2;                                           // moonwalk: slides back while the legs shuffle
      model.position.z = -0.5 * s(u * PI);
      legs[0].rotation.x = s(t * 9) * 0.5; legs[1].rotation.x = -s(t * 9) * 0.5;
      armsPose(rig, [-0.9, 0.2], [0.3, 0.2]);
      head.rotation.set(0, snap % 2 ? 0.4 : -0.4, 0);
    } else {
      const u = (t - 5) / 0.5;
      model.rotation.y = ease(u) * PI * 2;
      model.position.y = s(min(1, u) * PI) * 0.3;
      if (t > 5.5) armsPose(rig, [-2.9, 0.2], [0, 0.75]);              // freeze: one arm up, the other down
      else armsPose(rig, [-1.57, 0.9], [-1.57, 0.9]);
    }
  },

  // Doro 2: cancan (6 s, 120 BPM) - high kicks with arms wide, twirl, bow
  cancan(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    if (t < 3.6) {
      const leg = Math.floor(t / 0.5) % 2, kick = s(((t % 0.5) / 0.5) * PI);
      legs[leg].rotation.x = -1.6 * kick;
      model.position.y = kick * 0.1;
      model.rotation.x = -0.15 * kick;                                 // leans back to throw the leg up
      const wave = s(t * 12) * 0.2;
      armsPose(rig, [-0.3, 1.2 + wave], [-0.3, 1.2 - wave]);
      head.rotation.set(0, 0, (leg ? 1 : -1) * 0.2 * kick);
    } else if (t < 5) {
      const u = (t - 3.6) / 1.4;                                       // two twirls with little hops
      model.rotation.y = ease(u) * PI * 4;
      model.position.y = abs(s(u * PI * 3)) * 0.2;
      legs[0].rotation.x = legs[1].rotation.x = -0.3 * abs(s(u * PI * 3));
      armsPose(rig, [-2.7, 0.5], [-2.7, 0.5]);
    } else {
      const w = s(min(1, (t - 5) / 1) * PI);                           // bow with one arm across the chest
      model.rotation.x = 0.7 * w;
      model.position.y = -0.08 * w;
      armsPose(rig, [-1.4 * w, -0.4 * w], [0.5 * w, 0.3]);
      head.rotation.set(0.3 * w, 0, 0);
    }
  },

  // Yotsuba: happy hops (6 s, 120 BPM) - banzai bounces, side hops with swinging arms, wiggle, big jumps, fist pump (no spinning)
  hops(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    const beat = t * PI * 2;                                           // one bounce per 0.5 s
    if (t < 1.5) {
      const p = s(beat / 2), dip = max(0, -s(beat)) * 0.06;            // arms up, waving, knees bending on each landing
      model.position.y = abs(s(beat)) * 0.2 - dip;
      armsPose(rig, [-2.9, 0.3 + 0.25 * p], [-2.9, 0.3 - 0.25 * p]);
      legs[0].rotation.x = legs[1].rotation.x = -0.3 * abs(s(beat));
      head.rotation.set(-0.1, 0, p * 0.2);
    } else if (t < 3) {
      const p = s(beat / 2);                                           // hops left and right, arms swinging like running
      model.position.set(p * 0.25, abs(s(beat)) * 0.22, 0);
      model.rotation.z = -p * 0.12;
      arms[0].rotation.set(s(beat) * 1.1, 0, -0.25); arms[1].rotation.set(-s(beat) * 1.1, 0, 0.25);
      legs[0].rotation.x = s(beat) * 0.7; legs[1].rotation.x = -s(beat) * 0.7;
      head.rotation.set(0, p * 0.3, p * 0.15);
    } else if (t < 4.5) {
      const p = s(t * 12);                                             // happy wiggle: hips shaking, elbows out, fists by the cheeks
      model.rotation.z = p * 0.2;
      model.position.y = abs(s(beat)) * 0.08;
      armsPose(rig, [-2.2, 0.9], [-2.2, 0.9]);
      legs[0].rotation.z = -0.15; legs[1].rotation.z = 0.15;
      head.rotation.set(0.1, 0, -p * 0.25);
    } else {
      const u = (t - 4.5) / 1.5, jump = abs(s(u * PI * 3)) * 0.55;     // three big jumps, then a fist pump held up
      const end = ease((u - 0.8) / 0.2);
      model.position.y = u < 0.8 ? jump : 0;
      legs[0].rotation.x = legs[1].rotation.x = u < 0.8 ? -0.5 * jump / 0.55 : 0;
      armsPose(rig, [-2.9, 0.3 + 0.2 * s(t * 14) * (1 - end)], [-2.9 * (1 - end) - 1.3 * end, 0.3]);
      head.rotation.set(-0.15 * end, 0, 0.1 * end);
    }
  },

  // Mambo 1: backflip show (7.3 s) - sway, crouch, backflip at about 4 s, celebration, final pose
  backflip(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const flip = f => backSomersault(rig, f);
    // Squat to jump, or to absorb the landing
    const crouch = w => {
      model.rotation.x = 0.25 * w;
      model.position.y = -0.14 * w;
      legs[0].rotation.z = -0.15 * w; legs[1].rotation.z = 0.15 * w;
      armsPose(rig, [0.5 * w, 0.3], [0.5 * w, 0.3]);
    };
    // The somersault happens at about 4 s (it peaks at 4.0)
    const sway = t0 => {                                               // sway with the arms waving up and down
      const p = s((t - t0) * 7);
      model.rotation.z = p * 0.15;
      model.position.y = abs(p) * 0.05;
      armsPose(rig, p > 0 ? [-2.6, 0.5] : [-0.3, 0.7], p > 0 ? [-0.3, 0.7] : [-2.6, 0.5]);
      head.rotation.set(0, 0, -p * 0.2);
    };
    if (t < 2.6) sway(0);
    else if (t < 3.4) crouch(ease((t - 2.6) / 0.8));
    else if (t < 4.6) flip((t - 3.4) / 1.2);
    else if (t < 4.9) crouch(s(((t - 4.6) / 0.3) * PI));              // landing
    else if (t < 6.4) sway(4.9);
    else {
      const w = ease((t - 6.4) / 0.3);                                 // final pose: one arm up, the other on the hip
      model.rotation.z = 0.1 * w;
      armsPose(rig, [-2.9 * w, 0.4 * w + 0.2], [0, 0.7 * w + 0.2]);
      head.rotation.set(0, 0, -0.2 * w);
    }
  },

  // Mambo 2: horse routine (8.5 s) - trot, hip shake, gallop hops, rears up (holds the pose)
  gallop(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    if (t < 2.5) {
      const ph = t * 9, p = s(ph);
      legs[0].rotation.x = -max(0, p) * 1.1;             // high knees, one leg at a time
      legs[1].rotation.x = max(0, -p) * -1.1;
      model.position.y = abs(p) * 0.08;
      armsPose(rig, [-1.2 + p * 0.5, 0.2], [-1.2 - p * 0.5, 0.2]);   // arms bent like reins
      head.rotation.set(0.12 * c(ph * 2), 0, 0);
    } else if (t < 5) {
      const ph = (t - 2.5) * 8, p = s(ph);
      model.rotation.z = p * 0.22;                       // hip shake
      model.position.y = abs(s(ph * 2)) * 0.05;
      legs[0].rotation.z = -0.2 * abs(p); legs[1].rotation.z = 0.2 * abs(p);
      armsPose(rig, [-2.7, 0.3 + 0.3 * p], [-2.7, 0.3 - 0.3 * p]);   // hands up, swaying
      head.rotation.set(0, 0, -p * 0.25);
    } else if (t < 7) {
      const u = (t - 5) / 2, ph = u * PI * 6, p = s(ph);
      model.rotation.x = 0.25;
      model.position.y = abs(p) * 0.4;                   // gallop hops
      legs[0].rotation.x = -0.9 * max(0, p); legs[1].rotation.x = -0.9 * max(0, -p);
      armsPose(rig, [0.5, 0.2], [0.5, 0.2]);             // arms swept back
      head.rotation.set(-0.2, 0, 0);
    } else {
      const w = ease((t - 7) / 0.4);                     // rears up, one hand to the sky
      model.rotation.x = -0.3 * w;
      model.position.y = 0.05 * w;
      legs[0].rotation.x = legs[1].rotation.x = 0.15 * w;
      armsPose(rig, [-1.3 * w, 0.4 * w], [-3.0 * w, 0.3 * w]);
      head.rotation.set(-0.3 * w, 0, 0);
    }
  },

  // Anya 1: waku waku (6 s, 120 BPM) - flapping excitement, cheek wiggle, smug lean, sneaky sidesteps, surprise jump (no spinning)
  waku(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const beat = t * PI * 2;
    if (t < 1.5) {
      model.position.y = abs(s(beat)) * 0.15;
      const flap = s(t * 24) * 0.5;                                    // both arms flap like wings
      armsPose(rig, [-0.3, 0.9 + flap], [-0.3, 0.9 - flap]);
      legs[0].rotation.x = legs[1].rotation.x = -0.3 * abs(s(beat));
      head.rotation.set(0, 0, s(beat / 2) * 0.25);
    } else if (t < 3) {
      const p = s(t * 10);                                             // hands on the cheeks, hips and head wiggling
      model.rotation.z = p * 0.15;
      model.position.y = abs(s(beat)) * 0.05;
      armsPose(rig, [-2.3, 0.8], [-2.3, 0.8]);
      legs[0].rotation.z = -0.12 * abs(p); legs[1].rotation.z = 0.12 * abs(p);
      head.rotation.set(0.1, p * 0.3, -p * 0.2);
    } else if (t < 4.5) {
      model.rotation.x = -0.15;                                        // smug: leaning back, one hand on the hip, one pointing up
      model.position.y = abs(s(beat)) * 0.08;
      armsPose(rig, [0, 0.7], [-2.5 + s(t * 8) * 0.3, 0.3]);
      head.rotation.set(-0.3, 0, 0.3);
    } else if (t < 5.5) {
      const p = s(((t - 4.5) / 1) * PI * 2);                           // sneaky sidesteps, peeking
      model.position.x = p * 0.35;
      model.rotation.x = 0.25;
      legs[0].rotation.x = s(t * 12) * 0.5; legs[1].rotation.x = -s(t * 12) * 0.5;
      armsPose(rig, [-1.6, 0.1], [-1.6, 0.1]);
      head.rotation.set(0, -p * 0.5, 0);
    } else {
      const u = (t - 5.5) / 0.5, jump = s(min(1, u) * PI);             // surprise jump, legs spread, arms up
      model.position.y = jump * 0.5;
      legs[0].rotation.z = -0.5 * jump; legs[1].rotation.z = 0.5 * jump;
      armsPose(rig, [-2.9, 0.7], [-2.9, 0.7]);
      head.rotation.set(-0.3 * jump, 0, 0);
    }
  },

  // Anya 2: secret agent (6 s) - crouched sneaking, arm windmills, finger guns, shocked jump (no spinning)
  agent(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    if (t < 2) {
      model.rotation.x = 0.3;                                          // low sneak, looking around
      model.position.set(s(t * 2.5) * 0.4, -0.1, 0);
      legs[0].rotation.x = s(t * 9) * 0.5; legs[1].rotation.x = -s(t * 9) * 0.5;
      armsPose(rig, [-1.0, 0.3], [-1.0, 0.3]);
      head.rotation.set(0.1, s(t * 4) * 0.6, 0);
    } else if (t < 4) {
      model.position.y = abs(s(t * 10)) * 0.12;                        // arms windmilling like propellers
      arms[0].rotation.set(t * 14, 0, -0.3); arms[1].rotation.set(-t * 14, 0, 0.3);
      legs[0].rotation.x = s(t * 10) * 0.6; legs[1].rotation.x = -s(t * 10) * 0.6;
      head.rotation.set(0, 0, s(t * 5) * 0.3);
    } else if (t < 5.2) {
      const kick = max(0, s(t * 12)) * 0.3;                            // finger gun with recoil, other hand on the hip
      model.rotation.z = s(t * 16) * 0.08;
      armsPose(rig, [0, 0.7], [-1.57 - kick, 0.05]);
      legs[0].rotation.z = -0.15; legs[1].rotation.z = 0.15;
      head.rotation.set(-0.1 - kick, 0, 0.2);
    } else {
      const u = (t - 5.2) / 0.8, jump = s(min(1, u) * PI);             // shocked: big jump, legs and arms wide
      model.position.y = jump * 0.6;
      legs[0].rotation.z = -0.6 * jump; legs[1].rotation.z = 0.6 * jump;
      armsPose(rig, [-2.9, 0.9], [-2.9, 0.9]);
      head.rotation.set(-0.35 * jump, 0, 0);
    }
  },

  // Bocchi 1: air guitar (6 s) - headbanging strums, knee kicks with a windmill strum, power chord, collapse (no spinning)
  guitar(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    if (t < 2) {
      model.rotation.x = 0.15;                                         // headbang, left hand on the neck, right hand strumming
      model.position.y = abs(s(t * 7)) * 0.05;
      armsPose(rig, [-1.3, 0.2], [0, 0.2]);
      arms[1].rotation.set(-0.7 + s(t * 30) * 0.35, 0, 0.1);
      head.rotation.set(s(t * 14) * 0.5, 0, 0);
    } else if (t < 4) {
      const leg = Math.floor(t * 2) % 2, kick = abs(s(t * PI * 2));    // alternate knee kicks
      legs[leg].rotation.x = -1.2 * kick;
      model.position.y = kick * 0.1;
      armsPose(rig, [-1.3, 0.2], [0, 0.2]);
      arms[1].rotation.x = -t * 18;                                    // windmill strum
      head.rotation.set(s(t * 10) * 0.3, 0, 0);
    } else if (t < 5.3) {
      model.rotation.x = -0.35;                                        // power chord: leaning back, legs wide, trembling
      model.position.set(s(t * 40) * 0.02, 0, 0);
      legs[0].rotation.z = -0.3; legs[1].rotation.z = 0.3;
      armsPose(rig, [-2.9, 0.3], [0, 0.2]);
      arms[1].rotation.x = -0.6 + s(t * 26) * 0.6;
      head.rotation.set(-0.4, 0, 0);
    } else {
      const w = ease((t - 5.3) / 0.3);                                 // collapses, exhausted
      model.rotation.x = 0.5 * w;
      model.position.y = -0.15 * w;
      armsPose(rig, [0.2 * w, 0.2], [0.2 * w, 0.2]);
      head.rotation.set(0.4 * w, 0, 0);
    }
  },

  // Bocchi 2: anxious melt (6 s) - trembling hug, melting into noodle arms, sudden pop-up, confident sway (no spinning)
  melt(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    if (t < 1.5) {
      model.position.x = s(t * 60) * 0.02;                             // shivering, hugging herself, knees knocking
      armsPose(rig, [-1.0, -0.6], [-1.0, -0.6]);
      legs[0].rotation.z = 0.08 * abs(s(t * 30)); legs[1].rotation.z = -0.08 * abs(s(t * 30));
      head.rotation.set(0.3, 0, 0);
    } else if (t < 3.5) {
      const w = ease((t - 1.5) / 1);                                   // melting down with noodle arms
      model.rotation.x = 0.6 * w;
      model.position.y = -0.25 * w;
      arms.forEach((a, i) => a.rotation.set(s(t * 9 + i * 2) * 1.2, 0, SIDE[i] * (0.4 + s(t * 7 + i) * 0.4)));
      head.rotation.set(0.4 * w, 0, s(t * 5) * 0.3);
    } else if (t < 4.2) {
      const u = (t - 3.5) / 0.7, pop = s(u * PI);                      // suddenly pops up, jazz hands
      model.position.y = pop * 0.6;
      legs[0].rotation.x = legs[1].rotation.x = -0.4 * pop;
      armsPose(rig, [-2.9, 0.6 + s(t * 30) * 0.2], [-2.9, 0.6 - s(t * 30) * 0.2]);
      head.rotation.set(-0.25, 0, 0);
    } else {
      const p = s((t - 4.2) * 6);                                      // sudden confidence: swaying and pointing at the sky
      model.rotation.z = p * 0.15;
      model.position.set(p * 0.2, abs(p) * 0.06, 0);
      armsPose(rig, p > 0 ? [-2.9, 0.3] : [0, 0.7], p > 0 ? [0, 0.7] : [-2.9, 0.3]);
      legs[p > 0 ? 0 : 1].rotation.x = -0.5 * abs(p);
      head.rotation.set(-0.15, p * 0.3, -p * 0.2);
    }
  },

  // Miku 1: leek swing (6 s, 120 BPM) - alternating arm swings, side hops with zigzag arms, body wave, split jump (no spinning)
  leek(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    const beat = t * PI * 2;
    if (t < 2) {
      const p = s(beat / 2);                                           // arms swing up and down like waving a leek
      model.rotation.z = p * 0.1;
      model.position.y = abs(s(beat)) * 0.1;
      armsPose(rig, [-1.6 - 1.3 * p, 0.2], [-1.6 + 1.3 * p, 0.2]);
      head.rotation.set(0, 0, p * 0.2);
    } else if (t < 4) {
      const p = s(beat / 2);                                           // hops sideways, arms overhead zigzagging
      model.position.set(p * 0.4, abs(s(beat)) * 0.2, 0);
      legs[0].rotation.x = s(beat) * 0.6; legs[1].rotation.x = -s(beat) * 0.6;
      armsPose(rig, [-2.9, 0.3 + s(beat * 2) * 0.3], [-2.9, 0.3 - s(beat * 2) * 0.3]);
      head.rotation.set(0, p * 0.3, -p * 0.2);
    } else if (t < 5.2) {
      const p = s(t * 12);                                             // body wave rolling through the arms
      model.rotation.z = p * 0.18;
      arms[0].rotation.set(-1.0, 0, -(0.8 + p * 0.5)); arms[1].rotation.set(-1.0, 0, 0.8 - p * 0.5);
      legs[0].rotation.z = -0.15; legs[1].rotation.z = 0.15;
      head.rotation.set(0, 0, -p * 0.25);
    } else {
      const u = (t - 5.2) / 0.8, jump = s(min(1, u) * PI);             // split jump, then holds a V pose
      model.position.y = jump * 0.55;
      legs[0].rotation.set(-0.3 * jump, 0, -0.9 * jump); legs[1].rotation.set(-0.3 * jump, 0, 0.9 * jump);
      armsPose(rig, [-2.8, 0.8], [-2.8, 0.8]);
      head.rotation.set(-0.15, 0, 0);
    }
  },

  // Miku 2: robo funk (6 s, 120 BPM) - snapping poses with hip pops, shuffling slide, chicken-dance pecks, peace sign freeze (no spinning)
  funk(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const POSES = [[[-1.57, 0.9], [0, 0.75]], [[-2.9, 0.2], [-1.0, 1.0]], [[0, 0.75], [-2.9, 0.2]], [[-1.0, 1.0], [-1.57, 0.9]], [[-2.2, 0.8], [-2.2, 0.8]]];
    const snap = Math.floor(t * 4);
    if (t < 2) {
      armsPose(rig, ...POSES[snap % POSES.length]);                    // a new pose every beat
      const side = snap % 2 ? 1 : -1;
      model.rotation.z = side * 0.15;
      model.position.y = snap % 2 ? 0.04 : 0;
      head.rotation.set(0, 0, -side * 0.3);
    } else if (t < 4) {
      const u = (t - 2) / 2;                                           // shuffling slide across the floor
      model.position.x = s(u * PI * 2) * 0.4;
      legs[0].rotation.x = s(t * 14) * 0.7; legs[1].rotation.x = -s(t * 14) * 0.7;
      armsPose(rig, [-0.5 + s(t * 14) * 0.9, 0.2], [-0.5 - s(t * 14) * 0.9, 0.2]);
      head.rotation.set(0, 0, s(t * 7) * 0.2);
    } else if (t < 5.3) {
      model.position.y = -0.1;                                         // chicken dance: low, elbows flapping, head pecking
      legs[0].rotation.z = -0.25; legs[1].rotation.z = 0.25;
      armsPose(rig, [-0.8, 1.4 + s(t * 20) * 0.4], [-0.8, 1.4 - s(t * 20) * 0.4]);
      head.rotation.set(s(t * 10) * 0.3, 0, 0);
    } else {
      const w = ease((t - 5.3) / 0.2);                                 // freeze: peace sign by the face, other hand on the hip, tiptoe
      model.position.y = 0.06 * w;
      model.rotation.z = 0.12 * w;
      armsPose(rig, [-2.2 * w, 0.8 * w + 0.2], [0, 0.7 * w + 0.2]);
      legs[1].rotation.x = -0.4 * w;
      head.rotation.set(-0.1 * w, 0, -0.25 * w);
    }
  },

  // Guga 2: waddle (6 s, 120 BPM) - penguin waddle, belly-slide forward and back, flipper-flapping hops, bow (no spinning)
  waddle(rig, t) {
    reset(rig);
    const { model, legs, head } = rig;
    const beat = t * PI * 2;
    if (t < 2) {
      const p = s(beat / 2);                                           // rocks from side to side, flippers out
      model.rotation.z = p * 0.25;
      model.position.set(p * 0.15, abs(p) * 0.05, 0);
      armsPose(rig, [0, 0.9 + s(beat) * 0.15], [0, 0.9 + s(beat) * 0.15]);
      legs[0].rotation.x = p * 0.5; legs[1].rotation.x = -p * 0.5;
      head.rotation.set(0, 0, -p * 0.2);
    } else if (t < 3.8) {
      const u = (t - 2) / 1.8, lean = s(u * PI);                       // belly-slides forward, flippers back, then pops up
      model.rotation.x = 1.3 * lean;
      model.position.set(0, -0.3 * lean, 0.7 * lean);
      legs[0].rotation.x = legs[1].rotation.x = 0.5 * lean;
      armsPose(rig, [0.8 * lean, 0.2], [0.8 * lean, 0.2]);
      head.rotation.set(-0.5 * lean, s(t * 8) * 0.2 * lean, 0);
    } else if (t < 5.2) {
      model.position.y = abs(s(t * 10)) * 0.25;                        // hops, flippers flapping fast
      armsPose(rig, [0, 1.0 + s(t * 30) * 0.6], [0, 1.0 + s(t * 30) * 0.6]);
      legs[0].rotation.x = legs[1].rotation.x = -0.4 * abs(s(t * 10));
      head.rotation.set(-0.2, 0, 0);
    } else {
      const w = ease((t - 5.2) / 0.3);                                 // polite bow
      model.rotation.x = 0.7 * w;
      model.position.y = -0.08 * w;
      armsPose(rig, [-0.3 * w, 0.3], [-0.3 * w, 0.3]);
      head.rotation.set(0.3 * w, 0, 0);
    }
  },

  // Guga 3: metal penguin (6 s, 130 BPM) - headbang, devil horns and stomps, mosh flail, dab, stage dive pose (no spinning)
  rock(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    if (t < 1.5) {
      model.rotation.x = 0.2 + s(t * 14) * 0.15;                       // headbang, one fist pumping, the other hand on the hip
      model.position.y = abs(s(t * 7)) * 0.05;
      armsPose(rig, [0, 0.7], [-2.9 + s(t * 14) * 0.3, 0.2]);
      head.rotation.set(s(t * 14) * 0.6, 0, 0);
    } else if (t < 3) {
      const ph = t * 8;                                                // devil horns up high, big stomps
      model.position.y = abs(s(ph)) * 0.1;
      armsPose(rig, [-2.6 + s(t * 20) * 0.1, 0.3], [-2.6 + s(t * 20) * 0.1, 0.3]);
      legs[0].rotation.x = -max(0, s(ph)) * 1.0; legs[1].rotation.x = -max(0, -s(ph)) * 1.0;
      head.rotation.set(-0.3, 0, s(t * 4) * 0.25);
    } else if (t < 4.5) {
      model.rotation.z = s(t * 8) * 0.25;                              // mosh: shoulders rocking, arms flailing
      model.position.x = s(t * 4) * 0.3;
      arms.forEach((a, i) => a.rotation.set(s(t * 13 + i * 2) * 1.3, 0, SIDE[i] * 0.5));
      legs[0].rotation.x = s(t * 8) * 0.6; legs[1].rotation.x = -s(t * 8) * 0.6;
      head.rotation.set(s(t * 12) * 0.4, 0, 0);
    } else if (t < 5.5) {
      const left = t > 5;                                              // dab on one side, then on the other
      const sd = left ? -1 : 1;
      armsPose(rig, left ? [-1.3, -0.6] : [-2.9, 0.6], left ? [-2.9, 0.6] : [-1.3, -0.6]);
      model.rotation.z = sd * 0.1;
      model.position.y = abs(s(t * 14)) * 0.04;
      head.rotation.set(0.45, 0, sd * -0.2);
    } else {
      const w = ease((t - 5.5) / 0.15);                                // final pose: leaning back, arms in a V, legs wide
      model.rotation.x = -0.5 * w;
      legs[0].rotation.z = -0.3 * w; legs[1].rotation.z = 0.3 * w;
      armsPose(rig, [-2.9 * w, 0.8 * w + 0.2], [-2.9 * w, 0.8 * w + 0.2]);
      head.rotation.set(-0.4 * w, 0, 0);
    }
  },
};
