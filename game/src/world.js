// Midnight Vault — the Halcyon Museum gallery: walls, cover, loot and exits.
// The layout is hand-placed, not generated: three routes cross the room,
// and every prop is cover the thief can break line of sight behind.

import { ROOM } from './config.js';

// Solid rectangles the thief and the guards walk around. The outer walls
// frame the room; the inner ones are pillars, cases and crates.
export const WALLS = [
  // Outer walls (thick, frame the room).
  { x: ROOM.x - 14, y: ROOM.y - 14, w: ROOM.w + 28, h: 14 }, // north
  { x: ROOM.x - 14, y: ROOM.y + ROOM.h, w: ROOM.w + 28, h: 14 }, // south
  { x: ROOM.x - 14, y: ROOM.y, w: 14, h: ROOM.h }, // west
  { x: ROOM.x + ROOM.w, y: ROOM.y, w: 14, h: ROOM.h }, // east
  // Marble pillars (cover in the open floor).
  { x: 300, y: 240, w: 34, h: 34 },
  { x: 620, y: 240, w: 34, h: 34 },
  { x: 940, y: 240, w: 34, h: 34 },
  { x: 300, y: 470, w: 34, h: 34 },
  { x: 940, y: 470, w: 34, h: 34 },
  // Display cases (low, block movement, block sight).
  { x: 180, y: 170, w: 150, h: 46 },
  { x: 950, y: 170, w: 150, h: 46 },
  { x: 180, y: 540, w: 150, h: 46 },
  // Storage crates in the south-west corner (the quiet route).
  { x: 120, y: 420, w: 70, h: 70 },
  { x: 195, y: 445, w: 60, h: 60 },
  // The vault plinth the sapphire sits on.
  { x: 596, y: 128, w: 88, h: 52 },
];

// Paintings and benches are decoration: they draw, they do not block.
export const DECOR = [
  { kind: 'painting', x: 430, y: 96, w: 90, h: 26, hue: '#7a5c2e' },
  { kind: 'painting', x: 760, y: 96, w: 90, h: 26, hue: '#2e5d7a' },
  { kind: 'painting', x: 430, y: 614, w: 90, h: 26, hue: '#5d2b33' },
  { kind: 'painting', x: 760, y: 614, w: 90, h: 26, hue: '#3d6b35' },
  { kind: 'bench', x: 500, y: 330, w: 90, h: 22 },
  { kind: 'bench', x: 700, y: 330, w: 90, h: 22 },
  { kind: 'plant', x: 88, y: 130, r: 22 },
  { kind: 'plant', x: 1160, y: 580, r: 22 },
  { kind: 'plant', x: 1160, y: 130, r: 22 },
];

// The Star Sapphire, on its pedestal in the north gallery.
export const SAPPHIRE = { x: 640, y: 154, r: 12 };

// Three side gems in cases: optional loot for the bold.
export const GEMS = [
  { x: 255, y: 193, r: 9, taken: false, color: '#ff7ad9' },
  { x: 1025, y: 193, r: 9, taken: false, color: '#ffd76a' },
  { x: 255, y: 563, r: 9, taken: false, color: '#8dff9e' },
];

// The loading-dock door: the getaway, locked until the sapphire is taken.
export const EXIT = { x: 1140, y: 560, w: 84, h: 60 };

// Where Rook slips in, south-west service door.
export const SPAWN = { x: 110, y: 570 };

// Guard patrol loops (waypoints in room coordinates).
export const PATROLS = [
  // Wren walks the north gallery, past the sapphire.
  [
    { x: 200, y: 140 }, { x: 640, y: 140 }, { x: 1080, y: 140 }, { x: 640, y: 140 },
  ],
  // Pike sweeps the middle floor, between the pillars.
  [
    { x: 200, y: 360 }, { x: 1080, y: 360 }, { x: 1080, y: 300 }, { x: 200, y: 300 },
  ],
  // Marlowe guards the south hall and the dock door.
  [
    { x: 380, y: 540 }, { x: 900, y: 540 }, { x: 900, y: 460 }, { x: 380, y: 460 },
  ],
];

export const GUARD_NAMES = ['Wren', 'Pike', 'Marlowe'];

// Camera mounts: fixed on the walls, sweeping their cones.
export const CAMERA_MOUNTS = [
  { x: 640, y: 100, baseAngle: Math.PI / 2, label: 'CAM-01' }, // north wall, looks south
  { x: 60, y: 360, baseAngle: 0, label: 'CAM-02' }, // west wall, looks east
  { x: 1220, y: 360, baseAngle: Math.PI, label: 'CAM-03' }, // east wall, looks west
];

// --- geometry helpers -------------------------------------------------------

// Circle vs rectangle collision: push the circle out of the rect.
export function resolveCircleRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 === 0) return { x: px, y: rect.y - r };
  const d = Math.sqrt(d2);
  return { x: px + (dx / d) * (r - d), y: py + (dy / d) * (r - d) };
}

// Does segment (x1,y1)-(x2,y2) hit any wall? Used for line of sight.
export function segmentBlocked(x1, y1, x2, y2) {
  for (const w of WALLS) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Quick reject by bounding box.
  if (Math.max(x1, x2) < r.x || Math.min(x1, x2) > r.x + r.w) return false;
  if (Math.max(y1, y2) < r.y || Math.min(y1, y2) > r.y + r.h) return false;
  // An endpoint inside the rect means a hit.
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  // Otherwise test the four edges.
  return (
    segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y)
  );
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}

// Is a point inside any wall? (keeps spawned things out of solid rock)
export function pointInWalls(x, y) {
  return WALLS.some((w) => pointInRect(x, y, w));
}

// Deterministic PRNG (mulberry32) for shot setups and particles.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
