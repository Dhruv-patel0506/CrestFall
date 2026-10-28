import React, { useEffect, useState } from 'react';

/* ===========================================================================
   IntroTransition
   Rebuilt from the reference clip:

     1. giant company wordmark scrolls edge-to-edge behind everything
     2. a centred pill counts 0 -> 100%, its accent fill growing as the
        engine actually finishes the work (never a fake timer)
     3. at 100% the label swaps to WELCOME and the fill collapses to a block
     4. the pill scales up until it covers the viewport - the screen is black
     5. the overlay lifts away and the dashboard rises into place

   The counter is driven by `progress`, which the dashboard reports from real
   fetch completions, so the animation is exactly as long as the computation.
   =========================================================================== */

const HOLD_WELCOME_MS = 560;
const EXPAND_MS = 640;
const OUT_MS = 520;

// Reduced motion shortens the reveal, it never removes it: the counter, the
// WELCOME swap and a soft cross-fade still play, only the aggressive scale-up
// and the scrolling wordmark are dropped (see the CSS at the bottom).
const TIMINGS = motion => (motion
  ? { welcome: HOLD_WELCOME_MS, expand: EXPAND_MS, out: OUT_MS }
  : { welcome: 240, expand: 0, out: 340 });

export default function IntroTransition({ companyName, ticker, progress, task, ready, onReveal, onFinished }) {
  const [shown, setShown] = useState(0);
  const [stage, setStage] = useState('loading');
  // Once the pill has blown up it stays blown up: the `out` fade must not snap
  // the giant black shape back to a small pill for a frame.
  const [expanded, setExpanded] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Ease the displayed number toward the true one. It can only ever reach 100
  // when the data is genuinely there, because `ready` gates the target.
  useEffect(() => {
    if (reduced) { setShown(ready ? 100 : progress); return undefined; }
    let raf = 0;
    const step = () => {
      const target = ready ? 100 : Math.min(97, progress);
      setShown(current => {
        const next = current + (target - current) * 0.12;
        return Math.abs(target - next) < 0.4 ? target : next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [progress, ready, reduced]);

  // loading -> welcome -> expand -> out (dashboard starts fading in) -> unmount
  useEffect(() => {
    if (!ready || shown < 99.6) return undefined;
    const beat = TIMINGS(!reduced);
    setStage('welcome');
    const timers = [];
    if (beat.expand > 0) {
      timers.push(setTimeout(() => { setExpanded(true); setStage('expand'); }, beat.welcome));
    }
    const outAt = beat.welcome + beat.expand;
    timers.push(setTimeout(() => { setStage('out'); onReveal?.(); }, outAt));
    timers.push(setTimeout(() => onFinished(), outAt + beat.out + 60));
    return () => timers.forEach(clearTimeout);
  }, [ready, shown, reduced, onFinished, onReveal]);

  const words = companyName ? [companyName.toUpperCase(), ticker ? ticker.toUpperCase() : '', 'RISE & FALL', 'READ FROM THE RECORD'] : ['CRESTFALL'];
  const line = words.filter(Boolean).join('   ·   ');

  // Once the count is done the accent fill drains and stays drained. If it were
  // allowed to return for the expand stage, the screen-filling shape would be
  // the gradient instead of black.
  const drained = stage !== 'loading';
  const fillScale = drained ? 0 : Math.max(0, Math.min(1, shown / 100));

  return (
    <div className={`intro stage-${stage} ${expanded ? 'expanded' : ''} ${reduced ? 'calm' : ''}`} aria-hidden={stage !== 'loading'} role="presentation">
      <div className="intro-field">
        <div className="intro-marquee">
          <div className="intro-marquee-track">
            <span>{line}</span>
            <span>{line}</span>
          </div>
        </div>
        <div className="intro-marquee intro-marquee-ghost">
          <div className="intro-marquee-track intro-marquee-track-reverse">
            <span>CRESTFALL   ·   PEAK   ·   CRASH   ·   TIMING   ·   SCENARIOS</span>
            <span>CRESTFALL   ·   PEAK   ·   CRASH   ·   TIMING   ·   SCENARIOS</span>
          </div>
        </div>
      </div>

      <header className="intro-bar">
        <span className="intro-mark">CF</span>
        <span className="intro-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      </header>

      <div className="intro-pill-wrap">
        <div className="intro-pill">
          <i className="intro-pill-fill" style={{ transform: `scaleX(${fillScale})` }} />
          <span className="intro-pill-label">{stage === 'loading' ? 'LOADING' : 'WELCOME'}</span>
          <span className="intro-pill-count">{Math.round(Math.max(0, Math.min(100, shown)))}%</span>
        </div>
        <p className="intro-sr-only" aria-live="polite">{task || 'warming the engine'}</p>
      </div>
    </div>
  );
}
