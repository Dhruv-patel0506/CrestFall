/**
 * charts.js - High-Performance Canvas & SVG Interactive Financial Charting.
 * Supports:
 * 1. Multi-series Financial Trajectory with Baseline comparisons & glow effects
 * 2. Cash Balance & FCF Runway chart with danger thresholds
 * 3. Solvency & Altman Z-Score gauge with distress zones
 * 4. 8-Axis Shock Primitive Radar Diagram
 */

class SimulationCharts {
  static renderTrajectoryChart(canvasId, scenarioSnapshots, baselineSnapshots) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 20 ? rect.width : (canvas.clientWidth > 20 ? canvas.clientWidth : 750));
    const h = (rect.height > 20 ? rect.height : (canvas.clientHeight > 20 ? canvas.clientHeight : 340));
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padLeft = 65, padRight = 30, padTop = 30, padBottom = 40;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Determine min and max
    const allRevs = scenarioSnapshots.map(s => s.revenue_usd_m).concat(baselineSnapshots.map(s => s.revenue_usd_m));
    const allNIs = scenarioSnapshots.map(s => s.net_income_usd_m).concat(baselineSnapshots.map(s => s.net_income_usd_m));
    const maxVal = Math.max(...allRevs) * 1.15;
    const minVal = Math.min(0, Math.min(...allNIs) * 1.2);

    const getX = (idx) => padLeft + (idx / (scenarioSnapshots.length - 1)) * plotW;
    const getY = (val) => padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // Draw gridlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const v = minVal + (i / gridSteps) * (maxVal - minVal);
      const y = getY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${(v >= 1000 ? (v / 1000).toFixed(1) + "B" : v.toFixed(0) + "M")}`, padLeft - 8, y + 4);
    }

    // Zero-line if minVal < 0
    if (minVal < 0) {
      const zeroY = getY(0);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, zeroY);
      ctx.lineTo(w - padRight, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Month X-Axis Labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < scenarioSnapshots.length; i += 3) {
      const x = getX(i);
      ctx.fillText(scenarioSnapshots[i].date_label, x, h - padBottom + 18);
    }

    // 1. Draw Baseline Revenue (Ghost Dotted Line)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    baselineSnapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.revenue_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Scenario Revenue (Cyan Gradient Fill & Bold Line)
    const revGrad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    revGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    revGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    ctx.beginPath();
    scenarioSnapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.revenue_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(scenarioSnapshots.length - 1), getY(minVal));
    ctx.lineTo(getX(0), getY(minVal));
    ctx.closePath();
    ctx.fillStyle = revGrad;
    ctx.fill();

    // Solid Revenue Line with Glow
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    scenarioSnapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.revenue_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Draw Net Income Line (Emerald Line)
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    scenarioSnapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.net_income_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  static renderCashRunwayChart(canvasId, snapshots) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 20 ? rect.width : (canvas.clientWidth > 20 ? canvas.clientWidth : 750));
    const h = (rect.height > 20 ? rect.height : (canvas.clientHeight > 20 ? canvas.clientHeight : 280));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padLeft = 65, padRight = 20, padTop = 25, padBottom = 35;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const cashes = snapshots.map(s => s.cash_balance_usd_m);
    const maxCash = Math.max(1000, Math.max(...cashes) * 1.15);
    const minCash = 0;

    const getX = (idx) => padLeft + (idx / (snapshots.length - 1)) * plotW;
    const getY = (val) => padTop + plotH - ((val - minCash) / (maxCash - minCash)) * plotH;

    // Gridlines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = minCash + (i / 4) * (maxCash - minCash);
      const y = getY(v);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`$${(v >= 1000 ? (v / 1000).toFixed(1) + "B" : v.toFixed(0) + "M")}`, padLeft - 8, y + 4);
    }

    // Cash Fill Area
    const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
    grad.addColorStop(0, "rgba(99, 102, 241, 0.45)");
    grad.addColorStop(1, "rgba(99, 102, 241, 0.05)");

    ctx.beginPath();
    snapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.cash_balance_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(getX(snapshots.length - 1), getY(0));
    ctx.lineTo(getX(0), getY(0));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Cash Line
    ctx.shadowColor = "#818cf8";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    snapshots.forEach((s, i) => {
      const x = getX(i), y = getY(s.cash_balance_usd_m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // FCF Bar overlay
    const barWidth = Math.max(3, (plotW / snapshots.length) * 0.45);
    snapshots.forEach((s, i) => {
      const x = getX(i) - barWidth / 2;
      const fcf = s.free_cash_flow_usd_m;
      const zeroY = getY(0);
      const barH = (Math.abs(fcf) / (maxCash - minCash)) * plotH;
      
      if (fcf >= 0) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.65)";
        ctx.fillRect(x, zeroY - barH, barWidth, barH);
      } else {
        ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
        ctx.fillRect(x, zeroY, barWidth, barH);
      }
    });
  }

  static renderAltmanValuationChart(canvasId, snapshots) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 20 ? rect.width : (canvas.clientWidth > 20 ? canvas.clientWidth : 750));
    const h = (rect.height > 20 ? rect.height : (canvas.clientHeight > 20 ? canvas.clientHeight : 280));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padLeft = 45, padRight = 55, padTop = 25, padBottom = 35;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Left Axis: Altman Z-Score (0 to 6)
    const minZ = 0.0, maxZ = 6.0;
    const getZ_Y = (z) => padTop + plotH - ((Math.min(maxZ, Math.max(minZ, z)) - minZ) / (maxZ - minZ)) * plotH;
    const getX = (idx) => padLeft + (idx / (snapshots.length - 1)) * plotW;

    // Right Axis: Market Cap ($B)
    const mcaps = snapshots.map(s => s.market_cap_usd_bn);
    const maxMCap = Math.max(50, Math.max(...mcaps) * 1.15);
    const minMCap = 0;
    const getMCap_Y = (m) => padTop + plotH - ((m - minMCap) / (maxMCap - minMCap)) * plotH;

    // Distress Zone Background Bands
    const safeY = getZ_Y(3.0);
    const distressY = getZ_Y(1.81);

    // Safe Zone (Z > 3.0)
    ctx.fillStyle = "rgba(16, 185, 129, 0.07)";
    ctx.fillRect(padLeft, padTop, plotW, safeY - padTop);

    // Grey Zone (1.81 to 3.0)
    ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
    ctx.fillRect(padLeft, safeY, plotW, distressY - safeY);

    // Distress Zone (Z < 1.81)
    ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
    ctx.fillRect(padLeft, distressY, plotW, (padTop + plotH) - distressY);

    // Zone Divider Lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, safeY);
    ctx.lineTo(w - padRight, safeY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
    ctx.beginPath();
    ctx.moveTo(padLeft, distressY);
    ctx.lineTo(w - padRight, distressY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Left Axis Labels (Altman Z)
    ctx.fillStyle = "#f59e0b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    [0, 1.81, 3.0, 5.0].forEach(z => {
      ctx.fillText(`Z: ${z.toFixed(1)}`, padLeft - 6, getZ_Y(z) + 4);
    });

    // Right Axis Labels (Market Cap)
    ctx.fillStyle = "#ec4899";
    ctx.textAlign = "left";
    [0, maxMCap * 0.5, maxMCap].forEach(mc => {
      ctx.fillText(`$${mc.toFixed(0)}B`, w - padRight + 6, getMCap_Y(mc) + 4);
    });

    // Draw Market Cap Line (Pink Glow)
    ctx.shadowColor = "#ec4899";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#ec4899";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    snapshots.forEach((s, i) => {
      const x = getX(i), y = getMCap_Y(s.market_cap_usd_bn);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Altman Z Line (Amber Glow)
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    snapshots.forEach((s, i) => {
      const x = getX(i), y = getZ_Y(s.altman_z_score);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  static renderRadarChart(canvasId, shockVector) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 20 ? rect.width : (canvas.clientWidth > 20 ? canvas.clientWidth : 300));
    const h = (rect.height > 20 ? rect.height : (canvas.clientHeight > 20 ? canvas.clientHeight : 240));

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(centerX, centerY) - 30;

    const dimensions = [
      { key: "demand", label: "Demand Shock", val: Math.abs(shockVector.demand || 0) },
      { key: "supply", label: "Supply Crunch", val: shockVector.supply || 0 },
      { key: "credit", label: "Credit Stress", val: shockVector.credit || 0 },
      { key: "rates_bps", label: "Rate Spike", val: Math.min(1.0, (shockVector.rates_bps || 0) / 400.0) },
      { key: "sentiment", label: "Sentiment VIX", val: Math.abs(shockVector.sentiment || 0) },
      { key: "geopolitical", label: "Geopolitical", val: shockVector.geopolitical || 0 },
      { key: "pandemic", label: "Pandemic", val: shockVector.pandemic || 0 }
    ];

    const numAxes = dimensions.length;
    const angleStep = (Math.PI * 2) / numAxes;

    // Draw concentric radar webs
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let r = 1; r <= 4; r++) {
      const curR = (r / 4) * radius;
      ctx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * curR;
        const y = centerY + Math.sin(angle) * curR;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines and labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.font = "9.5px Inter, sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.stroke();

      const labelDist = radius + 15;
      const lx = centerX + Math.cos(angle) * labelDist;
      const ly = centerY + Math.sin(angle) * labelDist + 3;
      ctx.fillText(dimensions[i].label, lx, ly);
    }

    // Draw active shock polygon
    const polyGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    polyGrad.addColorStop(0, "rgba(244, 63, 94, 0.55)");
    polyGrad.addColorStop(1, "rgba(244, 63, 94, 0.15)");

    ctx.beginPath();
    dimensions.forEach((dim, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const val = Math.min(1.0, Math.max(0.05, dim.val));
      const r = val * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = polyGrad;
    ctx.fill();

    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}
