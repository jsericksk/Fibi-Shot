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
};
