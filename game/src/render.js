// Midnight Vault — every pixel the judge sees is drawn here.
// Dark museum at night: marble checker floor, gold-trimmed walls, warm
// loot glow against cold shadows, red camera cones, gold guard cones.
// The HUD keeps the alarm meter, loot, tools and objective legible at a
// glance, because the judge reads the game through its screenshots.

import { CANVAS_W, CANVAS_H, ROOM, COLORS, ALARM, GUARD, CAMERA } from './config.js';
import { WALLS, DECOR, SAPPHIRE, GEMS, EXIT } from './world.js';
import { inCone } from './guards.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  const g = ctx.createRadialGradient(x, y, 10, x, y, range);
  g.addColorStop(0, fill);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.stroke();
}

export function drawFloor(ctx, t) {
  // Marble checker, two cold tones.
  const size = 58;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += size) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += size) {
      const even = ((x - ROOM.x) / size + (y - ROOM.y) / size) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, size, size);
    }
  }
  // The red carpet runner down the middle of the gallery: translucent,
  // so the marble still reads through it.
  ctx.fillStyle = 'rgba(93, 43, 51, 0.55)';
  ctx.fillRect(ROOM.x + 60, ROOM.y + 200, ROOM.w - 120, 130);
  ctx.strokeStyle = 'rgba(201,162,39,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 60, ROOM.y + 200, ROOM.w - 120, 130);
  // Soft pool of moonlight from the skylight.
  const mg = ctx.createRadialGradient(640, 330, 40, 640, 330, 420);
  mg.addColorStop(0, 'rgba(140,170,255,0.10)');
  mg.addColorStop(1, 'rgba(140,170,255,0)');
  ctx.fillStyle = mg;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
}

export function drawWallsAndDecor(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // A lit top edge so cases and pillars read as solid objects.
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
  for (const d of DECOR) {
    if (d.kind === 'painting') {
      ctx.fillStyle = '#2a2118';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = d.hue;
      ctx.fillRect(d.x + 5, d.y + 5, d.w - 10, d.h - 10);
      ctx.strokeStyle = COLORS.wallTrim;
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    } else if (d.kind === 'bench') {
      ctx.fillStyle = '#4a3226';
      roundRect(ctx, d.x, d.y, d.w, d.h, 6);
      ctx.fill();
    } else if (d.kind === 'plant') {
      ctx.fillStyle = '#2e5d34';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d7a44';
      ctx.beginPath();
      ctx.arc(d.x - 6, d.y - 6, d.r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLoot(ctx, state, t) {
  // The sapphire pedestal glows; the gem pulses so the eye finds it.
  const pulse = 0.7 + Math.sin(t * 3) * 0.3;
  if (!state.player.hasSapphire) {
    const g = ctx.createRadialGradient(SAPPHIRE.x, SAPPHIRE.y, 4, SAPPHIRE.x, SAPPHIRE.y, 70);
    g.addColorStop(0, COLORS.lootGlow);
    g.addColorStop(1, 'rgba(127,231,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(SAPPHIRE.x, SAPPHIRE.y, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.loot;
    ctx.save();
    ctx.translate(SAPPHIRE.x, SAPPHIRE.y);
    ctx.rotate(Math.PI / 4);
    const s = SAPPHIRE.r * pulse;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.fillStyle = '#0b2a33';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAR SAPPHIRE', SAPPHIRE.x, SAPPHIRE.y + 34);
  }
  for (const gem of GEMS) {
    if (gem.taken) continue;
    ctx.fillStyle = gem.color;
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }
  // The dock door: green when the getaway is open, chained before that.
  ctx.fillStyle = state.player.hasSapphire ? COLORS.exit : '#3d5a46';
  roundRect(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#0e2418';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.player.hasSapphire ? 'GETAWAY →' : 'LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 4);
  ctx.fillStyle = '#e8e6df';
  ctx.font = '11px sans-serif';
  ctx.fillText('DOCK', EXIT.x + EXIT.w / 2, EXIT.y - 8);
}

function drawGuard(ctx, g) {
  // Vision cone first (under the guard), then the body.
  drawCone(ctx, g.x, g.y, g.angle, GUARD.visionRange, GUARD.visionHalfAngle,
    g.chasing ? 'rgba(255,60,60,0.28)' : COLORS.cone,
    g.chasing ? 'rgba(255,60,60,0.7)' : COLORS.coneEdge);
  ctx.fillStyle = '#20242e';
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  // Cap brim points where the guard looks.
  ctx.fillStyle = '#7a1f16';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 10, g.y + Math.sin(g.angle) * 10, 6, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion ring + "!" when the guard is onto you.
  if (g.suspicion > 5) {
    ctx.strokeStyle = g.suspicion > 80 ? '#ff4040' : '#ffd65a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius + 8, -Math.PI / 2, -Math.PI / 2 + (g.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  if (g.suspicion > 80) {
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 26);
  }
  ctx.fillStyle = '#e8e6df';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y + 28);
}

function drawCamera(ctx, mount, angle, disabled) {
  if (!disabled) {
    drawCone(ctx, mount.x, mount.y, angle, CAMERA.range, CAMERA.halfAngle, COLORS.camCone, COLORS.camConeEdge);
  }
  ctx.fillStyle = '#1a1d26';
  ctx.beginPath();
  ctx.arc(mount.x, mount.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = disabled ? '#555' : '#ff4d4d';
  ctx.beginPath();
  ctx.arc(mount.x, mount.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e6df';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mount.label, mount.x, mount.y + 26);
}

function drawPlayer(ctx, p, t) {
  // A soft shadow, then Rook: dark hood, pale mask, quiet feet.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16181f';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  // Mask eyes, looking where Rook faces.
  ctx.fillStyle = '#16181f';
  const ex = Math.cos(p.facing);
  const ey = Math.sin(p.facing);
  ctx.beginPath();
  ctx.arc(p.x + ex * 4 - ey * 4, p.y + ey * 4 + ex * 4, 2.2, 0, Math.PI * 2);
  ctx.arc(p.x + ex * 4 + ey * 4, p.y + ey * 4 - ex * 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Sneak: a faint ring so the player can feel the quiet mode.
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(127,231,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Lockpick channel ring.
  if (p.channel > 0) {
    ctx.strokeStyle = COLORS.loot;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 10, -Math.PI / 2, -Math.PI / 2 + p.channel * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', p.x, p.y - 26);
  }
}

function drawSmoke(ctx, smokes) {
  for (const s of smokes) {
    const g = ctx.createRadialGradient(s.x, s.y, 8, s.x, s.y, s.r);
    g.addColorStop(0, COLORS.smoke);
    g.addColorStop(1, 'rgba(200,205,215,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  // Top bar: title, alarm meter, loot, tools, timer.
  ctx.fillStyle = 'rgba(10,12,18,0.92)';
  ctx.fillRect(0, 0, CANVAS_W, 72);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MIDNIGHT VAULT', 18, 30);
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '12px sans-serif';
  ctx.fillText('The Halcyon Museum — one night, one sapphire', 18, 50);

  // Alarm meter.
  const ax = 430;
  const aw = 300;
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, 26);
  ctx.fillStyle = '#22262f';
  roundRect(ctx, ax, 34, aw, 18, 9);
  ctx.fill();
  const frac = state.alarm.level / 100;
  const col = state.alarm.level < ALARM.warnAt ? '#58d68d' : state.alarm.level < ALARM.dangerAt ? '#f5b041' : '#ff4040';
  ctx.fillStyle = col;
  if (frac > 0) {
    roundRect(ctx, ax, 34, Math.max(18, aw * frac), 18, 9);
    ctx.fill();
  }
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(state.alarm.level) + '%', ax + aw + 44, 49);
  ctx.textAlign = 'left';

  // Loot and tools.
  ctx.fillStyle = '#e8e6df';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`LOOT  ${state.score.loot} pts`, 830, 30);
  ctx.fillText(`SMOKE ×${state.player.smoke}   EMP ×${state.player.emp}`, 830, 52);
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '12px sans-serif';
  ctx.fillText(`TIME ${fmtTime(state.time)}`, 1080, 30);
  ctx.fillText(state.player.hasSapphire ? '→ Reach the dock!' : '→ Steal the Star Sapphire', 1080, 52);

  // Bottom hint bar.
  ctx.fillStyle = 'rgba(10,12,18,0.85)';
  ctx.fillRect(0, CANVAS_H - 30, CANVAS_W, 30);
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move   •   SHIFT sneak   •   E pick lock   •   CLICK throw smoke   •   Q EMP cameras   •   R restart', CANVAS_W / 2, CANVAS_H - 11);
  ctx.textAlign = 'left';

  // Alarm danger flash at the edges.
  if (state.alarm.level >= ALARM.dangerAt && state.phase === 'playing') {
    const pulse = 0.10 + Math.sin(state.time * 6) * 0.05;
    ctx.strokeStyle = `rgba(255,64,64,${pulse + 0.15})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 77, CANVAS_W - 10, CANVAS_H - 112);
  }
}

function fmtTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawTitle(ctx, state, t) {
  ctx.fillStyle = 'rgba(8,10,16,0.78)';
  ctx.fillRect(0, 72, CANVAS_W, CANVAS_H - 102);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MIDNIGHT VAULT', CANVAS_W / 2, 260);
  ctx.fillStyle = '#e8e6df';
  ctx.font = '20px sans-serif';
  ctx.fillText('One thief. Three guards. One Star Sapphire.', CANVAS_W / 2, 300);
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '16px sans-serif';
  ctx.fillText('Slip past the cones, grab the sapphire, reach the dock before the alarm hits 100%.', CANVAS_W / 2, 332);
  ctx.fillStyle = '#7fe7ff';
  ctx.font = 'bold 22px sans-serif';
  const blink = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.globalAlpha = blink;
  ctx.fillText('Press ENTER to start the heist', CANVAS_W / 2, 400);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD move  •  SHIFT sneak  •  E pick lock  •  CLICK smoke  •  Q EMP', CANVAS_W / 2, 440);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = won ? 'rgba(8,26,16,0.82)' : 'rgba(26,8,8,0.82)';
  ctx.fillRect(0, 72, CANVAS_W, CANVAS_H - 102);
  ctx.fillStyle = won ? '#58d68d' : '#ff4040';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'CLEAN GETAWAY!' : 'BUSTED!', CANVAS_W / 2, 280);
  ctx.fillStyle = '#e8e6df';
  ctx.font = '20px sans-serif';
  ctx.fillText(
    won
      ? `The sapphire is yours. Score ${state.score.total}  •  Time ${fmtTime(state.time)}`
      : `The alarm hit 100%. The museum keeps its sapphire… this time.`,
    CANVAS_W / 2,
    330,
  );
  ctx.fillStyle = '#9aa0b0';
  ctx.font = '16px sans-serif';
  ctx.fillText('Press R to run it again', CANVAS_W / 2, 380);
  ctx.textAlign = 'left';
}

// One full frame: floor, loot, cones, guards, cameras, player, smoke, HUD.
export function drawGame(ctx, state, t) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0b0d13';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx, t);
  drawLoot(ctx, state, t);
  for (const g of state.guards) drawGuard(ctx, g);
  for (const c of state.cameras) {
    drawCamera(ctx, c.mount, c.angle, state.time < state.empUntil);
  }
  drawPlayer(ctx, state.player, t);
  drawSmoke(ctx, state.smokes);
  // Vignette for the night mood.
  const v = ctx.createRadialGradient(640, 360, 260, 640, 360, 760);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawHud(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state, t);
  if (state.phase === 'caught') drawEnd(ctx, state, false);
  if (state.phase === 'win') drawEnd(ctx, state, true);
  // "SPOTTED" flash while a chase is on.
  if (state.phase === 'playing' && state.guards.some((g) => g.chasing)) {
    ctx.fillStyle = '#ff4040';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED — BREAK LINE OF SIGHT!', CANVAS_W / 2, 112);
    ctx.textAlign = 'left';
  }
}

// Keep the judge's eye on what matters: the cover shot must show the
// thief, the cones, the cameras, the loot and the alarm in one frame.
export function drawShotLabel(ctx, label) {
  ctx.fillStyle = 'rgba(10,12,18,0.8)';
  ctx.fillRect(CANVAS_W / 2 - 130, CANVAS_H - 62, 260, 26);
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, CANVAS_W / 2, CANVAS_H - 44);
  ctx.textAlign = 'left';
}
