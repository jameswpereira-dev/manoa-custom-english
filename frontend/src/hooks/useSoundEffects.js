import { useCallback, useState } from 'react';

const LS_KEY = 'manoa_sound_muted';

let _ctx = null;

function getCtx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio API not supported');
  if (!_ctx) _ctx = new AudioCtx();
  return _ctx;
}

// Call synchronously inside a user-gesture handler (before any await).
// Once the AudioContext is resumed within a gesture, it stays running
// permanently — even if playSuccess/playFailure are called after async gaps.
function warmupCtx() {
  try {
    const ctx = getCtx();
    if (ctx.state !== 'running') ctx.resume(); // fire-and-forget; fast within gesture
  } catch {}
}

// C5 (523 Hz) → E5 (659 Hz) ascending, ~380ms total
async function rawPlaySuccess() {
  try {
    const ctx = getCtx();
    // Await resume so ctx.currentTime advances correctly (critical on Safari)
    if (ctx.state !== 'running') await ctx.resume();
    const t = ctx.currentTime + 0.005; // tiny offset — never schedule exactly at 0

    // Note 1: C5
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.28, t + 0.012);
    g1.gain.setValueAtTime(0.28, t + 0.13);
    g1.gain.linearRampToValueAtTime(0, t + 0.175);
    g1.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 523.25;
    o1.connect(g1);
    o1.start(t);
    o1.stop(t + 0.19);

    // Note 2: E5 — starts 140ms in, slight overlap with note 1
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t + 0.14);
    g2.gain.linearRampToValueAtTime(0.32, t + 0.155);
    g2.gain.setValueAtTime(0.32, t + 0.30);
    g2.gain.linearRampToValueAtTime(0, t + 0.365);
    g2.connect(ctx.destination);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 659.25;
    o2.connect(g2);
    o2.start(t + 0.14);
    o2.stop(t + 0.38);
  } catch {}
}

// Descending 330 Hz → 220 Hz, ~280ms, soft
async function rawPlayFailure() {
  try {
    const ctx = getCtx();
    if (ctx.state !== 'running') await ctx.resume();
    const t = ctx.currentTime + 0.005;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.01);
    g.gain.setValueAtTime(0.18, t + 0.13);
    g.gain.linearRampToValueAtTime(0, t + 0.265);
    g.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(330, t);
    o.frequency.linearRampToValueAtTime(220, t + 0.27);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.28);
  } catch {}
}

export function useSoundEffects() {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
  });

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(LS_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // warmup: call this synchronously inside the user-gesture handler (before any await)
  // to guarantee the AudioContext is unlocked before async work begins
  const warmup = useCallback(() => warmupCtx(), []);

  const playSuccess = useCallback(() => { if (!muted) rawPlaySuccess(); }, [muted]);
  const playFailure = useCallback(() => { if (!muted) rawPlayFailure(); }, [muted]);

  return { playSuccess, playFailure, muted, toggleMute, warmup };
}
