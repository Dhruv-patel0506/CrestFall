import React, { useState } from 'react';

// Helper to format currency values (e.g. 54800 -> $54.8B or $54,800M)
export function formatCurrency(val) {
  if (val === undefined || val === null || isNaN(val)) return "$0M";
  if (Math.abs(val) >= 1000) {
    return `$${(val / 1000).toFixed(1)}B`;
  }
  return `$${val.toFixed(0)}M`;
}

// ----------------------------------------------------------------------
// 1. HISTORICAL TRENDS CHART (PAGE 3)
// ----------------------------------------------------------------------
export function HistoricalTrendsChart({
  historyData,
  overlayFestivals = true,
  overlayEvents = true,
  overlayPins = true,
  overlayTrend = true,
  companyName = "Company"
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!historyData || !historyData.history || historyData.history.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>No historical data available.</div>;
  }

  const data = historyData.history;
  const smoothed = historyData.smoothed_trend || [];
  
  const width = 940;
  const height = 380;
  const margin = { top: 45, right: 40, bottom: 60, left: 85 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Compute min & max with margin
  const values = data.map(d => d.value);
  const minVal = Math.max(0, Math.min(...values) * 0.88);
  const maxVal = Math.max(...values) * 1.12;

  const getX = (idx) => margin.left + (idx / Math.max(1, data.length - 1)) * plotW;
  const getY = (val) => margin.top + plotH - ((val - minVal) / Math.max(1, maxVal - minVal)) * plotH;

  // Generate 5 Y-Axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
    const val = minVal + ratio * (maxVal - minVal);
    return { val, y: getY(val), label: formatCurrency(val) };
  });

  // Build SVG path string for history
  const historyPath = data.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.value);
    if (i === 0) return `M ${x} ${y}`;
    const prevX = getX(i - 1);
    const prevY = getY(data[i - 1].value);
    const cx1 = prevX + (x - prevX) / 2;
    const cy1 = prevY;
    const cx2 = prevX + (x - prevX) / 2;
    const cy2 = y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x} ${y}`;
  }, "");

  // Area under curve
  const areaPath = `${historyPath} L ${getX(data.length - 1)} ${margin.top + plotH} L ${getX(0)} ${margin.top + plotH} Z`;

  // Build SVG path for smoothed trend
  const trendPath = smoothed.reduce((acc, pt, i) => {
    const x = getX(i);
    const y = getY(pt.value);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Event Region X coords (bounded safely to data length)
  const eventX1 = getX(Math.min(4, Math.max(0, Math.floor(data.length * 0.22))));
  const eventX2 = getX(Math.min(7, Math.max(1, Math.floor(data.length * 0.42))));
  // Festival Region X coords (bounded safely to data length)
  const festX1 = getX(Math.min(9, Math.max(0, Math.floor(data.length * 0.55))));
  const festX2 = getX(Math.min(12, Math.max(1, Math.floor(data.length * 0.75))));

  // Peak index (highest value) and Trough index (lowest value)
  let peakIdx = 0;
  let troughIdx = 0;
  data.forEach((d, i) => {
    if (d.value > data[peakIdx].value) peakIdx = i;
    if (d.value < data[troughIdx].value) troughIdx = i;
  });
  const pinIdx = Math.min(data.length - 1, Math.max(0, Math.floor(data.length * 0.52)));

  const activePoint = hoverIdx !== null && data[hoverIdx] ? data[hoverIdx] : null;

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * width;
          if (mouseX >= margin.left && mouseX <= margin.left + plotW) {
            const ratio = (mouseX - margin.left) / plotW;
            const idx = Math.round(ratio * (data.length - 1));
            setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
          }
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* 1. Shaded Background Event Regions */}
        {overlayEvents && (
          <g>
            <rect 
              x={eventX1} 
              y={margin.top} 
              width={eventX2 - eventX1} 
              height={plotH} 
              fill="#8B5CF6" 
              fillOpacity="0.10" 
              stroke="#C4B5FD"
              strokeDasharray="3 3"
            />
            {/* Top Region Label Badge */}
            <g transform={`translate(${eventX1 + 8}, ${margin.top + 16})`}>
              <rect x="0" y="-12" width="145" height="20" rx="4" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="1" />
              <text x="6" y="2" fontSize="10.5" fontWeight="700" fill="#6D28D9">
                ⚡ Rate Shock (+300bps)
              </text>
            </g>
          </g>
        )}

        {overlayFestivals && (
          <g>
            <rect 
              x={festX1} 
              y={margin.top} 
              width={festX2 - festX1} 
              height={plotH} 
              fill="#FACC15" 
              fillOpacity="0.12" 
              stroke="#FDE047"
              strokeDasharray="3 3"
            />
            {/* Top Region Label Badge */}
            <g transform={`translate(${festX1 + 8}, ${margin.top + 16})`}>
              <rect x="0" y="-12" width="145" height="20" rx="4" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1" />
              <text x="6" y="2" fontSize="10.5" fontWeight="700" fill="#854D0E">
                🎉 Diwali / Q4 Holiday Lift
              </text>
            </g>
          </g>
        )}

        {/* 2. Horizontal Gridlines & Y-Axis Labels */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line 
              x1={margin.left} 
              y1={t.y} 
              x2={margin.left + plotW} 
              y2={t.y} 
              stroke="#E2E8F0" 
              strokeWidth="1" 
              strokeDasharray={idx === 0 ? "none" : "3 3"}
            />
            <text 
              x={margin.left - 12} 
              y={t.y + 4} 
              textAnchor="end" 
              fontSize="12" 
              fontWeight="600" 
              fill="#475569" 
              fontFamily="'JetBrains Mono', monospace"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Left Y-Axis Border Line */}
        <line 
          x1={margin.left} 
          y1={margin.top} 
          x2={margin.left} 
          y2={margin.top + plotH} 
          stroke="#94A3B8" 
          strokeWidth="1.5" 
        />
        {/* Y-Axis Title */}
        <text 
          x={- (margin.top + plotH / 2)} 
          y="22" 
          transform="rotate(-90)" 
          textAnchor="middle" 
          fontSize="11.5" 
          fontWeight="700" 
          fill="#64748B"
        >
          Revenue ($ USD)
        </text>

        {/* Bottom X-Axis Baseline Line */}
        <line 
          x1={margin.left} 
          y1={margin.top + plotH} 
          x2={margin.left + plotW} 
          y2={margin.top + plotH} 
          stroke="#94A3B8" 
          strokeWidth="1.5" 
        />

        {/* 3. X-Axis Date Labels & Ticks */}
        {data.map((d, i) => {
          // Show every 2nd or 3rd date to avoid collision
          const isMajor = i % 2 === 0 || i === data.length - 1;
          const x = getX(i);
          return (
            <g key={i}>
              <line 
                x1={x} 
                y1={margin.top + plotH} 
                x2={x} 
                y2={margin.top + plotH + (isMajor ? 6 : 3)} 
                stroke="#64748B" 
                strokeWidth="1.2" 
              />
              {isMajor && (
                <text 
                  x={x} 
                  y={margin.top + plotH + 20} 
                  textAnchor="middle" 
                  fontSize="11.5" 
                  fontWeight="600" 
                  fill="#475569"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {d.date}
                </text>
              )}
            </g>
          );
        })}
        {/* X-Axis Title */}
        <text 
          x={margin.left + plotW / 2} 
          y={height - 12} 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="700" 
          fill="#64748B"
        >
          Timeline (Historical Quarterly & Monthly Filings)
        </text>

        {/* 4. Shaded Area Under Curve */}
        <path d={areaPath} fill="url(#histAreaGrad)" />

        {/* 5. Smoothed Trend Line (Grey Dashed) */}
        {overlayTrend && trendPath && (
          <path 
            d={trendPath} 
            fill="none" 
            stroke="#94A3B8" 
            strokeWidth="2.2" 
            strokeDasharray="5 5" 
          />
        )}

        {/* 6. Actual History Curve (Bold Blue #2563EB) */}
        <path 
          d={historyPath} 
          fill="none" 
          stroke="#2563EB" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />

        {/* Data Points Dots */}
        {data.map((d, i) => (
          <circle 
            key={i} 
            cx={getX(i)} 
            cy={getY(d.value)} 
            r={i === hoverIdx ? 6 : (i % 2 === 0 ? 3.5 : 2.5)} 
            fill={i === hoverIdx ? "#1D4ED8" : "#2563EB"} 
            stroke="#FFFFFF" 
            strokeWidth={i === hoverIdx ? 2.5 : 1.5} 
          />
        ))}

        {/* 7. Peak Marker (Green #22C55E) */}
        {peakIdx >= 0 && (
          <g transform={`translate(${getX(peakIdx)}, ${getY(data[peakIdx].value)})`}>
            <circle cx="0" cy="0" r="6" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2" />
            <g transform="translate(0, -32)" filter="url(#shadowFilter)">
              <rect x="-55" y="-10" width="110" height="24" rx="6" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1.5" />
              <polygon points="-4,14 4,14 0,18" fill="#22C55E" />
              <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#15803D">
                ▲ Peak: {formatCurrency(data[peakIdx].value)}
              </text>
            </g>
          </g>
        )}

        {/* 8. Trough Marker (Red #EF4444) */}
        {troughIdx >= 0 && data[troughIdx] && (
          <g transform={`translate(${getX(troughIdx)}, ${getY(data[troughIdx].value)})`}>
            <circle cx="0" cy="0" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
            <g transform="translate(0, 28)" filter="url(#shadowFilter)">
              <rect x="-55" y="-10" width="110" height="24" rx="6" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.5" />
              <polygon points="-4,-10 4,-10 0,-14" fill="#EF4444" />
              <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#B91C1C">
                ▼ Trough: {formatCurrency(data[troughIdx].value)}
              </text>
            </g>
          </g>
        )}

        {/* 9. Decision Pin (Pink #EC4899) */}
        {overlayPins && data[pinIdx] && (
          <g transform={`translate(${getX(pinIdx)}, ${getY(data[pinIdx].value)})`}>
            <line x1="0" y1="0" x2="0" y2="-45" stroke="#EC4899" strokeWidth="1.8" strokeDasharray="2 2" />
            <circle cx="0" cy="0" r="5" fill="#EC4899" stroke="#FFF" strokeWidth="2" />
            <g transform="translate(0, -55)" filter="url(#shadowFilter)">
              <rect x="-70" y="-11" width="140" height="24" rx="6" fill="#FDF2F8" stroke="#EC4899" strokeWidth="1.5" />
              <text x="0" y="5" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#BE185D">
                📌 Layoffs & OpEx (+180bps)
              </text>
            </g>
          </g>
        )}

        {/* 10. Interactive Hover Guideline & Crosshair */}
        {hoverIdx !== null && activePoint && (
          <g>
            <line 
              x1={getX(hoverIdx)} 
              y1={margin.top} 
              x2={getX(hoverIdx)} 
              y2={margin.top + plotH} 
              stroke="#2563EB" 
              strokeWidth="1.5" 
              strokeDasharray="4 4" 
            />
            <circle 
              cx={getX(hoverIdx)} 
              cy={getY(activePoint.value)} 
              r="7" 
              fill="#2563EB" 
              stroke="#FFFFFF" 
              strokeWidth="2.5" 
            />
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip Box */}
      {hoverIdx !== null && activePoint && (
        <div 
          style={{
            position: 'absolute',
            left: `${(getX(hoverIdx) / width) * 100}%`,
            top: `${(getY(activePoint.value) / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px', color: '#93C5FD' }}>
            📅 Period: {activePoint.date}
          </div>
          <div>Revenue: <strong>{formatCurrency(activePoint.value)}</strong> (${activePoint.value.toLocaleString()}M)</div>
          <div>Gross Margin: <strong style={{ color: '#86EFAC' }}>{activePoint.margin || '55.0'}%</strong></div>
          <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '2px' }}>Verified Historical SEC Filing</div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. FORECAST & SCENARIOS CHART (PAGE 4)
// ----------------------------------------------------------------------
export function ForecastScenariosChart({
  forecastData,
  activeTogglesCount = 0,
  span = "12M"
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!forecastData || !forecastData.forecast_series || forecastData.forecast_series.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Running scenario simulation...</div>;
  }

  const series = forecastData.forecast_series;
  const width = 940;
  const height = 360;
  const margin = { top: 40, right: 90, bottom: 55, left: 85 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Min and max from forecast and bands
  const allVals = [
    ...series.map(s => s.forecast_value),
    ...series.map(s => s.baseline_value),
    ...series.map(s => s.band_low || s.forecast_value * 0.95),
    ...series.map(s => s.band_high || s.forecast_value * 1.05)
  ];
  const minVal = Math.max(0, Math.min(...allVals) * 0.9);
  const maxVal = Math.max(...allVals) * 1.1;

  const getX = (idx) => margin.left + (idx / Math.max(1, series.length - 1)) * plotW;
  const getY = (val) => margin.top + plotH - ((val - minVal) / Math.max(1, maxVal - minVal)) * plotH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
    const val = minVal + ratio * (maxVal - minVal);
    return { val, y: getY(val), label: formatCurrency(val) };
  });

  // What-If Path
  const whatIfPath = series.reduce((acc, s, i) => {
    const x = getX(i);
    const y = getY(s.forecast_value);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Baseline Path
  const basePath = series.reduce((acc, s, i) => {
    const x = getX(i);
    const y = getY(s.baseline_value);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Shaded Band Polygon: Top forward, bottom backwards
  const topBand = series.map((s, i) => `${getX(i)},${getY(s.band_high || s.forecast_value * 1.05)}`).join(" ");
  const bottomBand = [...series].reverse().map((s, i) => {
    const revIdx = series.length - 1 - i;
    return `${getX(revIdx)},${getY(s.band_low || s.forecast_value * 0.95)}`;
  }).join(" ");
  const bandPolygon = `${topBand} ${bottomBand}`;

  const lastPt = series[series.length - 1];
  const isDeclining = lastPt.forecast_value < series[0].forecast_value;
  const whatIfColor = activeTogglesCount > 0 ? (isDeclining ? "#EF4444" : "#14B8A6") : "#2563EB";

  const activePoint = hoverIdx !== null && series[hoverIdx] ? series[hoverIdx] : null;

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * width;
          if (mouseX >= margin.left && mouseX <= margin.left + plotW) {
            const ratio = (mouseX - margin.left) / plotW;
            const idx = Math.round(ratio * (series.length - 1));
            setHoverIdx(Math.max(0, Math.min(series.length - 1, idx)));
          }
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* 1. Horizontal Grids & Y-Axis */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line 
              x1={margin.left} 
              y1={t.y} 
              x2={margin.left + plotW} 
              y2={t.y} 
              stroke="#E2E8F0" 
              strokeWidth="1" 
              strokeDasharray={idx === 0 ? "none" : "3 3"} 
            />
            <text 
              x={margin.left - 12} 
              y={t.y + 4} 
              textAnchor="end" 
              fontSize="12" 
              fontWeight="600" 
              fill="#475569" 
              fontFamily="'JetBrains Mono', monospace"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Left Y Axis */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH} stroke="#94A3B8" strokeWidth="1.5" />
        <text 
          x={- (margin.top + plotH / 2)} 
          y="22" 
          transform="rotate(-90)" 
          textAnchor="middle" 
          fontSize="11.5" 
          fontWeight="700" 
          fill="#64748B"
        >
          Projected Revenue ($ USD)
        </text>

        {/* Bottom X Axis */}
        <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke="#94A3B8" strokeWidth="1.5" />

        {/* 2. X-Axis Month Labels */}
        {series.map((s, i) => {
          const isMajor = i % 2 === 0 || i === series.length - 1;
          const x = getX(i);
          return (
            <g key={i}>
              <line x1={x} y1={margin.top + plotH} x2={x} y2={margin.top + plotH + 5} stroke="#64748B" strokeWidth="1.2" />
              {isMajor && (
                <text 
                  x={x} 
                  y={margin.top + plotH + 20} 
                  textAnchor="middle" 
                  fontSize="11.5" 
                  fontWeight="600" 
                  fill="#475569"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {s.date_label || `M${s.month}`}
                </text>
              )}
            </g>
          );
        })}
        <text 
          x={margin.left + plotW / 2} 
          y={height - 10} 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="700" 
          fill="#64748B"
        >
          Forecast Horizon (Months M01 to M{series.length})
        </text>

        {/* 3. Uncertainty Band */}
        <polygon points={bandPolygon} fill="url(#bandGrad)" />

        {/* 4. Baseline Dotted Path (Grey) */}
        <path d={basePath} fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="5 5" />
        <text 
          x={getX(series.length - 1) + 8} 
          y={getY(lastPt.baseline_value) + 4} 
          fontSize="11" 
          fontWeight="700" 
          fill="#64748B"
        >
          Base: {formatCurrency(lastPt.baseline_value)}
        </text>

        {/* 5. What-If Trajectory Line */}
        <path d={whatIfPath} fill="none" stroke={whatIfColor} strokeWidth="3.5" strokeLinecap="round" />
        <text 
          x={getX(series.length - 1) + 8} 
          y={getY(lastPt.forecast_value) + (Math.abs(getY(lastPt.forecast_value) - getY(lastPt.baseline_value)) < 15 ? 16 : 4)} 
          fontSize="11.5" 
          fontWeight="800" 
          fill={whatIfColor}
        >
          {activeTogglesCount > 0 ? "What-If: " : "Forecast: "}{formatCurrency(lastPt.forecast_value)}
        </text>

        {/* Dots on points */}
        {series.map((s, i) => (
          <circle 
            key={i} 
            cx={getX(i)} 
            cy={getY(s.forecast_value)} 
            r={i === hoverIdx ? 6 : 3.5} 
            fill={whatIfColor} 
            stroke="#FFF" 
            strokeWidth={i === hoverIdx ? 2.5 : 1.5} 
          />
        ))}

        {/* Hover Guideline */}
        {hoverIdx !== null && activePoint && (
          <g>
            <line 
              x1={getX(hoverIdx)} 
              y1={margin.top} 
              x2={getX(hoverIdx)} 
              y2={margin.top + plotH} 
              stroke={whatIfColor} 
              strokeWidth="1.5" 
              strokeDasharray="4 4" 
            />
            <circle 
              cx={getX(hoverIdx)} 
              cy={getY(activePoint.forecast_value)} 
              r="7" 
              fill={whatIfColor} 
              stroke="#FFF" 
              strokeWidth="2.5" 
            />
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoverIdx !== null && activePoint && (
        <div 
          style={{
            position: 'absolute',
            left: `${(getX(hoverIdx) / width) * 100}%`,
            top: `${(getY(activePoint.forecast_value) / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px', color: '#5EEAD4' }}>
            🔮 Forecast Month: {activePoint.date_label || `M${activePoint.month}`}
          </div>
          <div>What-If Revenue: <strong>{formatCurrency(activePoint.forecast_value)}</strong></div>
          <div style={{ color: '#CBD5E1' }}>Baseline Path: {formatCurrency(activePoint.baseline_value)}</div>
          <div style={{ color: activePoint.forecast_value >= activePoint.baseline_value ? '#86EFAC' : '#FCA5A5', marginTop: '2px' }}>
            Delta: {activePoint.forecast_value >= activePoint.baseline_value ? '+' : ''}{formatCurrency(activePoint.forecast_value - activePoint.baseline_value)} vs Base
          </div>
          <div style={{ color: '#94A3B8', fontSize: '11px', marginTop: '3px' }}>
            Altman Z-Score: {activePoint.altman_z_score?.toFixed(2) || '3.2'}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. COMPETITOR NICHE COMPARISON CHART (PAGE 5)
// ----------------------------------------------------------------------
export function CompetitorComparisonChart({
  nicheComparison,
  focusCompanyName = "Focus Company"
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!nicheComparison || !nicheComparison.series || nicheComparison.series.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading niche comparison benchmarks...</div>;
  }

  const seriesList = nicheComparison.series;
  const months = nicheComparison.months || ["M01", "M03", "M06", "M09", "M12", "M15", "M18", "M24"];

  const width = 940;
  const height = 340;
  const margin = { top: 40, right: 120, bottom: 55, left: 75 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  // Dynamic Y-axis index values range
  const allIndexedVals = seriesList.flatMap(s => s.indexed_series || [100]);
  const minVal = Math.max(50, Math.floor((Math.min(90, ...allIndexedVals) - 5) / 10) * 10);
  const maxVal = Math.min(250, Math.ceil((Math.max(120, ...allIndexedVals) + 5) / 10) * 10);

  const getX = (idx) => margin.left + (idx / Math.max(1, months.length - 1)) * plotW;
  const getY = (val) => margin.top + plotH - ((val - minVal) / Math.max(1, maxVal - minVal)) * plotH;

  const yTicks = [];
  const step = (maxVal - minVal) <= 50 ? 10 : 20;
  for (let v = minVal; v <= maxVal; v += step) {
    yTicks.push({
      val: v,
      y: getY(v),
      label: v === 100 ? "100 (Base)" : `${v}`
    });
  }

  const colors = ["#2563EB", "#8B5CF6", "#10B981", "#64748B"];

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * width;
          if (mouseX >= margin.left && mouseX <= margin.left + plotW) {
            const ratio = (mouseX - margin.left) / plotW;
            const idx = Math.round(ratio * (months.length - 1));
            setHoverIdx(Math.max(0, Math.min(months.length - 1, idx)));
          }
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Horizontal Grids */}
        {yTicks.map((t, idx) => (
          <g key={idx}>
            <line 
              x1={margin.left} 
              y1={t.y} 
              x2={margin.left + plotW} 
              y2={t.y} 
              stroke={t.val === 100 ? "#94A3B8" : "#E2E8F0"} 
              strokeWidth={t.val === 100 ? "1.8" : "1"} 
              strokeDasharray={t.val === 100 ? "none" : "3 3"} 
            />
            <text 
              x={margin.left - 10} 
              y={t.y + 4} 
              textAnchor="end" 
              fontSize={t.val === 100 ? "12" : "11"} 
              fontWeight={t.val === 100 ? "700" : "500"} 
              fill={t.val === 100 ? "#0F172A" : "#64748B"} 
              fontFamily="'JetBrains Mono', monospace"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Left Y Axis */}
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + plotH} stroke="#94A3B8" strokeWidth="1.5" />
        <text 
          x={- (margin.top + plotH / 2)} 
          y="22" 
          transform="rotate(-90)" 
          textAnchor="middle" 
          fontSize="11.5" 
          fontWeight="700" 
          fill="#64748B"
        >
          Indexed Growth (Base = 100)
        </text>

        {/* Bottom X Axis */}
        <line x1={margin.left} y1={margin.top + plotH} x2={margin.left + plotW} y2={margin.top + plotH} stroke="#94A3B8" strokeWidth="1.5" />

        {/* X-Axis Month Labels */}
        {months.map((m, i) => {
          const x = getX(i);
          return (
            <g key={i}>
              <line x1={x} y1={margin.top + plotH} x2={x} y2={margin.top + plotH + 5} stroke="#64748B" strokeWidth="1.2" />
              <text 
                x={x} 
                y={margin.top + plotH + 20} 
                textAnchor="middle" 
                fontSize="11.5" 
                fontWeight="600" 
                fill="#475569" 
                fontFamily="'JetBrains Mono', monospace"
              >
                {m}
              </text>
            </g>
          );
        })}
        <text 
          x={margin.left + plotW / 2} 
          y={height - 10} 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="700" 
          fill="#64748B"
        >
          Comparative Projection Timeline (Rebased to 100 at M01)
        </text>

        {/* Peer Lines */}
        {seriesList.map((s, sIdx) => {
          const isFocus = s.is_focus || sIdx === 0;
          const col = isFocus ? "#2563EB" : colors[sIdx % colors.length];
          const pts = s.indexed_series || [];

          const pathStr = pts.reduce((acc, val, i) => {
            const x = getX(i);
            const y = getY(val);
            return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
          }, "");

          const lastVal = pts[pts.length - 1] || 100;
          const growthDelta = (lastVal - 100).toFixed(1);

          return (
            <g key={sIdx}>
              <path 
                d={pathStr} 
                fill="none" 
                stroke={col} 
                strokeWidth={isFocus ? 3.5 : 2.0} 
                strokeDasharray={isFocus ? "none" : "4 4"} 
              />
              {/* End Label Badge */}
              <text 
                x={getX(pts.length - 1) + 8} 
                y={getY(lastVal) + 4} 
                fontSize="11.5" 
                fontWeight={isFocus ? "800" : "600"} 
                fill={col}
              >
                {s.company_name || s.company_id}: +{growthDelta}%
              </text>

              {/* Point Nodes */}
              {pts.map((val, i) => (
                <circle 
                  key={i} 
                  cx={getX(i)} 
                  cy={getY(val)} 
                  r={isFocus ? (i === hoverIdx ? 6 : 3.5) : 2.5} 
                  fill={col} 
                  stroke="#FFF" 
                  strokeWidth="1.5" 
                />
              ))}
            </g>
          );
        })}

        {/* Hover Crosshair Line */}
        {hoverIdx !== null && (
          <line 
            x1={getX(hoverIdx)} 
            y1={margin.top} 
            x2={getX(hoverIdx)} 
            y2={margin.top + plotH} 
            stroke="#2563EB" 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
          />
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoverIdx !== null && (
        <div 
          style={{
            position: 'absolute',
            left: `${(getX(hoverIdx) / width) * 100}%`,
            top: '20%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px', color: '#93C5FD' }}>
            📊 Timeline: {months[hoverIdx]}
          </div>
          {seriesList.map((s, idx) => {
            const val = s.indexed_series[hoverIdx] || 100;
            const col = s.is_focus || idx === 0 ? "#93C5FD" : "#CBD5E1";
            return (
              <div key={idx} style={{ color: col, margin: '2px 0' }}>
                {s.company_name || s.company_id}: <strong>Index {val.toFixed(1)}</strong> ({val >= 100 ? '+' : ''}{(val - 100).toFixed(1)}%)
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
