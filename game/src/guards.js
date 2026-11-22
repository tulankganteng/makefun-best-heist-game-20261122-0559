// Midnight Vault — the museum guards: patrol, vision cones, suspicion.
// A guard only sees what is inside the cone AND in line of sight, so
// pillars, cases and crates are real cover, not decoration.

import { GUARD, CAMERA } from './config.js';
import { segmentBlocked } from './world.js';

export function makeGuard(name, waypoints, startIndex = 0) {
  const start = waypoints[startIndex];
  return {
    name,
    waypoints,
    wp: (startIndex + 1) % waypoints.length,
    x: start.x,
    y: start.y,
    angle: 0,
    suspicion: 0,
    chasing: false,
    unseenFor: 0,
    paused: 0, // brief pause at each waypoint, looks around
    state: 'patrol', // patrol | chase | return
  };
}

// Angle from the guard to a point, and whether the point is inside the cone.
export function inCone(gx, gy, angle, tx, ty, range, halfAngle) {
  const dx = tx - gx;
  const dy = ty - gy;
  const d2 = dx * dx + dy * dy;
  if (d2 > range * range) return false;
  const want = Math.atan2(dy, dx);
  let diff = want - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

// One guard, one tick. Returns nothing; mutates the guard.
// player: {x, y, sneaking, inSmoke}. alarm: {level} — raised by the caller.
export function updateGuard(g, dt, player, alarm) {
  const seen = canSeeGuard(g, player);
  if (seen) {
    const rate = GUARD.suspicionRise * (player.sneaking ? 0.45 : 1);
    g.suspicion = Math.min(100, g.suspicion + rate * dt);
    g.unseenFor = 0;
  } else {
    g.suspicion = Math.max(0, g.suspicion - GUARD.suspicionFall * dt);
    g.unseenFor += dt;
  }

  if (g.suspicion >= GUARD.chaseAt && !g.chasing) {
    g.chasing = true;
    g.state = 'chase';
  }
  if (g.chasing && g.unseenFor > GUARD.loseSightAfter) {
    g.chasing = false;
    g.state = 'return';
  }

  if (g.state === 'chase') {
    // Run at the thief's last seen spot; the caller keeps lastSeen fresh.
    const t = g.target || { x: player.x, y: player.y };
    moveToward(g, t.x, t.y, GUARD.chaseSpeed, dt);
    g.angle = Math.atan2(t.y - g.y, t.x - g.x);
    if (g.unseenFor > GUARD.loseSightAfter) g.state = 'return';
  } else if (g.state === 'return') {
    // Walk back to the nearest waypoint, then resume the patrol.
    const w = nearestWaypoint(g);
    moveToward(g, w.x, w.y, GUARD.patrolSpeed, dt);
    g.angle = Math.atan2(w.y - g.y, w.x - g.x);
    if (dist(g.x, g.y, w.x, w.y) < 8) {
      g.wp = (g.waypoints.indexOf(w) + 1) % g.waypoints.length;
      g.state = 'patrol';
    }
  } else {
    // Patrol: walk the loop, pausing at each waypoint to scan.
    if (g.paused > 0) {
      g.paused -= dt;
      g.angle += 0.9 * dt; // look around while waiting
      return;
    }
    const w = g.waypoints[g.wp];
    moveToward(g, w.x, w.y, GUARD.patrolSpeed, dt);
    g.angle = Math.atan2(w.y - g.y, w.x - g.x);
    if (dist(g.x, g.y, w.x, w.y) < 6) {
      g.wp = (g.wp + 1) % g.waypoints.length;
      g.paused = 0.9;
    }
  }

  // Suspicion over 50 feeds the alarm meter.
  if (g.suspicion > 50) {
    alarm.level = Math.min(100, alarm.level + (g.suspicion - 50) * 0.16 * dt);
  }
}

export function canSeeGuard(g, player) {
  if (player.inSmoke) return false;
  if (!inCone(g.x, g.y, g.angle, player.x, player.y, GUARD.visionRange, GUARD.visionHalfAngle)) return false;
  return !segmentBlocked(g.x, g.y, player.x, player.y);
}

function moveToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
}

function nearestWaypoint(g) {
  let best = g.waypoints[0];
  let bd = Infinity;
  for (const w of g.waypoints) {
    const d = dist(g.x, g.y, w.x, w.y);
    if (d < bd) {
      bd = d;
      best = w;
    }
  }
  return best;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// The camera's sweeping cone: same shape as a guard's, red instead of gold.
export function cameraAngle(mount, t, disabledUntil) {
  if (t < disabledUntil) return mount.baseAngle; // EMP: frozen, cone off
  return mount.baseAngle + Math.sin(t * CAMERA.sweepSpeed) * CAMERA.sweepArc;
}

export function cameraSees(mount, angle, player) {
  if (player.inSmoke) return false;
  if (!inCone(mount.x, mount.y, angle, player.x, player.y, CAMERA.range, CAMERA.halfAngle)) return false;
  return !segmentBlocked(mount.x, mount.y, player.x, player.y);
}
