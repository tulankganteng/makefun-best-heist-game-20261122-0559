// Midnight Vault — the game loop: input, state machine, alarm, scoring.
// States: title → playing → caught | win. R restarts from any end.
// Shot mode (?shot=...) freezes a deterministic frame for screenshots.

import { CANVAS_W, CANVAS_H, ALARM, CAMERA, SCORE, LOOT } from './config.js';
import { SPAWN, PATROLS, GUARD_NAMES, CAMERA_MOUNTS, GEMS } from './world.js';
import { makeGuard, updateGuard, cameraAngle, cameraSees } from './guards.js';
import { makePlayer, updatePlayer, throwSmoke, fireEmp, workChannel, atExit } from './player.js';
import { makeAudio, ensureAudio, playEvents } from './audio.js';
import { drawGame, drawShotLabel } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function newState() {
  return {
    phase: 'title', // title | playing | caught | win
    time: 0,
    alarm: { level: 0 },
    score: { loot: 0, total: 0 },
    empUntil: -1,
    player: makePlayer(SPAWN),
    guards: PATROLS.map((wp, i) => makeGuard(GUARD_NAMES[i], wp, 0)),
    cameras: CAMERA_MOUNTS.map((m) => ({ mount: m, angle: m.baseAngle })),
    smokes: [],
    shot: null,
    shotLabel: '',
  };
}

const state = newState();
const audio = makeAudio();
const keys = new Set();
let lastTs = 0;
let spottedAnnounced = false;

function resetGame() {
  const fresh = newState();
  Object.assign(state, fresh);
  state.phase = 'playing';
  GEMS.forEach((g) => { g.taken = false; });
  spottedAnnounced = false;
}

function finishScore() {
  const timeBonus = Math.max(0, SCORE.parSeconds - state.time) * SCORE.timeBonusPerSecond;
  const loot = state.player.hasSapphire ? LOOT.sapphireValue : 0;
  const gems = state.player.gemsTaken * LOOT.gemValue;
  state.score.loot = loot + gems;
  state.score.total =
    SCORE.base + timeBonus + state.score.loot - Math.floor(state.alarm.level) * SCORE.alarmPenaltyPerPoint;
}

function update(dt) {
  const events = [];
  if (state.phase !== 'playing') return events;

  state.time += dt;
  const p = state.player;

  // Smoke clouds age out; while inside one, nobody can see Rook.
  state.smokes = state.smokes.filter((s) => (s.left -= dt) > 0);
  p.inSmoke = state.smokes.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r);

  updatePlayer(p, keys, dt, state.smokes, events);
  const got = workChannel(p, keys, dt, events);
  if (got === 'sapphire') {
    // The vault opens: the dock is the way out now.
    events.push({ type: 'sapphire' });
  }

  // Guards patrol, spot, chase. The first spot of a run gets a sting.
  const anyChaseBefore = state.guards.some((g) => g.chasing);
  for (const g of state.guards) {
    if (g.chasing) g.target = { x: p.x, y: p.y };
    updateGuard(g, dt, p, state.alarm);
  }
  const anyChaseNow = state.guards.some((g) => g.chasing);
  if (anyChaseNow && !anyChaseBefore && !spottedAnnounced) {
    events.push({ type: 'spotted' });
    spottedAnnounced = true;
  }
  if (!anyChaseNow) spottedAnnounced = false;

  // Cameras sweep; a live camera that sees Rook feeds the alarm.
  for (const c of state.cameras) {
    c.angle = cameraAngle(c.mount, state.time, state.empUntil);
    if (state.time < state.empUntil) continue;
    if (cameraSees(c.mount, c.angle, p)) {
      state.alarm.level = Math.min(100, state.alarm.level + CAMERA.alarmRise * dt);
    }
  }

  // Calm moments let the alarm bleed back down.
  const seen = state.guards.some((g) => g.suspicion > 50) ||
    state.cameras.some((c) => state.time >= state.empUntil && cameraSees(c.mount, c.angle, p));
  if (!seen) {
    state.alarm.level = Math.max(0, state.alarm.level - ALARM.decay * dt);
  }

  // Caught: the alarm trips, or a guard lays hands on Rook.
  const touched = state.guards.some((g) => Math.hypot(g.x - p.x, g.y - p.y) < g.radius + p.radius + 2);
  if (state.alarm.level >= 100 || touched) {
    state.phase = 'caught';
    finishScore();
    events.push({ type: 'caught' });
    return events;
  }

  // Getaway: sapphire in hand, at the dock door.
  if (atExit(p)) {
    state.phase = 'win';
    finishScore();
    events.push({ type: 'win' });
  }
  return events;
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;
  if (!state.shot) {
    const events = update(dt);
    playEvents(audio, events, state.alarm.level);
  }
  drawGame(ctx, state, state.time);
  if (state.shotLabel) drawShotLabel(ctx, state.shotLabel);
  requestAnimationFrame(frame);
}

// --- input ----------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  ensureAudio(audio);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'Enter' && state.phase === 'title') {
    state.phase = 'playing';
  }
  if (e.code === 'KeyR' && (state.phase === 'caught' || state.phase === 'win')) {
    resetGame();
  }
  if (e.code === 'KeyQ' && state.phase === 'playing') {
    fireEmp(state.player, state, []);
  }
});

window.addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('mousedown', (e) => {
  ensureAudio(audio);
  if (state.phase !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  const tx = ((e.clientX - r.left) / r.width) * CANVAS_W;
  const ty = ((e.clientY - r.top) / r.height) * CANVAS_H;
  throwSmoke(state.player, tx, ty, state.smokes, []);
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// --- boot -----------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number(params.get('seed') || '1');
  state.shotLabel = applyShot(state, shot, seed);
  // Shot mode: draw the frozen frame, never advance the simulation.
  drawGame(ctx, state, state.time);
  if (state.shotLabel) drawShotLabel(ctx, state.shotLabel);
} else {
  requestAnimationFrame(frame);
}
