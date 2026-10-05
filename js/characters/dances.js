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

export const DANCES = {
  // Fibi: ballet show (7 s) - curtsy, pirouettes, arabesque, grand jetes, final curtsy
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
      // Two grand jetes: big leaps in a split
      const v = (t - 5) / 1.3, h = abs(s(v * PI * 2));
      model.position.y = h * 0.6;
      model.rotation.x = -0.15 * h;
      legs[0].rotation.x = -1.25 * h;
      legs[1].rotation.x = 1.25 * h;
      armsPose(rig, [-2.5, 0.9], [-2.5, 0.9]);
      head.rotation.set(-0.2 * h, 0, 0);
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

  // Nono: spinning flail (5 s) - fast spin (6 full turns), arms thrown up, kicking legs, bouncing
  flail(rig, t) {
    reset(rig);
    const { model, legs, arms, head } = rig;
    model.rotation.y = t * PI * 12 / 5;
    model.rotation.z = s(t * 9) * 0.12;
    model.position.y = abs(s(t * 9)) * 0.28;
    arms[0].rotation.set(-2.7 + s(t * 12) * 0.7, 0, -0.5 + c(t * 12) * 0.4);
    arms[1].rotation.set(-2.7 - s(t * 12) * 0.7, 0, 0.5 - c(t * 12) * 0.4);
    legs[0].rotation.x = s(t * 12) * 1.1;
    legs[1].rotation.x = -s(t * 12) * 1.1;
    head.rotation.set(0, 0, s(t * 6) * 0.35);
  },
};
