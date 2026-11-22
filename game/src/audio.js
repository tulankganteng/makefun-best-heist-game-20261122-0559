// Midnight Vault — all sound is synthesized with WebAudio, no audio files.
// A low drone for tension, soft steps, a chime for loot, a siren when the
// alarm climbs, a sting when a guard spots you. Nothing loads over the net.

export function makeAudio() {
  return {
    ctx: null,
    master: null,
    droneOsc: null,
    droneGain: null,
    alarmOsc: null,
    alarmGain: null,
    started: false,
  };
}

// AudioContext needs a user gesture; call this from the first key or click.
export function ensureAudio(a) {
  if (a.started) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    a.ctx = new Ctx();
    a.master = a.ctx.createGain();
    a.master.gain.value = 0.5;
    a.master.connect(a.ctx.destination);

    // The tension drone: two detuned low sines through a slow LFO.
    a.droneOsc = a.ctx.createOscillator();
    a.droneOsc.type = 'sine';
    a.droneOsc.frequency.value = 55;
    const drone2 = a.ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 55.7;
    a.droneGain = a.ctx.createGain();
    a.droneGain.gain.value = 0.045;
    a.droneOsc.connect(a.droneGain);
    drone2.connect(a.droneGain);
    a.droneGain.connect(a.master);
    a.droneOsc.start();
    drone2.start();

    // The alarm siren, silent until the meter climbs.
    a.alarmOsc = a.ctx.createOscillator();
    a.alarmOsc.type = 'triangle';
    a.alarmOsc.frequency.value = 620;
    a.alarmGain = a.ctx.createGain();
    a.alarmGain.gain.value = 0;
    a.alarmOsc.connect(a.alarmGain);
    a.alarmGain.connect(a.master);
    a.alarmOsc.start();

    a.started = true;
  } catch (e) {
    // No audio on this machine: the game plays silent, never crashes.
    a.started = false;
  }
}

function blip(a, freq, dur, type, vol, slideTo) {
  if (!a.started || !a.ctx) return;
  const t = a.ctx.currentTime;
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(a.master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

// Drain the event queue the game loop collected this frame.
export function playEvents(a, events, alarmLevel) {
  if (!a.started) return;
  for (const e of events) {
    if (e.type === 'step') blip(a, e.sneaking ? 140 : 190, 0.06, 'sine', 0.06);
    if (e.type === 'smoke') blip(a, 320, 0.35, 'sine', 0.12, 90);
    if (e.type === 'emp') blip(a, 880, 0.3, 'square', 0.07, 220);
    if (e.type === 'gem') {
      blip(a, 920, 0.12, 'sine', 0.14);
      setTimeout(() => blip(a, 1380, 0.18, 'sine', 0.14), 90);
    }
    if (e.type === 'sapphire') {
      [660, 880, 1100, 1320].forEach((f, i) =>
        setTimeout(() => blip(a, f, 0.22, 'sine', 0.15), i * 90),
      );
    }
    if (e.type === 'spotted') {
      blip(a, 220, 0.4, 'sawtooth', 0.16, 440);
      blip(a, 233, 0.4, 'sawtooth', 0.16, 466);
    }
    if (e.type === 'caught') {
      [440, 349, 293, 220].forEach((f, i) =>
        setTimeout(() => blip(a, f, 0.3, 'triangle', 0.16), i * 160),
      );
    }
    if (e.type === 'win') {
      [523, 659, 784, 1046].forEach((f, i) =>
        setTimeout(() => blip(a, f, 0.3, 'sine', 0.15), i * 120),
      );
    }
  }
  // The siren follows the alarm meter: quiet when calm, loud near the top.
  if (a.alarmGain) {
    const target = alarmLevel > 55 ? (alarmLevel - 55) / 45 * 0.05 : 0;
    a.alarmGain.gain.setTargetAtTime(target, a.ctx.currentTime, 0.2);
    if (a.alarmOsc) {
      a.alarmOsc.frequency.setTargetAtTime(
        620 + Math.sin(a.ctx.currentTime * 4) * 90,
        a.ctx.currentTime,
        0.05,
      );
    }
  }
}
