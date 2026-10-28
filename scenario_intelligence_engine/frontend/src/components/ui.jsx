import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/* ---------------------------------------------------------------------------
   Small helpers shared across the dashboard
   ------------------------------------------------------------------------ */
export const compactNumber = value => {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const fixedNumber = (value, decimals = 2) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/* Revenue and cash fields are USD millions. Turning 12,956 into "$13.0KM" is
   wrong twice over, so the unit is resolved here once. */
export const usdMillions = (value, prefix = '$') => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return `${prefix}0M`;
  if (Math.abs(numeric) >= 1e6) return `${prefix}${(numeric / 1e6).toFixed(2)}T`;
  if (Math.abs(numeric) >= 1e3) return `${prefix}${(numeric / 1e3).toFixed(1)}B`;
  return `${prefix}${numeric.toFixed(0)}M`;
};

/* A multi-hundred-thousand-percent change is technically correct and useless
   in a pitch. Above 1000% the multiple says the same thing in fewer glyphs. */
export const changeDisplay = (firstValue, lastValue) => {
  const first = Number(firstValue), last = Number(lastValue);
  if (!Number.isFinite(first) || !Number.isFinite(last) || !first) return { kind: 'none' };
  const ratio = last / first;
  const pct = (ratio - 1) * 100;
  if (Math.abs(pct) > 1000 && first > 0) return { kind: 'multiple', value: ratio, pct };
  return { kind: 'percent', value: pct };
};

// Axis labels adapt their precision to the plotted range so small-magnitude
// series (daily returns) never collapse into "0.01, 0.01, 0, -0".
export const axisNumber = (value, span) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  const decimals = span >= 1000 ? 0 : span >= 100 ? 1 : span >= 1 ? 2 : span >= 0.01 ? 3 : 4;
  const rounded = Number(value).toFixed(decimals);
  return Number(rounded) === 0 ? (0).toFixed(decimals) : rounded;
};

const looksNumeric = value => value !== null && value !== undefined && String(value).trim() !== '' && Number.isFinite(Number(value));

/* A return or volatility series straddles zero. Percentage change against a
   first value of -0.0004 is meaningless (it prints +450%), so those series get
   an absolute delta instead. */
export const isSignedSeries = values => {
  const clean = (values || []).filter(Number.isFinite);
  if (clean.length < 2) return false;
  return clean.some(item => item < 0) && clean.some(item => item > 0);
};

export const seriesSpan = values => {
  const clean = (values || []).filter(Number.isFinite);
  return clean.length ? Math.max(...clean) - Math.min(...clean) : 0;
};

/* Decimals that follow the size of the numbers, so daily_return does not
   collapse to "0.00 / -0" and a 44-billion close does not need 2 decimals.
   Capped at 4: a headline tile reading "0.000533" is precision nobody acts on. */
export const decimalsFor = span => (span >= 1000 ? 0 : span >= 100 ? 1 : span >= 1 ? 2 : span >= 0.01 ? 3 : 4);

/* ---------------------------------------------------------------------------
   Zoom domain  -  wheel / drag-select / double-click on any x axis
   Returns the visible index window plus the handlers a chart needs.
   ------------------------------------------------------------------------ */
export function useZoomDomain(pointCount, resetKey) {
  const [window_, setWindow] = useState(null);
  const total = Math.max(0, Number(pointCount) || 0);
  const active = Boolean(window_) && total > 0;
  const start = active ? window_[0] : 0;
  const end = active ? Math.min(window_[1], total) : total;

  // A zoom must not leak into the next company, range or metric.
  useEffect(() => { setWindow(null); }, [resetKey]);

  useEffect(() => {
    if (total > 0 && window_ && window_[0] >= total) setWindow(null);
  }, [total, window_]);

  const clampPair = (from, to) => {
    const lo = Math.max(0, Math.min(from, to));
    const hi = Math.min(total, Math.max(from, to));
    return hi - lo >= 2 ? [lo, hi] : null;
  };

  const zoomBy = (ratio, anchorIndex) => {
    if (total < 3) return;
    const lo = active ? start : 0;
    const hi = active ? end : total;
    const pivot = anchorIndex == null ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, anchorIndex));
    const leftSpan = (pivot - lo) * ratio;
    const rightSpan = (hi - pivot) * ratio;
    const next = clampPair(Math.round(pivot - leftSpan), Math.round(pivot + rightSpan));
    if (next) setWindow(next);
  };

  const zoomToRange = (fromIndex, toIndex) => {
    const next = clampPair(Math.floor(fromIndex), Math.ceil(toIndex));
    if (next) setWindow(next);
  };

  const panBy = fraction => {
    if (!active) return;
    const span = end - start;
    const shift = Math.round(span * fraction);
    const next = clampPair(start + shift, end + shift);
    if (next) setWindow(next);
  };

  const reset = () => setWindow(null);

  return { start, end, active, count: Math.max(0, end - start), zoomBy, zoomToRange, panBy, reset };
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Measures a container so charts can pick a tick density that actually fits.
   The SVG scales with its box, so a fixed label count collides on a quarter
   screen and looks sparse on a wall display. */
export function useElementSize(fallbackWidth = 900) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect?.width;
      if (next) setWidth(next);
    });
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width || fallbackWidth);
    return () => observer.disconnect();
  }, [fallbackWidth]);

  return [ref, width];
}

/* ---------------------------------------------------------------------------
   Error boundary  -  a render fault should degrade one panel, not blank the
   whole app in front of an audience or a screen recorder.
   ------------------------------------------------------------------------ */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="content-card" style={{ margin: '24px' }}>
        <div className="card-title"><span>This panel could not be drawn</span></div>
        <p className="card-lede" style={{ marginBottom: 12 }}>
          The rest of the app is still usable. Details: {String(this.state.error?.message || this.state.error)}
        </p>
        <button className="bubble-btn" onClick={() => this.setState({ error: null })}>Try this panel again</button>
      </div>
    );
  }
}

/* ---------------------------------------------------------------------------
   1. Animated number  -  numbers that count up instead of just appearing
   ------------------------------------------------------------------------ */
export function useCountUp(target, duration = 850) {
  const safeTarget = Number.isFinite(Number(target)) ? Number(target) : null;
  const [value, setValue] = useState(safeTarget === null ? null : 0);
  const fromRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (safeTarget === null) { setValue(null); return undefined; }
    if (prefersReducedMotion()) { setValue(safeTarget); return undefined; }
    const from = Number.isFinite(fromRef.current) ? fromRef.current : 0;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (safeTarget - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else fromRef.current = safeTarget;
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [safeTarget, duration]);

  return value;
}

export function Num({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  compact = false,
  signed = false,
  className = '',
  style,
  fallback = 'Not estimated',
  duration,
}) {
  // Values the engine returns as text ("Self-Sustaining", "30.0%", "Beta 0.88")
  // are shown verbatim; only true numbers get the count-up treatment.
  const numeric = Number(value);
  const isNumeric = looksNumeric(value);
  const animated = useCountUp(isNumeric ? numeric : null, duration);

  if (!isNumeric) {
    const text = typeof value === 'string' && value.trim() !== '' ? value : fallback;
    return <span className={`num ${className}`} style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', ...style }}>{text}</span>;
  }

  const shown = animated == null ? numeric : animated;
  const body = compact ? compactNumber(shown) : fixedNumber(shown, decimals);
  const sign = signed && shown > 0 ? '+' : '';

  return (
    <span className={`num ${className}`} style={style}>
      {prefix}
      {sign}
      {body}
      {suffix}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   2. Sparkline  -  tiny trend line for KPI tiles
   ------------------------------------------------------------------------ */
export function Sparkline({ values = [], width = 108, height = 34, stroke = 'var(--accent)', area = true }) {
  const gradientId = useId();
  const points = useMemo(() => values.filter(item => Number.isFinite(Number(item))).map(Number), [values]);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || Math.abs(max) || 1;
  const x = index => (index / (points.length - 1)) * width;
  const y = value => height - 3 - ((value - min) / span) * (height - 6);
  const line = points.map((value, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`).join(' ');
  const areaPath = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.38" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={areaPath} fill={`url(#${gradientId})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points.at(-1))} r="2.6" fill={stroke} />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   3. Ring gauge  -  probabilities read at a glance
   ------------------------------------------------------------------------ */
export function RingGauge({ value = 0, max = 100, size = 74, thickness = 8, color = 'var(--accent)', label }) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, Number(value) / (max || 100)));
  const offset = circumference * (1 - ratio);

  return (
    <div className="ring-gauge" style={{ width: size, height: size, '--ring-color': color }}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-gauge-center" style={{ fontSize: size / 4.2, color }}>
        {label ?? `${Math.round(ratio * max)}%`}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   4. Delta chip  -  signed change with direction arrow
   ------------------------------------------------------------------------ */
export function DeltaChip({ value, suffix = '%', digits = 2, invert = false, className = '' }) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return <span className={`delta-chip flat ${className}`}>n/a</span>;
  const positive = numeric > 0, negative = numeric < 0;
  const tone = positive ? (invert ? 'down' : 'up') : negative ? (invert ? 'up' : 'down') : 'flat';
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  // Percentages never need six decimals, and a huge one is better shown rounded.
  const shown = Math.abs(numeric) >= 100 ? numeric.toFixed(0) : numeric.toFixed(Math.min(digits, 2));
  return (
    <span className={`delta-chip ${tone} ${className}`}>
      <Icon size={13} />
      {numeric > 0 ? '+' : ''}{shown}{suffix}
    </span>
  );
}

/* ---------------------------------------------------------------------------
   5. Hero tile  -  the KPI blocks at the top of every page
   ------------------------------------------------------------------------ */
export function HeroTile({ label, icon, accent = 'var(--accent)', gradient = 'var(--grad-brand)', value, sub, spark, sparkStroke, gauge }) {
  return (
    <div
      className="hero-tile reveal"
      style={{ '--tile-glow': `color-mix(in srgb, ${accent} 40%, transparent)`, '--tile-accent': accent }}
    >
      <div className="hero-label">{icon}{label}</div>
      <div className="hero-value">
        {gauge ?? value}
        {sub && <div className="hero-sub" style={{ flexBasis: '100%' }}>{sub}</div>}
      </div>
      {spark?.length > 1 && (
        <div className="hero-spark">
          <Sparkline values={spark} stroke={sparkStroke || accent} width={96} height={30} />
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   6. Meter  -  thin progress bar for ranks and shares
   ------------------------------------------------------------------------ */
export function Meter({ value = 0, max = 100, gradient }) {
  const ratio = Math.max(0, Math.min(100, (Number(value) / (max || 100)) * 100));
  return (
    <div className="meter">
      <i style={{ width: `${ratio}%`, background: gradient || 'var(--grad-brand)' }} />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   7. Section heading with accent bar
   ------------------------------------------------------------------------ */
export function CardTitle({ icon, children, right }) {
  return (
    <div className="card-title">
      <span>{icon}{children}</span>
      {right}
    </div>
  );
}
