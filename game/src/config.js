// Midnight Vault — tuning constants for the whole heist.
// One place holds every number the other modules read, so balancing
// never means hunting through the game code.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// The gallery floor the thief crosses (inside the outer walls).
export const ROOM = { x: 50, y: 96, w: 1180, h: 540 };

// Thief movement.
export const PLAYER = {
  radius: 13,
  speed: 205, // px per second, walking
  sneakSpeed: 118, // Shift: slower, harder to spot
  accel: 2400,
  friction: 9,
};

// Guards on patrol.
export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  chaseSpeed: 132,
  visionRange: 265,
  visionHalfAngle: 0.56, // radians, ~32 degrees each side
  suspicionRise: 62, // per second while the thief is seen
  suspicionFall: 26, // per second while unseen
  chaseAt: 100, // suspicion that starts a chase
  loseSightAfter: 2.2, // seconds unseen before giving up the chase
};

// Wall cameras, sweeping their cones.
export const CAMERA = {
  range: 300,
  halfAngle: 0.5,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 1.15, // radians each side of the base angle
  alarmRise: 20, // alarm per second while the thief is in a cone
  empDisableSeconds: 6,
};

// The alarm meter: 0 calm, 100 busted.
export const ALARM = {
  risePerSuspicion: 0.16, // alarm per second per point of guard suspicion over 50
  decay: 3.5, // alarm per second while nobody sees you
  warnAt: 55, // HUD turns amber
  dangerAt: 80, // HUD turns red, heartbeat starts
};

// Tools. Every tool costs something: smoke is limited, the EMP costs score.
export const TOOLS = {
  smokeCount: 3,
  smokeRadius: 95,
  smokeSeconds: 4,
  empCount: 1,
  empScoreCost: 100,
};

// The lockpick channel on the sapphire pedestal.
export const LOOT = {
  channelSeconds: 1.2,
  sapphireValue: 500,
  gemValue: 150, // each side gem
};

// Scoring.
export const SCORE = {
  base: 1000,
  timeBonusPerSecond: 8, // under par time
  parSeconds: 150,
  alarmPenaltyPerPoint: 6, // final alarm level is subtracted
};

export const COLORS = {
  floorA: '#20242e',
  floorB: '#262b38',
  rug: '#5d2b33',
  wall: '#4a5068',
  wallTrim: '#c9a227',
  cone: 'rgba(255, 214, 90, 0.32)',
  coneEdge: 'rgba(255, 214, 90, 0.65)',
  camCone: 'rgba(255, 77, 77, 0.26)',
  camConeEdge: 'rgba(255, 77, 77, 0.6)',
  loot: '#7fe7ff',
  lootGlow: 'rgba(127, 231, 255, 0.35)',
  exit: '#58d68d',
  player: '#e8e6df',
  guard: '#e74c3c',
  smoke: 'rgba(200, 205, 215, 0.55)',
};
