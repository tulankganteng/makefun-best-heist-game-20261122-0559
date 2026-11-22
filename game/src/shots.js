// Midnight Vault — deterministic screenshot setups.
// ?shot=start|play|alarm|getaway&seed=N renders one frozen moment of the
// game, so the screenshots are real renders of the game's own code and
// look the same every time they are taken.

import { makeGuard, cameraAngle } from './guards.js';
import { PATROLS, GUARD_NAMES, CAMERA_MOUNTS, SAPPHIRE } from './world.js';
import { mulberry32 } from './world.js';

// Place the guards on their patrols at fixed fractions, and set their
// facing so the cones sweep across the room in the shot.
export function placeGuardsForShot(state, seed) {
  const rnd = mulberry32(seed);
  state.guards = PATROLS.map((wp, i) => {
    const g = makeGuard(GUARD_NAMES[i], wp, 0);
    const f = [0.22, 0.55, 0.78][i] ?? 0.5;
    const a = wp[0];
    const b = wp[1];
    g.x = a.x + (b.x - a.x) * f;
    g.y = a.y + (b.y - a.y) * f;
    g.angle = Math.atan2(b.y - a.y, b.x - a.x) + (rnd() - 0.5) * 0.4;
    g.suspicion = 0;
    return g;
  });
}

export function applyShot(state, name, seed) {
  state.shot = name;
  state.time = 12.5; // fixed clock so cones and glows sit still
  placeGuardsForShot(state, seed);
  state.cameras = CAMERA_MOUNTS.map((m) => ({
    mount: m,
    angle: cameraAngle(m, state.time, -1),
  }));
  state.smokes = [];
  state.empUntil = -1;

  if (name === 'start') {
    state.phase = 'title';
    state.player.x = 640;
    state.player.y = 400;
    state.player.facing = -Math.PI / 2;
    state.alarm.level = 0;
    return 'The heist begins — title screen over the gallery';
  }

  if (name === 'play') {
    // THE cover: the thief mid-room, cones sweeping, cameras live, the
    // sapphire glowing, the alarm meter already a third full.
    state.phase = 'playing';
    state.player.x = 560;
    state.player.y = 430;
    state.player.facing = -Math.PI / 2.4;
    state.player.sneaking = true;
    state.alarm.level = 34;
    state.guards[0].suspicion = 42;
    state.guards[1].suspicion = 0;
    state.guards[2].suspicion = 18;
    return 'Mid-heist — thief, cones, cameras, loot and alarm in one frame';
  }

  if (name === 'alarm') {
    // The fair caught moment: Wren has spotted Rook, the chase is on,
    // the alarm is nearly full, a smoke cloud buys seconds.
    state.phase = 'playing';
    state.player.x = 520;
    state.player.y = 300;
    state.player.facing = Math.PI;
    state.player.smoke = 2;
    state.alarm.level = 78;
    state.guards[0].suspicion = 100;
    state.guards[0].chasing = true;
    state.guards[0].state = 'chase';
    state.guards[0].x = 430;
    state.guards[0].y = 260;
    state.guards[0].angle = Math.atan2(300 - 260, 520 - 430);
    state.smokes = [{ x: 560, y: 330, r: 95, left: 3 }];
    return 'Spotted — the chase is on and the alarm is nearly full';
  }

  if (name === 'getaway') {
    // The payoff: sapphire in hand, Rook at the dock door, alarm cooling.
    state.phase = 'playing';
    state.player.x = 1108;
    state.player.y = 592;
    state.player.facing = 0;
    state.player.hasSapphire = true;
    state.player.gemsTaken = 2;
    state.score.loot = 500 + 2 * 150;
    state.alarm.level = 41;
    state.guards[1].suspicion = 30;
    return 'The getaway — sapphire secured, Rook at the dock door';
  }

  // Unknown shot: plain mid-game frame.
  state.phase = 'playing';
  state.player.x = 640;
  state.player.y = 380;
  state.alarm.level = 12;
  return 'Midnight Vault';
}

// The four shots the entry hands in, in cover order.
export const SHOTS = [
  { name: '1-start.jpg', query: '?shot=start&seed=1' },
  { name: '2-play.jpg', query: '?shot=play&seed=1' },
  { name: '3-alarm.jpg', query: '?shot=alarm&seed=1' },
  { name: '4-getaway.jpg', query: '?shot=getaway&seed=1' },
];
