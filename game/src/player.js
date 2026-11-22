// Midnight Vault — Rook, the thief: movement, sneaking, tools, the grab.
// Keyboard moves, mouse aims the smoke pellet, E works the lock, Q fires
// the EMP. Everything here is input; the world decides what it sees.

import { PLAYER, TOOLS, LOOT } from './config.js';
import { WALLS, resolveCircleRect, SAPPHIRE, GEMS, EXIT } from './world.js';

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    radius: PLAYER.radius,
    sneaking: false,
    facing: -Math.PI / 2,
    smoke: TOOLS.smokeCount,
    emp: TOOLS.empCount,
    hasSapphire: false,
    gemsTaken: 0,
    channel: 0, // lockpick progress 0..1, resets if you move off
    channelTarget: null, // 'sapphire' | gem index | null
    inSmoke: false,
    lastStepAt: 0,
  };
}

// keys: Set of codes held down. dt in seconds. smokes: array to push new clouds into.
export function updatePlayer(p, keys, dt, smokes, events) {
  let ix = 0;
  let iy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;
  const moving = ix !== 0 || iy !== 0;
  p.sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');

  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
  if (moving) {
    const len = Math.hypot(ix, iy);
    p.vx += (ix / len) * PLAYER.accel * dt;
    p.vy += (iy / len) * PLAYER.accel * dt;
    p.facing = Math.atan2(iy, ix);
  }
  // Friction caps the speed.
  p.vx -= p.vx * Math.min(1, PLAYER.friction * dt);
  p.vy -= p.vy * Math.min(1, PLAYER.friction * dt);
  const v = Math.hypot(p.vx, p.vy);
  if (v > speed) {
    p.vx = (p.vx / v) * speed;
    p.vy = (p.vy / v) * speed;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // Walls push back.
  for (const w of WALLS) {
    const fixed = resolveCircleRect(p.x, p.y, p.radius, w);
    if (fixed) {
      p.x = fixed.x;
      p.y = fixed.y;
    }
  }
  // Stay inside the room.
  p.x = Math.max(64, Math.min(1216, p.x));
  p.y = Math.max(110, Math.min(622, p.y));

  // Footstep tick for the audio layer.
  if (moving && v > 40) {
    p.lastStepAt += dt;
    if (p.lastStepAt > (p.sneaking ? 0.55 : 0.34)) {
      p.lastStepAt = 0;
      events.push({ type: 'step', sneaking: p.sneaking });
    }
  }

  // Moving cancels a lockpick channel.
  if (moving && v > 30) {
    p.channel = 0;
    p.channelTarget = null;
  }
}

// Throw a smoke pellet at a point (mouse click). Returns true if thrown.
export function throwSmoke(p, tx, ty, smokes, events) {
  if (p.smoke <= 0) return false;
  p.smoke -= 1;
  smokes.push({ x: tx, y: ty, r: TOOLS.smokeRadius, left: TOOLS.smokeSeconds });
  events.push({ type: 'smoke' });
  return true;
}

// Fire the EMP: cameras go dark for a while, at a score cost.
export function fireEmp(p, state, events) {
  if (p.emp <= 0) return false;
  p.emp -= 1;
  state.empUntil = state.time + 6;
  state.score -= TOOLS.empScoreCost;
  events.push({ type: 'emp' });
  return true;
}

// E held near a loot spot: run the lockpick channel. Returns what finished.
export function workChannel(p, keys, dt, events) {
  const near = nearestLoot(p);
  if (!keys.has('KeyE') || !near) {
    p.channel = 0;
    p.channelTarget = null;
    return null;
  }
  if (p.channelTarget !== near.id) {
    p.channelTarget = near.id;
    p.channel = 0;
  }
  p.channel += dt / LOOT.channelSeconds;
  if (p.channel >= 1) {
    p.channel = 0;
    p.channelTarget = null;
    if (near.id === 'sapphire') {
      p.hasSapphire = true;
      events.push({ type: 'sapphire' });
      return 'sapphire';
    }
    const gem = GEMS[near.gemIndex];
    gem.taken = true;
    p.gemsTaken += 1;
    events.push({ type: 'gem' });
    return 'gem';
  }
  return null;
}

function nearestLoot(p) {
  const dSap = Math.hypot(p.x - SAPPHIRE.x, p.y - SAPPHIRE.y);
  if (dSap < 52 && !p.hasSapphire) return { id: 'sapphire' };
  for (let i = 0; i < GEMS.length; i++) {
    const g = GEMS[i];
    if (g.taken) continue;
    if (Math.hypot(p.x - g.x, p.y - g.y) < 46) return { id: 'gem' + i, gemIndex: i };
  }
  return null;
}

// At the dock door with the sapphire: the getaway.
export function atExit(p) {
  return (
    p.hasSapphire &&
    p.x > EXIT.x - 10 &&
    p.x < EXIT.x + EXIT.w + 10 &&
    p.y > EXIT.y - 10 &&
    p.y < EXIT.y + EXIT.h + 10
  );
}
