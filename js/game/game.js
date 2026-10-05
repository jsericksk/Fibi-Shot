import * as THREE from 'three';
import { buildArena } from './arena.js';
import { MAPS, MAP_LIST } from '../maps.js';
import { getCharacter, CHARACTERS } from '../characters/index.js';
import { MATCH, WORLD, CAMERA, EMOTE, EMOTES, SHOWCASE, NET } from '../config.js';
import { Effects } from './effects.js';
import { Fighter } from './fighter.js';
import { PlayerControls } from './player.js';
import { EnemyAI } from './enemy.js';
import { RemotePlayer } from './remote.js';
import { WEAPONS } from './weapons.js';
import { net } from '../net.js';
import { animateRig } from '../characters/rig.js';
import { sfx } from '../audio.js';
import { isSwitchingFullscreen, enterFullscreen } from '../fullscreen.js';
import { rand, isTouch } from '../utils.js';
import { t } from '../i18n.js';

const ARENA_HALF = WORLD.arenaHalf;

const COUNTDOWN = MATCH.countdown;
const FAR = MATCH.bulletRange;

// One endless deathmatch: scene, fighters, hit detection, scoring and respawns
export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.hud = hud;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, CAMERA.far);
    this.raycaster = new THREE.Raycaster();
    this.active = false;
    this.state = 'idle';           // idle | countdown | playing
    this.onMenu = () => {};

    addEventListener('resize', () => this.resize());
    this.resize();

    document.addEventListener('pointerlockchange', () => {
      if (!this.active) return;
      const locked = document.pointerLockElement === this.canvas;
      if (!locked && !this.paused && isSwitchingFullscreen()) return this.lock();
      this.setPaused(!locked);
    });
    this.hud.onResume(() => this.lock());
    this.hud.onQuit(() => this.quit());
  }

  get canAct() { return this.state === 'playing' && !this.paused; }
  get canSwitch() { return this.active && this.state !== 'idle' && !this.paused; }

  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  setPaused(on) {
    this.paused = on;
    if (on) sfx.stopAll(EMOTE.fadeOut);
    this.hud.showPause(on);
  }

  // Touch screens have no mouse to lock: playing is simply "not paused", in fullscreen to hide the browser bars
  lock() {
    if (isTouch) {
      enterFullscreen();
      return this.setPaused(false);
    }
    try { this.canvas.requestPointerLock()?.catch?.(() => this.showResume()); } catch { this.showResume(); }
  }

  // The lock needs a user gesture (the online guest starts from a network message), so ask for a click
  showResume() {
    if (!this.active) return;
    this.paused = true;
    this.hud.showPause(true);
  }

  // mode: 'duel' (vs bot) | 'training' (showcase) | 'multi' (vs a friend over the network, opts.role = host | guest)
  start(playerDef, enemyDef, mode = 'duel', mapId = MAP_LIST[0].id, opts = {}) {
    this.cleanup();
    this.training = mode === 'training';
    this.multi = mode === 'multi';
    const map = this.map = MAPS[mapId] ?? MAP_LIST[0];
    this.playerDef = playerDef;
    this.enemyDef = enemyDef;

    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(map.sky);
    scene.fog = new THREE.Fog(map.sky, ...map.fog);
    scene.add(new THREE.HemisphereLight(...map.hemi));
    const sun = new THREE.DirectionalLight(map.sun.color, map.sun.intensity);
    sun.position.set(...map.sun.pos);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const R = ARENA_HALF + 6;
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 120 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    this.arena = buildArena(scene, map);
    this.effects = new Effects(scene);

    this.player = new Fighter(playerDef, true);
    this.player.training = this.training;
    scene.add(this.player.root);
    // Online: host starts on the west side and guest on the east side
    const side = !this.multi ? null : opts.role === 'host' ? (x => x < -5) : (x => x > 5);
    this.place(this.player, null, undefined, side);

    // Duel: one hunting enemy. Training: every other character wanders around as a showcase.
    const defs = this.training ? CHARACTERS.filter(c => c.id !== playerDef.id) : [enemyDef];
    this.bots = defs.map(def => {
      const f = new Fighter(def, false);
      f.training = this.training;
      f.unarmed = this.training;
      scene.add(f.root);
      if (this.multi) return new RemotePlayer(this, f);
      this.place(f, this.player, this.training ? SHOWCASE.spawnDistance : undefined);
      return new EnemyAI(this, f, this.player, this.training);
    });
    this.enemy = this.bots[0].f;
    const look = this.multi ? { x: 0, z: 0 } : this.enemy.pos;   // online: face the middle of the map
    this.player.yaw = Math.atan2(look.x - this.player.pos.x, look.z - this.player.pos.z);

    this.controls = new PlayerControls(this, this.player);
    this.scores = { player: 0, enemy: 0 };

    this.hud.setup(playerDef, enemyDef);
    this.hud.setScore(0, 0);
    this.hud.setScope(false);
    this.hud.showPause(false);
    this.lastEmote = null;
    this.botEmotes = new Map();
    sfx.preload(Object.values(EMOTES).flat().map(e => e.sound));
    this.hud.setTraining(this.training);
    this.hud.setupChange(playerDef, this.training ? null : enemyDef, (side, id) => this.changeCharacter(side, id));
    this.hud.toast(t(this.training ? 'toast.training' : isTouch ? 'toast.pickWeaponTouch' : 'toast.pickWeapon'), 0);

    if (this.multi) {
      this.netT = 0;
      net.setHandler(msg => this.onNetMessage(msg));
      net.setCloseHandler(() => {
        this.hud.toast(t('toast.opponentLeft'), 0);
        this.leaveTimer = setTimeout(() => this.active && this.quit(), 2500);
      });
    }

    // Training skips the countdown and starts right away
    this.state = this.training ? 'playing' : 'countdown';
    this.countdownT = COUNTDOWN + 0.6;
    this.lastCount = null;
    this.paused = false;
    this.t = 0;
    this.active = true;
    this.clock = new THREE.Clock();
    this.lock();
    this.loop();
  }

  loop = () => {
    if (!this.active) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.paused || this.multi) this.update(dt);   // online the world never stops, pausing only releases the mouse
    this.renderer.render(this.scene, this.camera);
  };

  update(dt) {
    this.t += dt;
    this.updateCountdown(dt);

    const canAct = this.state === 'playing' && !this.paused;
    this.controls.update(dt, canAct);
    this.bots.forEach(b => b.update(dt, canAct));
    for (const f of [this.player, ...this.bots.map(b => b.f)]) {
      f.update(dt);
      if (!f.remote) {   // the friend's position comes from the network
        f.updateVertical(dt, this.arena.colliders, this.map.gravity);
        if (f.dead && canAct) {
          f.respawnT -= dt;
          if (f.respawnT <= 0) this.respawn(f);
        }
      }
      animateRig(f.rig, { moving: f.moving, t: this.t + (f.isPlayer ? 0 : 1.7), pitch: f.pitch + f.kick, dead: f.dead, deadT: f.deadT, air: !f.onGround, emote: f.emote, unarmed: f.unarmed }, dt);
    }
    // Emote sound follows the dance: starts with it, fades out when it ends or is cancelled
    const emote = this.player.emote;
    if (emote !== this.lastEmote) {
      if (emote) sfx.playVoice('player', emote.sound, EMOTE.volume);
      else sfx.stopVoice('player', EMOTE.fadeOut);
      this.lastEmote = emote;
    }
    // Showcase characters dance with sound too: quieter the farther they are from the player
    this.bots.forEach((b, i) => {
      const key = 'bot-' + i, em = b.f.emote;
      if (em !== (this.botEmotes.get(key) ?? null)) {
        this.botEmotes.set(key, em);
        if (em) sfx.playVoice(key, em.sound, this.emoteVolume(b.f));
        else sfx.stopVoice(key, EMOTE.fadeOut);
      } else if (em) sfx.setVoiceVolume(key, this.emoteVolume(b.f));
    });
    this.effects.update(dt);
    this.hud.update(this.player, this.enemy);
    if (this.multi) this.sendState(dt);
  }

  // ---- Online ----

  // Tells the friend where we are and what we are doing, a few times per second
  sendState(dt) {
    this.netT += dt;
    if (this.netT < 1 / NET.sendRate) return;
    this.netT = 0;
    const p = this.player, r = (v, d = 2) => +v.toFixed(d), em = p.emote;
    net.send({
      t: 's', x: r(p.pos.x), y: r(p.pos.y), z: r(p.pos.z), yaw: r(p.yaw, 3), pitch: r(p.pitch + p.kick, 3),
      mv: p.moving, gr: p.onGround, w: p.weaponId, hp: Math.round(p.hp), dead: p.dead,
      em: em ? { dance: em.dance, duration: em.duration, sound: em.sound, id: em.id } : null,
    });
  }

  onNetMessage(m) {
    switch (m.t) {
      case 's': this.bots[0].applyState(m); break;
      case 'shot': {
        const v = a => new THREE.Vector3(...a);
        this.shotEffects(this.enemy, WEAPONS[m.w], v(m.mz), m.e.map(v));
        break;
      }
      case 'hit': {   // the friend hit us: we own our health, so we apply the damage
        if (this.state !== 'playing' || this.player.dead) break;
        const before = this.player.hp;
        const died = this.player.takeDamage(m.d);
        if (this.player.hp < before) { this.hud.damageFlash(); sfx.hurt(); }
        if (died) { net.send({ t: 'died' }); this.onKill(this.enemy, this.player); }
        break;
      }
      case 'died':   // our shot killed the friend
        this.hud.hitMarker(this.lastHitHead, true);
        this.onKill(this.player, this.enemy);
        break;
    }
  }

  // Volume of another character's emote sound by distance to the player
  emoteVolume(f) {
    const k = Math.max(0, 1 - this.player.pos.distanceTo(f.pos) / EMOTE.hearRange);
    return EMOTE.volume * k * k;
  }

  updateCountdown(dt) {
    if (this.state !== 'countdown') return;
    this.countdownT -= dt;
    const n = Math.ceil(this.countdownT - 0.6);
    if (n !== this.lastCount) {
      this.lastCount = n;
      if (n > 0) { this.hud.banner(String(n), 0); sfx.beep(false); }
    }
    if (this.countdownT <= 0.6) {
      this.state = 'playing';
      this.hud.banner(t('banner.go'), 700);
      this.hud.toast('', 0);
      sfx.beep(true);
    }
  }

  // Random free spot far from `other`, preferring places out of its line of sight
  pickSpawn(other, minDistance = MATCH.minSpawnDistance, filter = null) {
    const lim = ARENA_HALF - 2;
    const valid = [], hidden = [];
    for (let i = 0; i < 80; i++) {
      const x = rand(-lim, lim), z = rand(-lim, lim);
      if (!this.arena.isFree(x, z, 1) || (filter && !filter(x, z))) continue;
      if (other && other.pos.distanceTo(new THREE.Vector3(x, 0, z)) < minDistance) continue;
      const spot = { x, z };
      valid.push(spot);
      if (other && !this.hasLineOfSight(new THREE.Vector3(x, 1.2, z), other.chestPos())) hidden.push(spot);
    }
    const pool = hidden.length ? hidden : valid;
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : { x: 0, z: -lim };
  }

  // Puts a fighter at a random spawn, facing the other one
  place(f, other, minDistance, filter) {
    const p = this.pickSpawn(other, minDistance, filter);
    f.respawn(p.x, p.z, other ? Math.atan2(other.pos.x - p.x, other.pos.z - p.z) : rand(0, Math.PI * 2));
    f.invuln = 0;
  }

  respawn(f) {
    const other = f.isPlayer ? this.enemy : this.player;
    this.place(f, other);
    f.invuln = MATCH.spawnProtection;
    if (f.isPlayer) this.hud.toast('', 0);
    else this.bots.find(b => b.f === f)?.onRespawn();
  }

  // True when no cover is between two points
  hasLineOfSight(from, to) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    this.raycaster.set(from, dir.normalize());
    this.raycaster.far = dist;
    return this.raycaster.intersectObjects(this.arena.blockers, false).length === 0;
  }

  // Hitscan shot: casts one ray (or several pellets for the shotgun), draws effects, applies damage.
  // The player can hit any bot; bots only target the player.
  fire(shooter, origin, dir) {
    this.scene.updateMatrixWorld();
    const w = shooter.weapon;
    const objects = [...this.arena.blockers];
    for (const c of shooter.isPlayer ? this.bots.map(b => b.f) : [this.player]) if (!c.dead) objects.push(...c.hitboxes);

    const muzzle = shooter.muzzleWorld();
    const pellets = w.pellets ?? 1;
    const scale = shooter.isPlayer ? 1 : MATCH.enemyDamageScale;
    const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const up = new THREE.Vector3().crossVectors(dir, side).normalize();

    const hits = new Map();   // target -> { damage, headshot }
    const ends = [];
    for (let i = 0; i < pellets; i++) {
      const d = dir.clone();
      if (pellets > 1) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * w.pelletSpread;
        d.addScaledVector(side, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r).normalize();
      }
      this.raycaster.set(origin, d);
      this.raycaster.far = FAR;
      const hit = this.raycaster.intersectObjects(objects, false)[0];
      const end = hit ? hit.point : origin.clone().addScaledVector(d, FAR);
      ends.push(end);
      if (!hit) continue;

      const zone = hit.object.userData.zone;
      if (!zone) { this.effects.impact(hit.point); continue; }
      const target = hit.object.userData.fighter;
      if (target.invuln > 0) continue;
      const head = zone === 'head';
      this.effects.impact(hit.point, head ? 0xff6a8a : 0xffffff);
      const rec = hits.get(target) ?? { damage: 0, headshot: false };
      rec.headshot ||= head;
      rec.damage += w.damage * (head ? w.headMult : 1) * scale * this.falloff(w, hit.distance);
      hits.set(target, rec);
    }

    this.shotEffects(shooter, w, muzzle, ends);
    if (this.multi && shooter.isPlayer) {
      const r = v => [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)];
      net.send({ t: 'shot', w: w.id, mz: r(muzzle), e: ends.map(r) });
    }

    for (const [target, { damage, headshot }] of hits) {
      if (target.remote) {   // the friend applies the damage to themselves
        net.send({ t: 'hit', d: damage });
        this.lastHitHead = headshot;
        this.hud.hitMarker(headshot, false);
        sfx.hit(headshot);
        continue;
      }
      const died = target.takeDamage(damage);
      if (shooter.isPlayer) { this.hud.hitMarker(headshot, died); sfx.hit(headshot); }
      else { this.hud.damageFlash(); sfx.hurt(); }
      if (died) this.onKill(shooter, target);
    }
  }

  // Tracers, muzzle flash and gun sound of a shot (ours or the friend's)
  shotEffects(shooter, w, muzzle, ends) {
    const awp = w.id === 'awp', pellets = w.pellets ?? 1;
    const color = shooter.isPlayer ? 0xfff1a8 : 0xff9aa8;
    for (const end of ends) this.effects.tracer(muzzle, end, color, awp ? 0.03 : pellets > 1 ? 0.008 : 0.015, awp ? 0.18 : pellets > 1 ? 0.06 : 0.09);
    this.effects.flash(muzzle, awp ? 0.32 : pellets > 1 ? 0.3 : 0.2);
    const away = this.player.pos.distanceTo(shooter.pos);
    sfx.shot(w.id, shooter.isPlayer ? 1 : Math.max(0.3, 1 - away / 60));
  }

  // Damage multiplier by distance (only weapons with `falloff`, i.e. the shotgun)
  falloff(w, dist) {
    const f = w.falloff;
    if (!f) return 1;
    const k = Math.min(1, Math.max(0, (dist - f.start) / (f.end - f.start)));
    return 1 - k * (1 - f.min);
  }

  onKill(killer, victim) {
    victim.respawnT = MATCH.respawnDelay;
    if (killer.isPlayer) this.scores.player++; else this.scores.enemy++;
    this.hud.setScore(this.scores.player, this.scores.enemy);

    if (victim.isPlayer) {
      this.controls.setScope(false);
      this.controls.mouseDown = false;
      this.hud.toast(t('toast.killedYou', { name: killer.def.name }), 0);
      sfx.lose();
    } else {
      this.hud.toast(t('toast.youKilled', { name: victim.def.name }), 1800);
      sfx.win();
    }
  }

  // Training: swap the player or the enemy character and restart on the same map
  changeCharacter(side, id) {
    const def = getCharacter(id);
    this.start(side === 'player' ? def : this.playerDef, side === 'enemy' ? def : this.enemyDef, this.training ? 'training' : 'duel', this.map.id);
  }

  quit() {
    if (this.multi) net.close();
    this.cleanup();
    document.exitPointerLock?.();
    this.onMenu();
  }

  cleanup() {
    this.active = false;
    clearTimeout(this.leaveTimer);
    net.setHandler(null);
    net.setCloseHandler(null);
    sfx.stopAll(0);
    cancelAnimationFrame(this.raf);
    this.controls?.dispose();
    this.bots?.forEach(b => b.dispose());
    this.scene?.traverse(o => {
      o.geometry?.dispose?.();
      if (o.material?.map) o.material.map.dispose();
    });
    this.controls = this.bots = this.scene = null;
    this.state = 'idle';
  }
}
