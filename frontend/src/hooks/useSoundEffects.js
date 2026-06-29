import { useCallback, useState } from 'react';

const LS_KEY = 'manoa_sound_muted';

// Module-level AudioContext singleton — created lazily on first sound call
// (must happen inside a user-gesture handler to satisfy browser autoplay policy)
let _ctx = null;

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// Volume envelope helpers — linearRamp prevents the click/pop at note boundaries
function applyEnvelope(gainNode, startTime, attackDuration, sustainEnd, releaseDuration, peak) {
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peak, startTime + attackDuration);
  gainNode.gain.setValueAtTime(peak, sustainEnd);
  gainNode.gain.linearRampToValueAtTime(0, sustainEnd + releaseDuration);
}

// C5 (523 Hz) → E5 (659 Hz), two notes ascending, total ~370ms
function rawPlaySuccess() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    // Note 1: C5
    const g1 = ctx.createGain();
    applyEnvelope(g1, t, 0.012, t + 0.13, 0.05, 0.28);
    g1.connect(ctx.destination);
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = 523.25;
    o1.connect(g1);
    o1.start(t);
    o1.stop(t + 0.19);

    // Note 2: E5 — starts at 140ms (slight overlap smooths the transition)
    const g2 = ctx.createGain();
    applyEnvelope(g2, t + 0.14, 0.012, t + 0.30, 0.06, 0.32);
    g2.connect(ctx.destination);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 659.25;
    o2.connect(g2);
    o2.start(t + 0.14);
    o2.stop(t + 0.38);
  } catch {}
}

// Descending tone 330 Hz → 220 Hz, ~270ms, gentle
function rawPlayFailure() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;

    const g = ctx.createGain();
    applyEnvelope(g, t, 0.01, t + 0.13, 0.13, 0.18);
    g.connect(ctx.destination);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(330, t);
    o.frequency.linearRampToValueAtTime(220, t + 0.26);
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

  const playSuccess = useCallback(() => { if (!muted) rawPlaySuccess(); }, [muted]);
  const playFailure = useCallback(() => { if (!muted) rawPlayFailure(); }, [muted]);

  return { playSuccess, playFailure, muted, toggleMute };
}
