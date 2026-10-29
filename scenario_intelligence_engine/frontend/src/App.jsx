import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Building2, TrendingUp, AlertTriangle, ShieldCheck, BarChart3,
  Users, ArrowUpRight, ArrowDownRight, RefreshCw,
  HelpCircle, Sparkles, CheckCircle2, Upload, X,
  Activity, Gauge, Sun, Moon, CalendarDays, Flame, Database, ZoomIn, ZoomOut, Maximize2,
  Info, ShieldAlert, Layers
} from 'lucide-react';
import ScenarioLab from './components/ScenarioLab';
import WelcomeGate from './components/WelcomeGate';
import IntroTransition from './components/IntroTransition';
import { Num, RingGauge, DeltaChip, HeroTile, Meter, axisNumber, isSignedSeries, seriesSpan, decimalsFor, changeDisplay, useZoomDomain, useElementSize, ErrorBoundary } from './components/ui';
import { festivalsForCountry, monthsCovered } from './data/festivals';

const API_BASE = (() => {
  // Where the Python engine lives. Resolved in order of precedence so the same
  // bundle runs locally, on the engine host, and embedded inside WordPress:
  //   1. window.__CRESTFALL_API__  - set by the hosting page before this loads
  //   2. ?api=https://host/api     - demos, previews, staging switches
  //   3. VITE_API_BASE            - build time (frontend/.env)
  //   4. dev server               - local engine on :8000
  //   5. production               - same origin, so the host can proxy /api
  const runtime = typeof window !== 'undefined'
    ? (window.__CRESTFALL_API__ || new URLSearchParams(window.location.search).get('api'))
    : null;
  if (runtime) return String(runtime).replace(/\/+$/, '');
  if (import.meta.env.VITE_API_BASE) return String(import.meta.env.VITE_API_BASE).replace(/\/+$/, '');
  return import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api';
})();

/* ---------------------------------------------------------------------------
   Dashboard  -  the five workspaces.
   It is mounted the moment a company is committed on the welcome gate, so the
   effects below start fetching in parallel while the intro transition plays.
   `onProgress` reports real completion counts back to that transition.
   -------------------------------------------------------------------------- */
function Dashboard({ launch, onProgress, onChangeCompany, seededCompanies }) {
  const [activeTab, setActiveTab] = useState(1);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('crestfall-theme') || 'dark'; } catch { return 'dark'; } });
  const [companies, setCompanies] = useState(seededCompanies || []);
  const [companyListStatus, setCompanyListStatus] = useState(seededCompanies?.length ? 'loaded' : 'loading');
  const [selectedCompanyId, setSelectedCompanyId] = useState(launch.companyId);
  const [selectedSpan, setSelectedSpan] = useState(launch.span || '12M');
  const [rateShockBps, setRateShockBps] = useState(0);
  const [scenarioCatalog, setScenarioCatalog] = useState(null);
  // The catalog is no longer lazy-loaded on tab 4/5: it is part of the warm-up.
  const [scenarioCatalogRequested, setScenarioCatalogRequested] = useState(true);
  const [scenarioPrimitives, setScenarioPrimitives] = useState({});
  const [historyRange, setHistoryRange] = useState('12M');
  const [historyMetric, setHistoryMetric] = useState('close');
  const [historyLineStyle, setHistoryLineStyle] = useState('straight');
  const [userCalendarInputs, setUserCalendarInputs] = useState([]);
  const [calendarEventName, setCalendarEventName] = useState('');
  const [calendarEventMonth, setCalendarEventMonth] = useState('11');
  const [forecastStartMonth, setForecastStartMonth] = useState('');
  const [forecastEndMonth, setForecastEndMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCompanyName, setUploadCompanyName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analystQuestion, setAnalystQuestion] = useState('');
  const [questionAnalysis, setQuestionAnalysis] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [companyDefaultMetrics, setCompanyDefaultMetrics] = useState(launch.defaultMetric ? { [launch.companyId]: launch.defaultMetric } : {});
  const [cleaningReport, setCleaningReport] = useState(launch.cleaningReport || null);
  const [dailyHistoryData, setDailyHistoryData] = useState(null);
  const [historyHoverIndex, setHistoryHoverIndex] = useState(null);
  const [forecastHoverIndex, setForecastHoverIndex] = useState(null);
  const fileInputRef = useRef(null);
  const dashboardRequestId = useRef(0);
  const forecastRequestId = useRef(0);
  const comparisonRequestId = useRef(0);
  const timingRequestId = useRef(0);
  const recommendationRequestId = useRef(0);
  const scenarioRequestId = useRef(0);
  const strengthsRequestId = useRef(0);
  const questionRequestId = useRef(0);
  const historySeriesRequestId = useRef(0);
  const forecastRangeCompanyId = useRef(null);

  // Core Data States
  const [profile, setProfile] = useState(null);
  const [strengths, setStrengths] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [nicheComparison, setNicheComparison] = useState(null);

  // Page 3 History Overlays
  const [historyView, setHistoryView] = useState("monthly");
  const [overlayFestivals, setOverlayFestivals] = useState(true);
  const [overlayEvents, setOverlayEvents] = useState(true);
  const [overlayPins, setOverlayPins] = useState(true);
  const [overlayTrend, setOverlayTrend] = useState(true);
  const [selectedDecisionPin, setSelectedDecisionPin] = useState(null);

  // Page 4 Toggles
  const [toggles, setToggles] = useState({});

  // Peer Group toggle for Page 2
  const [peerGroupType, setPeerGroupType] = useState("niche");

  const selectedScenarioEffects = useMemo(() => {
    const options = [
      ...(scenarioCatalog?.events || []),
      ...(scenarioCatalog?.company_decisions || []),
      ...(scenarioCatalog?.peer_decisions || []),
      ...(scenarioCatalog?.calendar_months || []).map(item => ({ ...item, label: `Calendar month: ${item.label}`, kind: 'calendar' })),
      ...userCalendarInputs
    ];
    return Object.fromEntries(options.filter(item => toggles[item.label] && item.estimated_effect_pct != null).map(item => [item.label, {
      estimated_effect_pct: item.estimated_effect_pct,
      observations: item.observations,
      source: item.kind === 'calendar' ? 'Company calendar-month history (not festival-specific)' : 'Supplied company-panel analogs',
      kind: item.kind || 'observed_event',
      month: item.month
    }]));
  }, [scenarioCatalog, toggles, userCalendarInputs]);

  const enabledScenarioPrimitives = useMemo(() => Object.fromEntries(
    Object.entries(scenarioPrimitives).filter(([key]) => toggles[`primitive:${key}`])
  ), [scenarioPrimitives, toggles]);

  const rangeHistoryLimits = { '1D': 1, '2D': 2, '3D': 3, '7D': 7, '1W': 5, '2W': 10, '3W': 15, '4W': 20, '1M': 1, '3M': 3, '6M': 6, '12M': 12, '24M': 24, '60M': 60 };
  const dailyHistoryRange = ['1D', '2D', '3D', '7D', '1W', '2W', '3W', '4W', '1M', '3M', '6M', '12M'].includes(historyRange);
  const windowedHistoryPoints = useMemo(() => {
    const history = historyData?.history || [];
    if (historyView === 'yearly') return history.slice(-Math.max(1, Math.ceil((rangeHistoryLimits[historyRange] || history.length) / 12)));
    // Keep the last loaded window on screen while a new range or metric is
    // fetched: the chart swaps, it never blanks out mid-demo.
    if (dailyHistoryRange) return dailyHistoryData?.company_id === selectedCompanyId ? dailyHistoryData.history || [] : [];
    if (historyRange === 'ALL') return history;
    return history.slice(-(rangeHistoryLimits[historyRange] || 24));
  }, [historyData, historyView, historyRange, dailyHistoryRange, dailyHistoryData, selectedCompanyId]);

  // Declared before the zoom hook: the zoom reset key reads it, and a `const`
  // further down the component would be a temporal-dead-zone crash at render.
  const displayHistoryMetric = historyView === 'yearly' ? 'close' : historyMetric;

  // Zoom + measuring for the history chart. The domain resets when the company,
  // range, metric or view changes, so a zoom never leaks into the next view.
  const historyZoom = useZoomDomain(windowedHistoryPoints.length, `${selectedCompanyId}|${historyRange}|${displayHistoryMetric}|${historyView}`);
  const [historyChartRef, historyChartWidth] = useElementSize(900);
  const [historyDrag, setHistoryDrag] = useState(null);

  // The zoom window is what everything downstream reads, so the stat tiles,
  // the pins and the axis all follow the region you zoom into.
  const visibleHistoryPoints = useMemo(() => (historyZoom.active
    ? windowedHistoryPoints.slice(historyZoom.start, historyZoom.end)
    : windowedHistoryPoints), [windowedHistoryPoints, historyZoom.active, historyZoom.start, historyZoom.end]);
  const visibleHistoryMonths = useMemo(() => new Set(visibleHistoryPoints.map(point => String(point.date).slice(0, 7))), [visibleHistoryPoints]);
  const visibleStartMonth = visibleHistoryPoints[0]?.date?.slice(0, 7);
  const visibleEndMonth = visibleHistoryPoints.at(-1)?.date?.slice(0, 7);
  const visibleEventExplanations = (historyData?.event_explanations || []).filter(item => visibleStartMonth && item.end >= visibleStartMonth && item.start <= visibleEndMonth);
  const visibleDecisions = (historyData?.decisions || []).filter(item => visibleHistoryMonths.has(String(item.date).slice(0, 7)));
  const visiblePinMarkers = useMemo(() => {
    const byMonth = new Map();
    visibleDecisions.forEach(item => byMonth.set(String(item.date).slice(0, 7), item));
    const monthly = [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
    if (monthly.length <= 12) return monthly;
    const step = (monthly.length - 1) / 11;
    return Array.from({ length: 12 }, (_, i) => monthly[Math.round(i * step)]);
  }, [visibleDecisions]);
  // True while the curve on screen is the previous window or metric, mid-fetch.
  const historySeriesStale = dailyHistoryRange && historyView === 'monthly'
    && dailyHistoryData?.company_id === selectedCompanyId && dailyHistoryData.range !== historyRange;
  const displayedHistoryFrequency = historyView === 'yearly' ? 'year-end' : dailyHistoryRange
    ? (historySeriesStale ? 'switching' : (dailyHistoryData?.frequency || 'loading'))
    : 'monthly';
  const visibleMetricValues = useMemo(() => visibleHistoryPoints
    .map(point => Number(point.metric_values?.[displayHistoryMetric] ?? point.value))
    .filter(Number.isFinite), [visibleHistoryPoints, displayHistoryMetric]);
  const historyLineColor = visibleMetricValues.length > 1 && visibleMetricValues.at(-1) < visibleMetricValues[0] ? 'var(--neg)' : 'var(--pos)';

  // Fetch company list on mount - skipped when the welcome gate already handed
  // us the list, so /companies is never requested twice per launch.
  useEffect(() => {
    if (companies.length) return;
    fetch(`${API_BASE}/companies`)
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setCompanyListStatus('loaded');
        if (data.length > 0 && !data.some(company => company.company_id === selectedCompanyId)) {
          setSelectedCompanyId(data[0].company_id);
        }
      })
      .catch(err => { setCompanyListStatus('error'); console.error("Error loading companies:", err); });
  }, []);


  useEffect(() => {
    forecastRangeCompanyId.current = null;
    historySeriesRequestId.current += 1;
    setDailyHistoryData(null);
    setHistoryHoverIndex(null);
    forecastRequestId.current += 1;
    comparisonRequestId.current += 1;
    timingRequestId.current += 1;
    recommendationRequestId.current += 1;
    scenarioRequestId.current += 1;
    strengthsRequestId.current += 1;
    setProfile(null); setStrengths(null); setHistoryData(null); setForecastData(null);
    setQuestionAnalysis(null); setQuestionError('');
    setForecastLoading(false);
    setTimingData(null); setRecommendationsData(null); setNicheComparison(null);
    setToggles({});
    setRateShockBps(0);
    setScenarioPrimitives({});
    setScenarioCatalog(null);
    // Deliberately NOT resetting scenarioCatalogRequested here. The catalog is
    // part of the warm-up now, and this effect re-runs a second time when
    // companyDefaultMetrics lands - resetting the flag here meant the retry
    // never fired, so switching company left the catalog null, which in turn
    // blocked decision evidence and the recommended-steps list permanently.
    setUserCalendarInputs([]);
    setCalendarEventName('');
    setForecastStartMonth('');
    setForecastEndMonth('');
    // Only the company id belongs in these deps. companyDefaultMetrics arrives
    // later, and re-running the whole reset for it wiped the freshly cleared
    // request ids underneath effects that do not re-run - which is how switching
    // company could leave the scenario catalog and decision evidence dead.
  }, [selectedCompanyId]);

  // Default metric per company, kept in its own effect so it can never re-trigger
  // the reset above.
  useEffect(() => {
    if (!selectedCompanyId) return;
    setHistoryMetric(companyDefaultMetrics[selectedCompanyId] || launch.defaultMetric || 'close');
  }, [selectedCompanyId, companyDefaultMetrics]);

  // Nothing below waits for a tab any more: every workspace is fetched during
  // the intro transition, so switching tabs never shows a spinner.
  // Scenario catalog is now loaded in parallel with profile/history above

  useEffect(() => {
    // Wave 3: decision evidence waits for the forecast so it does not fight the
    // critical path for the single-threaded engine.
    if (!selectedCompanyId || !forecastData || forecastData.company_id !== selectedCompanyId || forecastLoading) return;
    const requestId = ++recommendationRequestId.current;
    fetch(`${API_BASE}/company/${selectedCompanyId}/recommendations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ span: selectedSpan, toggles, rate_shock_bps: Number(rateShockBps) })
    }).then(response => response.json()).then(data => { if (requestId === recommendationRequestId.current && data.company_id === selectedCompanyId) setRecommendationsData(data); })
      .catch(error => console.error('Error updating peer decision evidence:', error));
  }, [selectedCompanyId, selectedSpan, toggles, rateShockBps, forecastData, forecastLoading]);

  // Fetch company-specific data when selectedCompanyId or selectedSpan changes
  useEffect(() => {
    if (!selectedCompanyId) return;
    const requestId = ++dashboardRequestId.current;
    setLoading(true);

    Promise.all([
      fetch(`${API_BASE}/company/${selectedCompanyId}/profile?span=${selectedSpan}`).then(r => r.json()),
      fetch(`${API_BASE}/company/${selectedCompanyId}/history?view=${historyView}&quick_filter=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/scenario-catalog/${selectedCompanyId}`).then(r => r.json())
    ]).then(([prof, hist, catalog]) => {
      if (requestId !== dashboardRequestId.current) return;
      setProfile(prof);
      setHistoryData(hist);
      setScenarioCatalog(catalog);
      const latestMonth = hist.history?.at(-1)?.date;
      if (latestMonth && forecastRangeCompanyId.current !== selectedCompanyId) {
        const [year, month] = latestMonth.split('-').map(Number);
        const nextDate = new Date(year, month, 1);
        const monthCount = Number.parseInt(selectedSpan, 10) || 12;
        const endDate = new Date(year, month + monthCount - 1, 1);
        const monthString = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        setForecastStartMonth(monthString(nextDate));
        setForecastEndMonth(monthString(endDate));
        forecastRangeCompanyId.current = selectedCompanyId;
      }
      setLoading(false);
    }).catch(err => {
      if (requestId !== dashboardRequestId.current) return;
      console.error("Error loading company dashboard data:", err);
      setLoading(false);
    });
  }, [selectedCompanyId, selectedSpan, historyView, companyDefaultMetrics]);

  useEffect(() => {
    if (historyView !== 'monthly' || !dailyHistoryRange || !selectedCompanyId) {
      setDailyHistoryData(null);
      historySeriesRequestId.current += 1;
      return;
    }
    const requestId = ++historySeriesRequestId.current;
    const query = new URLSearchParams({ range: historyRange, metric: historyMetric });
    fetch(`${API_BASE}/company/${selectedCompanyId}/history-series?${query}`)
      .then(response => response.json())
      .then(data => { if (requestId === historySeriesRequestId.current && data.company_id === selectedCompanyId) setDailyHistoryData(data); })
      .catch(error => console.error('Error loading requested chart range:', error));
  }, [historyView, dailyHistoryRange, historyRange, selectedCompanyId, historyMetric]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const requestId = ++strengthsRequestId.current;
    fetch(`${API_BASE}/company/${selectedCompanyId}/strengths?peer_group=${peerGroupType}`)
      .then(response => response.json()).then(data => { if (requestId === strengthsRequestId.current && data.company_id === selectedCompanyId) setStrengths(data); })
      .catch(error => console.error('Error loading company strengths:', error));
  }, [selectedCompanyId, peerGroupType]);

  useEffect(() => {
    if (!selectedCompanyId || historyData?.company_id !== selectedCompanyId || forecastLoading || forecastData?.company_id !== selectedCompanyId) return;
    const requestId = ++timingRequestId.current;
    fetch(`${API_BASE}/company/${selectedCompanyId}/timing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ span: selectedSpan, toggles, rate_shock_bps: Number(rateShockBps), scenario_effects: selectedScenarioEffects, scenario_primitives: enabledScenarioPrimitives, start_month: forecastStartMonth, end_month: forecastEndMonth, metric: historyMetric })
    }).then(response => response.json()).then(data => { if (requestId === timingRequestId.current && data.company_id === selectedCompanyId) setTimingData(data); })
      .catch(error => console.error('Error loading forecast timing:', error));
  }, [selectedCompanyId, selectedSpan, historyData, forecastLoading, forecastData, toggles, rateShockBps, selectedScenarioEffects, enabledScenarioPrimitives, forecastStartMonth, forecastEndMonth, historyMetric]);

  // Peer co-movement is the heaviest endpoint in the panel (it forecasts every
  // comparable company), so it runs last, after timing, and it does not gate
  // the transition - tab 5 shows it as soon as it lands.
  useEffect(() => {
    if (!selectedCompanyId || historyData?.company_id !== selectedCompanyId || !timingData || timingData.company_id !== selectedCompanyId) return;
    const requestId = ++comparisonRequestId.current;
    const scenario = Object.entries(toggles).filter(([key, enabled]) => enabled && !key.startsWith('primitive:')).map(([key]) => key);
    const horizon = forecastEndMonth && historyData?.history?.length
      ? Math.max(1, Math.min(36, (Number(forecastEndMonth.slice(0, 4)) - Number(historyData.history.at(-1).date.slice(0, 4))) * 12 + Number(forecastEndMonth.slice(5, 7)) - Number(historyData.history.at(-1).date.slice(5, 7))))
      : Number(selectedSpan.replace('M', ''));
    const query = new URLSearchParams({
      scenario_json: JSON.stringify(scenario),
      scenario_effects_json: JSON.stringify(selectedScenarioEffects),
      scenario_primitives_json: JSON.stringify(enabledScenarioPrimitives),
      horizon: String(horizon), rate_shock_bps: String(rateShockBps), metric: historyMetric,
      start_month: forecastStartMonth, end_month: forecastEndMonth
    });
    fetch(`${API_BASE}/niche/${selectedCompanyId}/comparison?${query}`)
      .then(r => r.json())
      // The comparison payload names the subject company `focus_company_id`,
      // not `company_id` like every other endpoint.
      .then(data => { if (requestId === comparisonRequestId.current && (data.focus_company_id ?? data.company_id) === selectedCompanyId) setNicheComparison(data); })
      .catch(err => console.error('Error loading company comparison:', err));
  }, [selectedCompanyId, selectedSpan, toggles, rateShockBps, selectedScenarioEffects, enabledScenarioPrimitives, forecastStartMonth, forecastEndMonth, historyData, historyMetric, timingData]);

  // Re-run forecast when toggles or span changes
  useEffect(() => {
    if (!selectedCompanyId || historyData?.company_id !== selectedCompanyId || !historyData?.history?.length || !forecastStartMonth || !forecastEndMonth) return;
    const requestId = ++forecastRequestId.current;
    setForecastLoading(true);
    // Keep the previous path on screen while the new one computes: the page
    // height stays stable and the eye only has to follow the moving line.
    fetch(`${API_BASE}/company/${selectedCompanyId}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ span: selectedSpan, toggles, rate_shock_bps: Number(rateShockBps), scenario_effects: selectedScenarioEffects, scenario_primitives: enabledScenarioPrimitives, start_month: forecastStartMonth, end_month: forecastEndMonth, metric: historyMetric })
    })
      .then(r => r.json())
      .then(data => { if (requestId === forecastRequestId.current && data.company_id === selectedCompanyId) { setForecastData(data); setForecastLoading(false); } })
      .catch(err => { if (requestId === forecastRequestId.current) setForecastLoading(false); console.error("Error updating forecast:", err); });
  }, [selectedCompanyId, selectedSpan, toggles, rateShockBps, selectedScenarioEffects, enabledScenarioPrimitives, forecastStartMonth, forecastEndMonth, historyMetric, historyData]);

  const uploadCompanyDataset = async () => {
    if (!uploadFile) {
      setUploadMessage('Choose a CSV file to start the analysis.');
      return;
    }
    // CSV only. The engine reads delimited text, so a workbook or JSON export
    // would fail with a confusing parser error rather than a clear refusal.
    if (/\.(xlsx|xls|parquet|json|txt|tsv|zip|numbers|ods)$/i.test(uploadFile.name)) {
      setUploadMessage(`${uploadFile.name.split('.').pop().toUpperCase()} is not supported. Crestfall takes .csv files only - export this one as CSV first.`);
      return;
    }
    if (!/\.csv$/i.test(uploadFile.name)) {
      setUploadMessage('Crestfall takes .csv files only. Add a plain CSV export of the dataset.');
      return;
    }
    if (uploadFile.size > 50 * 1024 * 1024) {
      setUploadMessage('This file is larger than 50 MB.');
      return;
    }
    setUploading(true);
    setUploadMessage('Reading and analyzing the CSV...');
    try {
      const response = await fetch(`${API_BASE}/companies/upload`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: uploadCompanyName.trim(), csv_text: await uploadFile.text() })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'The CSV could not be imported.');
      const companyResponse = await fetch(`${API_BASE}/companies`);
      const companyList = await companyResponse.json();
      setCompanies(companyList);
      setCompanyDefaultMetrics(previous => ({ ...previous, [result.company_id]: result.default_metric || 'close' }));
      setSelectedCompanyId(result.company_id);
      setHistoryRange('12M');
      setHistoryView('monthly');
      setCleaningReport(result.cleaning_report || null);
      setActiveTab(4);
      setUploadMessage(`Imported and cleaned ${result.cleaning_report?.rows_kept ?? result.observations_received} rows across ${result.cleaning_report?.months_available ?? 'available'} months. Projection is loading.`);
      setShowUpload(false);
      setUploadCompanyName(''); setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setUploadMessage(error.message || 'Upload failed. Check the CSV format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addCalendarScenario = () => {
    const month = Number(calendarEventMonth);
    if (!calendarEventName.trim() || !month) return;
    const sourceMonth = scenarioCatalog?.calendar_months?.find(item => item.month === month) || {};
    const label = `${calendarEventName.trim()} (${new Date(2000, month - 1, 1).toLocaleString('en', { month: 'long' })} calendar proxy)`;
    const item = { id: `user-calendar:${label}`, label, month, kind: 'calendar', estimated_effect_pct: sourceMonth.estimated_effect_pct, observations: sourceMonth.observations || 0 };
    setUserCalendarInputs(previous => [...previous.filter(existing => existing.label !== label), item]);
    setToggles(previous => ({ ...previous, [label]: true }));
    setCalendarEventName('');
  };

  const retrieveQuestionEvidence = (question, startMonth, endMonth) => {
    const ignored = new Set(['what', 'did', 'does', 'have', 'has', 'will', 'company', 'trend', 'from', 'through', 'this', 'with', 'about', 'forecast', 'show', 'explain', 'how', 'the', 'for', 'and', 'over', 'based', 'its', 'next', 'current', 'between']);
    const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2 && !ignored.has(term));
    if (!terms.length) return [];
    const textMatches = value => terms.some(term => String(value || '').toLowerCase().includes(term));
    const historyEvidence = [
      ...(historyData?.event_explanations || []).filter(item => item.end >= startMonth && item.start <= endMonth && textMatches(`${item.name} ${item.category}`)).map(item => `${item.start}: ${item.name}  -  ${item.interpretation}`),
      ...(historyData?.history || []).filter(point => point.date >= startMonth && point.date <= endMonth).flatMap(point => (point.decision_records || []).filter(item => textMatches(`${item.type} ${item.description}`)).map(item => `${point.date}: ${item.type}  -  ${item.description}`))
    ];
    const scenarioEvidence = [
      ...(scenarioCatalog?.events || []), ...(scenarioCatalog?.company_decisions || []), ...(scenarioCatalog?.peer_decisions || [])
    ].filter(item => textMatches(`${item.label} ${item.description || ''}`)).map(item => `${item.label}: ${item.observations ?? 0} dated cases${item.estimated_effect_pct == null ? '' : `; observed association ${item.estimated_effect_pct > 0 ? '+' : ''}${item.estimated_effect_pct}%`}.`);
    return [...new Set([...historyEvidence, ...scenarioEvidence])].slice(0, 5);
  };

  const runCompanyQuestion = async event => {
    event.preventDefault();
    if (!analystQuestion.trim()) {
      setQuestionError('Enter a question about the company or its trend.');
      return;
    }
    if (!forecastStartMonth || !forecastEndMonth || forecastStartMonth > forecastEndMonth) {
      setQuestionError('Choose a valid start month and end month.');
      return;
    }
    if (historyData?.company_id !== selectedCompanyId || !historyData?.history?.length) {
      setQuestionError('Company history is still loading. Try again in a moment.');
      return;
    }
    const requestId = ++questionRequestId.current;
    const question = analystQuestion.trim();
    const history = historyData.history;
    const lastObservedMonth = history.at(-1).date.slice(0, 7);
    const readValue = point => Number(point?.metric_values?.[historyMetric] ?? point?.close ?? point?.value);
    const selectedHistory = history.filter(point => point.date >= forecastStartMonth && point.date <= forecastEndMonth);
    setQuestionLoading(true);
    setQuestionError('');
    setQuestionAnalysis(null);
    try {
      if (forecastEndMonth <= lastObservedMonth) {
        if (selectedHistory.length < 1) throw new Error('No observations are available in that date range.');
        const firstValue = readValue(selectedHistory[0]);
        const lastValue = readValue(selectedHistory.at(-1));
        const change = selectedHistory.length > 1 && firstValue ? (lastValue / firstValue - 1) * 100 : null;
        const evidence = retrieveQuestionEvidence(question, forecastStartMonth, forecastEndMonth);
        setQuestionAnalysis({
          mode: 'historical', question, start: forecastStartMonth, end: forecastEndMonth,
          answer: `${currentCompanyName}: ${historyMetric} ${change == null ? 'was observed at ' + lastValue.toLocaleString() : `${change >= 0 ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(2)}%`} from ${selectedHistory[0].date} to ${selectedHistory.at(-1).date}. This range contains ${selectedHistory.length} monthly observation${selectedHistory.length === 1 ? '' : 's'}.`,
          observedPoints: selectedHistory.map(point => ({ date: point.date, value: readValue(point) })),
          forecastPoints: [], evidence
        });
        return;
      }

      const response = await fetch(`${API_BASE}/company/${selectedCompanyId}/forecast`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          span: selectedSpan, toggles, rate_shock_bps: Number(rateShockBps),
          scenario_effects: selectedScenarioEffects, scenario_primitives: enabledScenarioPrimitives,
          start_month: forecastStartMonth, end_month: forecastEndMonth, metric: historyMetric
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'The forecast could not be generated.');
      if (requestId !== questionRequestId.current || result.company_id !== selectedCompanyId) return;
      const forecastPoints = (result.forecast_series || []).filter(point => point.date >= forecastStartMonth && point.date <= forecastEndMonth).map(point => ({ date: point.date, value: point.forecast_value }));
      const observedPoints = selectedHistory.map(point => ({ date: point.date, value: readValue(point) }));
      if (forecastPoints.length === 0) throw new Error('No forecast months fall in that range. Forecasts can extend up to 36 months after the latest observation.');
      const basePoint = history.filter(point => point.date <= lastObservedMonth).at(-1);
      const firstValue = observedPoints[0]?.value ?? readValue(basePoint);
      const lastValue = forecastPoints.at(-1).value;
      const change = firstValue ? (lastValue / firstValue - 1) * 100 : null;
      const matchedScenario = result.scenario_evidence?.matched || result.calendar_scenario_evidence?.matched || result.primitive_scenario_evidence?.matched || result.rate_shock_evidence?.matched;
      const selectedConditions = Object.entries(toggles).filter(([, enabled]) => enabled).map(([key]) => key.replace(/^primitive:/, '').replaceAll('_', ' '));
      const evidence = [
        matchedScenario ? `The selected scenario matched ${result.scenario_evidence?.observations ?? result.calendar_scenario_evidence?.observations ?? result.primitive_scenario_evidence?.observations ?? 0} historical cases.` : selectedConditions.length ? 'No directly matched historical case was found for the selected conditions; the model uses its baseline path with the selected inputs.' : 'No scenario conditions are selected; this is the baseline forecast.',
        result.model_version,
        `${result.data_date ? `Latest source observation: ${result.data_date}.` : ''}`,
        ...retrieveQuestionEvidence(question, forecastStartMonth, forecastEndMonth)
      ].filter(Boolean);
      setQuestionAnalysis({
        mode: 'forecast', question, start: forecastStartMonth, end: forecastEndMonth,
        answer: `${currentCompanyName}: the selected ${historyMetric} path is projected to ${change == null ? 'end at ' + lastValue.toLocaleString() : `${change >= 0 ? 'rise' : 'fall'} ${Math.abs(change).toFixed(2)}%`} from ${observedPoints[0]?.date || lastObservedMonth} through ${forecastPoints.at(-1).date}. This includes ${forecastPoints.length} forecast month${forecastPoints.length === 1 ? '' : 's'}${selectedConditions.length ? ` under ${selectedConditions.join(', ')}` : ' with all scenario toggles off'}.`,
        observedPoints: observedPoints.length ? observedPoints : [{ date: lastObservedMonth, value: readValue(basePoint) }],
        forecastPoints, evidence, model: result.model_version, result
      });
    } catch (error) {
      if (requestId === questionRequestId.current) setQuestionError(error.message || 'Could not answer this question from the supplied data.');
    } finally {
      if (requestId === questionRequestId.current) setQuestionLoading(false);
    }
  };

  const selectPresetSpan = span => {
    setSelectedSpan(span);
    const match = /^([0-9]{4})-([0-9]{2})$/.exec(forecastStartMonth);
    if (!match) return;
    const monthCount = Number.parseInt(span, 10);
    const end = new Date(Number(match[1]), Number(match[2]) - 1 + monthCount - 1, 1);
    setForecastEndMonth(`${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`);
  };

  const resetAllToggles = () => setToggles({});

  // Presentation theme is a first-class control: dark for the room, light for the deck.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('crestfall-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const activeTogglesCount = useMemo(() => {
    // Rate basis points are surfaced inside the Macro umbrella, so they count
    // once - through the toggle summary - rather than twice.
    return Object.entries(toggles).filter(([key, enabled]) => enabled && !key.startsWith('primitive:')).length + Object.keys(scenarioPrimitives).filter(key => toggles[`primitive:${key}`]).length;
  }, [toggles, scenarioPrimitives]);

  // Current Summary Card details
  const summary = forecastData?.summary || profile?.summary || {
    current_phase: "Loading",
    direction: "loading",
    next_peak_year: null,
    crash_risk_level: "Not estimated",
    active_toggles_count: 0
  };

  const currentCompanyName = profile?.identity?.company_name || selectedCompanyId;
  const currentTicker = profile?.identity?.ticker || selectedCompanyId;

  // -------------------------------------------------- recommended next steps
  // A short, plain-English action list for the bottom of the decisions page.
  // Every line is read out of data that is already on screen: the modelled
  // path, the timing bars, and the dated decision evidence (this company's own
  // moves plus peer moves from the supplied files). When the file does not
  // carry enough dated decisions, the card says so instead of inventing advice.
  const nextSteps = useMemo(() => {
    const steps = [];
    const series = forecastData?.forecast_series || [];
    const inRange = series.filter(point => point.in_requested_range);
    const end = inRange.at(-1) || series.at(-1);
    const latest = (forecastData?.recent_history || []).at(-1);
    const startValue = Number(latest?.value ?? latest?.close);
    const change = end && startValue ? (Number(end.forecast_value) / startValue - 1) * 100 : null;
    const months = (inRange.length || series.length) || 12;
    const crashBar = (timingData?.crash_timing?.bars || []).find(bar => bar.is_most_likely);
    const peakBar = (timingData?.peak_timing?.bars || []).find(bar => bar.is_most_likely);
    const recs = recommendationsData?.recommendations || [];
    // The backend appends peer-derived entries into the same list, tagged
    // "Peer action: ...". They must never be described as this company's own file.
    const isPeerEntry = value => /^Peer action:\s*/i.test(String(value || ''));
    const ownLabel = value => String(value || '').replace(/^Peer action:\s*/i, '');
    const ownRecs = recs.filter(item => !isPeerEntry(item.decision));
    const peerRecs = recs.filter(item => isPeerEntry(item.decision));
    const best = ownRecs[0];
    const bestPeer = peerRecs[0] || null;
    const worst = ownRecs.length > 1 ? ownRecs[ownRecs.length - 1] : null;
    const usedPeerLabel = !best && bestPeer ? ownLabel(bestPeer.decision).toLowerCase() : null;
    const downside = end && startValue && end.band_low != null
      ? (Number(end.band_low) / startValue - 1) * 100 : null;
    // One peer read is enough: if the evidence list already supplied a peer
    // action (the branch used for files with no own dated decisions), do not
    // append a second catalog-derived peer line saying almost the same thing.
    const peerMove = (!best && bestPeer) ? null : (scenarioCatalog?.peer_decisions || [])
      .filter(item => item.estimated_effect_pct != null && (item.observations || 0) >= 3
        && String(item.label || '').toLowerCase() !== usedPeerLabel)
      .sort((a, b) => Math.abs(b.estimated_effect_pct) - Math.abs(a.estimated_effect_pct))[0] || null;

    // Own decision evidence is grouped by decision type ("Infrastructure Build"),
    // while the forecast umbrellas toggle the full label ("Infrastructure Build:
    // capacity expansion ..."). Bridge the two so the top own move is testable.
    const ownToggleKey = best
      ? ((scenarioCatalog?.company_decisions || []).find(item => String(item.label || '').toLowerCase().startsWith(`${String(best.decision).toLowerCase()}:`))?.label)
        || (((scenarioCatalog?.company_decisions || []).find(item => String(item.label || '').toLowerCase() === String(best.decision).toLowerCase()))?.label)
        || null
      : null;

    if (change == null) {
      steps.push({ tone: 'neutral', text: 'Baseline path is still computing, so no step below is quantified yet.' });
    } else if (change < 0) {
      steps.push({ tone: 'hurt', text: `Direction: the model puts this company ${Math.abs(change).toFixed(2)}% below today over the next ${months} months, in the ${summary.current_phase || 'unknown'} phase. Treat the next steps as a turn-around, not an expansion plan.` });
    } else {
      steps.push({ tone: 'help', text: `Direction: the model puts this company ${change.toFixed(2)}% above today over the next ${months} months, in the ${summary.current_phase || 'unknown'} phase. The risk here is giving the run back, so protect it rather than chasing it.` });
    }

    if (peakBar?.year) {
      steps.push({ tone: 'neutral', text: `Timing: the strongest projected month lands in ${peakBar.year}${peakBar.label ? ` (${peakBar.label})` : ''}. Capital, hiring and launch commitments planned before that window get the friendliest backdrop; ones planned after it inherit the flat part of the path.` });
    }

    if (crashBar?.year) {
      const prob = typeof crashBar.prob_pct === 'number' ? ` at ${crashBar.prob_pct.toFixed(1)}% modelled probability` : '';
      steps.push({ tone: 'hurt', text: `Downside window: the weakest stretch sits in ${crashBar.year}${crashBar.label ? ` (${crashBar.label})` : ''}${prob}. Put a review trigger and a cash floor in place before it, not during it.` });
    }

    if (best) {
      steps.push({ tone: 'help', text: `Lean on: "${best.decision}" averaged ${best.with_decision_growth >= 0 ? '+' : ''}${best.with_decision_growth}% across ${best.matched_cases_count} dated episodes in your own file - the best-evidenced move this company has actually taken.`, toggle: ownToggleKey });
    } else if (bestPeer) {
      steps.push({
        tone: bestPeer.with_decision_growth >= 0 ? 'help' : 'hurt',
        text: `Peer read: your file has no ranked decision of its own yet, but peers who did "${ownLabel(bestPeer.decision)}" averaged ${bestPeer.with_decision_growth >= 0 ? '+' : ''}${bestPeer.with_decision_growth}% over the following three months, across ${bestPeer.matched_cases_count} months on record.`,
        toggle: ownLabel(bestPeer.decision),
      });
    } else if (!recommendationsData) {
      steps.push({ tone: 'neutral', text: 'Decision evidence is still computing - the move-based steps land here as soon as it returns.' });
    } else {
      steps.push({ tone: 'neutral', text: 'Your file does not yet contain an action with three or more dated outcomes, so no company-specific move can be ranked. Adding dated decision rows (with the following months priced) unlocks this list.' });
    }

    if (peerMove) {
      steps.push({
        tone: peerMove.estimated_effect_pct >= 0 ? 'help' : 'hurt',
        text: `Peer read: peers in the same niche or country who did "${peerMove.label}" saw ${peerMove.estimated_effect_pct >= 0 ? '+' : ''}${peerMove.estimated_effect_pct.toFixed(2)}% over the following three months (${peerMove.observations} months on record across ${peerMove.companies?.length || 1} peer companies).`,
        toggle: peerMove.label,
      });
    }

    if (worst && worst.with_decision_growth < 0) {
      steps.push({ tone: 'hurt', text: `Avoid repeating: "${worst.decision}" averaged ${worst.with_decision_growth}% across ${worst.matched_cases_count} dated episodes - the weakest outcome in your own history.` });
    }

    // The unnamed peer cohort. This is what makes the panel work for an institute,
    // a studio or a single hospital: no competitor file is needed, and nothing here
    // pretends to be measured from data. It arrives labelled as a hypothesis list.
    const plan = recommendationsData?.action_plan || null;
    const sectorInfo = recommendationsData?.general_playbook?.sector || null;
    const isPrior = item => String(item?.basis || '').includes('playbook');
    const priorDo = (plan?.do || []).filter(isPrior);
    const priorAvoid = (plan?.avoid || []).filter(isPrior);
    const standing = recommendationsData?.standing_state_labels || [];

    if (priorDo.length > 0) {
      steps.push({
        tone: 'help',
        text: `General playbook for ${sectorInfo?.label || 'this kind of organisation'} (unnamed peers, no competitor file needed): ${priorDo.slice(0, 3).map(item => `"${item.action}"`).join(', ')}. ${priorDo[0]?.why || ''} These are hypotheses to test, not results measured from your data.`,
      });
    }
    if (priorAvoid.length > 0) {
      steps.push({
        tone: 'hurt',
        text: `Hold off on: ${priorAvoid.slice(0, 3).map(item => `"${item.action}"`).join(', ')}. ${priorAvoid[0]?.why || ''}`,
      });
    }
    (plan?.environment_checks || []).slice(0, 2).forEach(line => {
      steps.push({ tone: 'neutral', text: line });
    });
    if (standing.length > 0) {
      steps.push({
        tone: 'neutral',
        text: `Evidence quality: ${standing.length} decision field${standing.length === 1 ? ' is' : 's are'} written on almost every month of your file, which describes standing strategy rather than discrete events - so no outcome is measured from them here, and the playbook above carries the weight instead.`,
      });
    }

    if (downside != null && downside < 0) {
      steps.push({ tone: 'neutral', text: `Guardrail: on the model's lower band the path lands ${Math.abs(downside).toFixed(2)}% below today. Set the review trigger there and pre-agree what gets cut if it is reached.` });
    }

    return steps;
  }, [forecastData, timingData, recommendationsData, scenarioCatalog, summary]);

  // ------------------------------------------------------------ hero reads
  // The engine's span_profile is only filled when a market-return model fits,
  // so it comes back empty for most companies while the timing endpoint still
  // produces real crash bars and a peak year. Reading timing as the fallback
  // keeps "Crash risk" and "Peak year" populated on screen instead of showing
  // Not estimated next to a chart that clearly has both.
  const heroSparkValues = useMemo(() => (historyData?.history || [])
    .slice(-15)
    .map(point => Number(point.metric_values?.[historyMetric] ?? point.value))
    .filter(Number.isFinite), [historyData, historyMetric]);
  const heroLatestValue = heroSparkValues.at(-1);
  const heroThreeMonthAgo = heroSparkValues.length > 3 ? heroSparkValues[heroSparkValues.length - 4] : null;
  const heroThreeMonthChange = heroThreeMonthAgo && heroLatestValue ? (heroLatestValue / heroThreeMonthAgo - 1) * 100 : null;
  const heroGrowthSource = useMemo(() => {
    // Same basis as the forecast panel's "projected change" tile: latest
    // observation to the end of the selected range. The hero and the panel must
    // never disagree while someone is reading the numbers out loud.
    const series = forecastData?.forecast_series || [];
    const end = [...series].reverse().find(point => point.in_requested_range) || series.at(-1);
    const latest = (forecastData?.recent_history || historyData?.history || []).at(-1);
    const startValue = Number(latest?.value ?? latest?.close);
    return end && startValue ? (Number(end.forecast_value) / startValue - 1) * 100 : null;
  }, [forecastData, historyData]);
  const heroGrowth = heroGrowthSource ?? profile?.span_profile?.predicted_growth_pct ?? null;
  const mostLikelyCrashBar = (timingData?.crash_timing?.bars || []).find(bar => bar.is_most_likely) || null;
  const mostLikelyPeakBar = (timingData?.peak_timing?.bars || []).find(bar => bar.is_most_likely) || null;
  const heroCrashProb = profile?.span_profile?.crash_prob_pct ?? mostLikelyCrashBar?.prob_pct ?? null;
  const heroCrashYear = mostLikelyCrashBar?.year || null;
  const heroPeakYear = summary.next_peak_year || profile?.span_profile?.peak_timing || mostLikelyPeakBar?.year || null;
  const crashTone = summary.crash_risk_level === 'Low' ? 'var(--pos)' : summary.crash_risk_level === 'High' ? 'var(--neg)' : 'var(--warn)';
  // The engine returns no crash bar when the fitted path never falls below the
  // company's 5th-percentile month. Say that instead of showing a bare n/a.
  const crashSub = heroCrashProb == null
    ? 'No projected month falls below the 5th-percentile month for this company'
    : `Risk level: ${summary.crash_risk_level}${heroCrashYear ? ` - most likely ${heroCrashYear}` : ''}`;
  const phaseClass = summary.current_phase === 'Growing' ? 'phase-growing' : summary.current_phase === 'Crashing' ? 'phase-crashing' : 'phase-developing';

  // ------------------------------------------------------------- warm-up
  // One entry per workspace payload. The intro pill reaches 100% only when all
  // eight critical artifacts are genuinely in memory, so the transition is
  // exactly as long as the computation and no tab spins while you present.
  const warmUp = useMemo(() => {
    const mine = data => data?.company_id === selectedCompanyId;
    const critical = [
      { done: mine(historyData), task: 'rebuilding the monthly series' },
      { done: Boolean(profile), task: 'reading the company record' },
      { done: mine(strengths), task: 'ranking it against peers' },
      { done: mine(scenarioCatalog), task: 'reading dated events and decisions' },
      { done: mine(dailyHistoryData), task: 'fetching the daily tape' },
      { done: mine(forecastData), task: 'computing the walk-forward forecast' },
      { done: mine(timingData), task: 'timing the peak and the crash window' },
      { done: mine(recommendationsData), task: 'measuring past decision outcomes' },
    ];
    // Peer co-movement forecasts every comparable company, so it is the slowest
    // call in the panel. It still warms up in the background, but a wide niche
    // must not hold the reveal hostage for the other four tabs.
    const peerWarmed = nicheComparison && (nicheComparison.focus_company_id ?? nicheComparison.company_id) === selectedCompanyId;
    const pending = critical.filter(item => !item.done);
    const completed = critical.length - pending.length + (peerWarmed ? 1 : 0);
    return {
      progress: Math.round((completed / (critical.length + 1)) * 100),
      task: pending[0]?.task || (peerWarmed ? 'every workspace is warm' : 'indexing peer co-movement'),
      ready: pending.length === 0,
    };
  }, [selectedCompanyId, historyData, profile, strengths, scenarioCatalog, dailyHistoryData, forecastData, timingData, recommendationsData, nicheComparison]);

  useEffect(() => { onProgress?.(warmUp); }, [warmUp, onProgress]);

  return (
    <div className="macos-window">
      {/* 1. Titlebar */}
      <div className="window-titlebar">
        <div className="window-title">
          <span className="brand-mark">C</span>
          <span className="brand-name">Crestfall</span>
          <span className="brand-tag">rise &amp; fall, read from the record</span>
          <span className="title-divider" />
          <span className="title-company">
            <b>{currentCompanyName}</b>
            <small>{currentTicker}  |  {profile?.identity?.niche || 'company intelligence'}</small>
          </span>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="icon-btn" onClick={() => setTheme(value => value === 'dark' ? 'light' : 'dark')} title="Switch presentation theme" aria-label="Switch presentation theme">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button className="bubble-btn" onClick={() => { setUploadMessage(''); setShowUpload(value => !value); }} title="Import a company time-series CSV"><Upload size={14}/> Add data</button>
          <select 
            className="company-select" 
            aria-label={`Choose a company; ${companies.length} available`}
            title={`${companies.length} companies available`}
            value={selectedCompanyId} 
            onChange={(e) => setSelectedCompanyId(e.target.value)}
          >
            {companies.length === 0 && <option value={selectedCompanyId} disabled>{companyListStatus === 'loading' ? 'Loading companies...' : 'Companies unavailable'}</option>}
            {companies.map(c => (
              <option key={c.company_id} value={c.company_id}>
                {c.company_name} ({c.ticker}) | {c.niche}
              </option>
            ))}
          </select>

          <div className="span-pill-group">
            {["6M", "12M", "24M"].map(span => (
              <button
                key={span}
                className={`span-pill ${selectedSpan === span ? 'active' : ''}`}
                onClick={() => selectPresetSpan(span)}
              >
                {span}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="window-nav">
        <div className="nav-tabs">
          <button className={`nav-tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
            <span className="tab-num">01</span> <Building2 size={15} /> Company Profile
          </button>
          <button className={`nav-tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
            <span className="tab-num">02</span> <ShieldCheck size={15} /> Strengths
          </button>
          <button className={`nav-tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
            <span className="tab-num">03</span> <BarChart3 size={15} /> Historical Trends
          </button>
          <button className={`nav-tab-btn ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>
            <span className="tab-num">04</span> <TrendingUp size={15} /> Forecast &amp; Scenarios
          </button>
          <button className={`nav-tab-btn ${activeTab === 5 ? 'active' : ''}`} onClick={() => setActiveTab(5)}>
            <span className="tab-num">05</span> <Users size={15} /> Ask &amp; Explore
          </button>
        </div>

        <div className="nav-actions">
          <button className="icon-btn" onClick={onChangeCompany} title="Return to the welcome screen and pick another dataset">
            <Database size={14} /> Change dataset
          </button>
          {activeTogglesCount > 0 && (
            <button className="bubble-btn active-orange" onClick={resetAllToggles} title="Drop every selected condition and return to baseline">
              <RefreshCw size={13} /> Reset {activeTogglesCount} condition{activeTogglesCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </div>

      {showUpload && <section style={{ margin: '14px 24px 0', padding: '18px', border: '1px solid var(--line-strong)', borderRadius: '12px', background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div><strong style={{ fontSize: 16 }}>Analyze your company data</strong><div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>Add the raw CSV; Crestfall cleans usable rows, builds the monthly series, and runs the forecast.</div></div>
          <button className="bubble-btn" aria-label="Close upload panel" onClick={() => setShowUpload(false)}><X size={15}/></button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <input ref={fileInputRef} aria-label="Company data CSV" type="file" accept=".csv,text/csv" onChange={event => { const file = event.target.files?.[0] || null; setUploadFile(file); if (file) setUploadCompanyName(file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ')); }} />
          <button className="span-pill active" disabled={uploading} onClick={uploadCompanyDataset}>{uploading ? 'Importing...' : 'Import and analyze'}</button>
          <a download="crestfall_company_template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent('date,close,revenue_usd_m,gross_margin_pct,units_sold,event_name,event_category,decision_type,short_description\n2024-01-31,100,1200,42,5000,,,,\n2024-02-29,104,1250,43,5300,,,,\n')}`} style={{ fontSize: 12, color: 'var(--accent)' }}>Download CSV template</a>
        </div>
        <p style={{ marginTop: 9, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.45 }}>Required: a date column and at least two numeric observations. Close/price series must be positive; other metrics may include negative values and are kept as supplied. Revenue is optional; other numeric columns become graph metrics. Optional event/decision columns: event_name, event_category, decision_type, effective_date, short_description. CSV only, up to 50 MB. Forecasts are currently designed for positive-valued series.</p>
        {uploadMessage && <p role="status" style={{ marginTop: 8, color: uploadMessage.startsWith('Imported') ? 'var(--pos)' : 'var(--warn)', fontSize: 12 }}>{uploadMessage}</p>}
      </section>}
      {!showUpload && uploadMessage && <div role="status" style={{ margin: '8px 24px 0', color: uploadMessage.startsWith('Imported') ? 'var(--pos)' : 'var(--warn)', fontSize: 12 }}>{uploadMessage}</div>}
      {!showUpload && cleaningReport && selectedCompanyId.startsWith('UPLOAD-') && <section style={{ margin: '8px 24px 0', padding: '10px 14px', border: '1px solid var(--pos-soft)', borderRadius: 9, background: 'var(--pos-tint)', color: 'var(--pos)', fontSize: 12 }}>
        <strong>Automatic data cleaning complete</strong>  |  using "{cleaningReport.target_column}"  |  kept {cleaningReport.rows_kept} of {cleaningReport.rows_received} rows  |  removed {cleaningReport.invalid_dates_removed + cleaningReport.missing_or_invalid_metric_rows_removed} rows with unusable dates or target values  |  removed {cleaningReport.duplicate_timestamps_removed} duplicate timestamps  |  {cleaningReport.months_available} monthly periods. Missing observations are left blank rather than invented.
        <details style={{ marginTop: 5 }}><summary style={{ cursor: 'pointer' }}>What was cleaned</summary><ul style={{ margin: '4px 0 0 18px' }}>{cleaningReport.steps.map(step => <li key={step}>{step}</li>)}</ul></details>
      </section>}

      {/* 3. Window Content */}
      <div className="window-content">
        {/* Section 12.7 Summary - hero read-out (top of every page) */}
        <div className="hero-strip">
          <HeroTile
            label="Current phase"
            icon={<Activity size={13} />}
            accent="var(--accent)"
            value={<span className={`badge-phase ${phaseClass}`}>{summary.current_phase}</span>}
            sub={`${selectedSpan} horizon  ·  ${profile?.identity?.niche || 'company series'}`}
            spark={heroSparkValues}
            sparkStroke={heroThreeMonthChange == null ? 'var(--accent)' : heroThreeMonthChange >= 0 ? 'var(--pos)' : 'var(--neg)'}
          />

          <HeroTile
            label="Latest observation"
            icon={<Gauge size={13} />}
            accent="var(--teal)"
            value={<>
              <Num value={heroLatestValue} decimals={2} style={{ fontSize: 27, fontWeight: 700, color: 'var(--text-strong)' }} />
              <DeltaChip value={heroThreeMonthChange} />
            </>}
            sub={`${historyMetric}  ·  3-month change  ·  ${historyData?.data_quality?.last_observation || 'latest source row'}`}
            spark={heroSparkValues}
            sparkStroke="var(--teal)"
          />

          <HeroTile
            label="Projected trajectory"
            icon={summary.direction === 'fall' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            accent={summary.direction === 'fall' ? 'var(--neg)' : summary.direction === 'rise' ? 'var(--pos)' : 'var(--grey)'}
            value={<>
              <Num value={heroGrowth} decimals={2} signed suffix="%" style={{ fontSize: 27, fontWeight: 700, color: summary.direction === 'fall' ? 'var(--neg)' : 'var(--pos)' }} />
            </>}
            sub={`Direction: ${summary.direction || 'not estimated'}  ·  peak ${heroPeakYear || 'not estimated'}`}
          />

          <HeroTile
            label="Crash risk"
            icon={<AlertTriangle size={13} />}
            accent={crashTone}
            gauge={<RingGauge
              value={heroCrashProb ?? 0}
              size={66}
              thickness={7}
              color={crashTone}
              label={heroCrashProb == null ? 'n/a' : `${Math.round(heroCrashProb)}%`}
            />}
            sub={crashSub}
          />

          <HeroTile
            label="Most likely peak year"
            icon={<CalendarDays size={13} />}
            accent="var(--gold)"
            value={<span className="num" style={{ fontSize: 27, fontWeight: 700, color: heroPeakYear ? 'var(--gold)' : 'var(--text-dim)' }}>{heroPeakYear || 'Not estimated'}</span>}
            sub="Highest point of the projected path"
          />

          <HeroTile
            label="Active conditions"
            icon={<Sparkles size={13} />}
            accent={activeTogglesCount > 0 ? 'var(--orange)' : 'var(--grey)'}
            value={<Num value={activeTogglesCount} decimals={0} style={{ fontSize: 27, fontWeight: 700, color: activeTogglesCount > 0 ? 'var(--orange)' : 'var(--text-strong)' }} />}
            sub={activeTogglesCount === 0 ? 'Baseline path - no what-if inputs' : 'Conditioned path - evidence-filtered'}
          />
        </div>
        <details className="mvp-notes">
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-strong)' }}>Hackathon MVP - under development - planned improvements</summary>
          <p style={{ margin: '8px 0 5px' }}>Next improvements can cover:</p>
          <ul style={{ margin: '0 0 4px 18px', lineHeight: 1.6 }}>
            <li>More import formats and automatic column mapping, including spreadsheets and non-financial operating data.</li>
            <li>Verified company, competitor, product, festival, and major-event evidence with source links.</li>
            <li>Industry-specific growth drivers, seasonality, product launches, and decision histories.</li>
            <li>Scenario controls for custom conditions, competitor responses, and combined shocks.</li>
            <li>Stronger walk-forward validation, forecast confidence checks, and clearer limits when data is sparse.</li>
            <li>Dataset review, saved workspaces, and exportable charts and reports.</li>
          </ul>
        </details>
        {loading && <p role="status" style={{ margin: '10px 4px', padding: '12px', background: 'var(--surface-2)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13 }}>Loading this company's history and profile...</p>}

        {/* PAGE 1: COMPANY PROFILE */}
        {activeTab === 1 && profile && (
          <div>
            <div className="grid-2col">
              {/* Identity & Structure Card */}
              <div className="content-card">
                <div className="card-title">
                  <span>Corporate Identity & Metadata</span>
                  <span className="provenance-tag">{profile.provenance.label || 'Source metadata unavailable'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13.5px' }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Company Name:</strong> <br />{profile.identity.company_name}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Ticker & Exchange:</strong> <br />{profile.identity.ticker} ({profile.identity.exchange})</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Primary Niche:</strong> <br />{profile.identity.niche}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Jurisdiction:</strong> <br />{profile.identity.main_country} ({profile.identity.currency})</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Fiscal Year End:</strong> <br />{profile.identity.fiscal_year_end}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Latest Source Date:</strong> <br />{profile.provenance.data_date || 'Not available'}</div>
                </div>

                {/* Section 12.4 Span Profile Card */}
                <div style={{ marginTop: '20px', padding: '14px', background: 'var(--surface-2)', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-strong)', marginBottom: '8px' }}>
                    Span Profile ({profile.span_profile.span} Current Horizon)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '12.5px' }}>
                    <div>Forecast Market Return: <strong style={{ color: heroGrowth == null ? 'var(--text-dim)' : heroGrowth >= 0 ? 'var(--pos)' : 'var(--neg)' }}>{heroGrowth == null ? 'Not estimated' : `${heroGrowth >= 0 ? '+' : ''}${heroGrowth.toFixed(2)}%`}</strong></div>
                    <div>Crash Probability: <strong style={{ color: crashTone }}>{heroCrashProb == null ? 'Not estimated' : `${heroCrashProb}%${heroCrashYear ? `  ·  ${heroCrashYear}` : ''}`}</strong></div>
                    <div>Peak Timing: <strong>{heroPeakYear || 'Not estimated'}</strong></div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Key Drivers: {profile.span_profile.main_drivers.join(", ")}
                  </div>
                </div>
              </div>

              {/* Latest Financials Snapshot */}
              <div className="content-card">
                <div className="card-title">
                  <span>Audited Financial Baseline</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currency in USD ($M)</span>
                </div>
                <div className="financials-grid">
                  <div className="fin-box">
                    <div className="fin-box-label">Revenue (Run-rate)</div>
                    <div className="fin-box-val"><Num value={profile.financials.revenue_usd_m} decimals={0} prefix="$" suffix="M" /></div>
                    <DeltaChip value={profile.financials.revenue_change_pct} suffix="% YoY" />
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Gross Margin</div>
                    <div className="fin-box-val"><Num value={profile.financials.gross_margin_pct} decimals={1} suffix="%" /></div>
                    <span className="fin-change change-pos"><Num value={profile.financials.gross_profit_usd_m} decimals={0} prefix="$" suffix="M" /></span>
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Operating EBIT</div>
                    <div className="fin-box-val"><Num value={profile.financials.operating_income_usd_m} decimals={0} prefix="$" suffix="M" /></div>
                    <span className="fin-change change-pos"><Num value={profile.financials.operating_margin_pct} decimals={1} suffix="% margin" /></span>
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Cash & Equivalents</div>
                    <div className="fin-box-val"><Num value={profile.financials.cash_usd_m} decimals={0} prefix="$" suffix="M" /></div>
                    <DeltaChip value={profile.financials.cash_change_pct} />
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Total Debt</div>
                    <div className="fin-box-val"><Num value={profile.financials.total_debt_usd_m} decimals={0} prefix="$" suffix="M" /></div>
                    <span className="fin-change change-neg">Principal outstanding</span>
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Altman Z-Score</div>
                    <div className="fin-box-val" style={{ color: profile.financials.altman_z_score > 2.9 ? 'var(--pos)' : 'var(--warn)' }}>
                      <Num value={profile.financials.altman_z_score} decimals={2} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile.financials.altman_z_score > 2.9 ? 'Safe zone' : 'Watch zone'}</span>
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Free Cash Flow</div>
                    <div className="fin-box-val"><Num value={profile.financials.free_cash_flow_usd_m} decimals={0} prefix="$" suffix="M" /></div>
                    <span className="fin-change change-pos">Operating cash flow less capex</span>
                  </div>
                  <div className="fin-box">
                    <div className="fin-box-label">Cash Runway</div>
                    <div className="fin-box-val" style={{ color: 'var(--pos)' }}>
                      {profile.financials.cash_runway_months === '999.0' ? 'Infinite' : <Num value={profile.financials.cash_runway_months} decimals={0} suffix=" Mo" />}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Self-Sustaining</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Decision History */}
            <div className="content-card">
              <div className="card-title">
                <span>Corporate Strategic Decision Log</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Past Interventions Recorded</span>
              </div>
              <div className="table-scroll">
              <table className="perm-table">
                <thead>
                  <tr>
                    <th>Decision ID</th>
                    <th>Category</th>
                    <th>Announced</th>
                    <th>Effective</th>
                    <th>Magnitude</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.decisions.length === 0 && <tr><td colSpan="7" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No usable dated decision records in the supplied company file.</td></tr>}
                  {profile.decisions.map(d => (
                    <tr key={d.decision_id}>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }}>{d.decision_id}</td>
                      <td>
                        <span style={{ 
                          background: 'var(--surface-2)', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {d.decision_type.replace("_", " ")}
                        </span>
                      </td>
                      <td>{d.announced_date}</td>
                      <td>{d.effective_date}</td>
                      <td>{d.magnitude} {d.magnitude_unit}</td>
                      <td>{d.short_description}</td>
                      <td>
                        <span style={{ color: 'var(--pos)', fontWeight: '600' }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: STRENGTHS & WEAKNESSES */}
        {activeTab === 2 && strengths && (
          <div>
            {/* Peer Group Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-strong)' }}>
                {strengths.total_peers > 0
                  ? `Comparing against ${strengths.total_peers} competitors in ${strengths.peer_group === 'niche' ? profile?.identity?.niche : profile?.identity?.main_country}`
                  : 'Based on the supplied company history; peer benchmarks are unavailable.'}
              </div>
              <div className="span-pill-group">
                <button 
                  className={`span-pill ${peerGroupType === 'niche' ? 'active' : ''}`}
                  onClick={() => setPeerGroupType('niche')}
                >
                  Niche Peers
                </button>
                <button 
                  className={`span-pill ${peerGroupType === 'country' ? 'active' : ''}`}
                  onClick={() => setPeerGroupType('country')}
                >
                  Country Peers
                </button>
              </div>
            </div>

            {/* Metric Ranks Grid */}
            <div className="grid-3col">
              {strengths.metrics.map((m, idx) => {
                const leader = m.rank != null && m.rank <= 2;
                const share = m.rank == null ? 0 : Math.max(6, ((m.total_peers - m.rank) / Math.max(1, m.total_peers - 1)) * 100);
                return (
                  <div key={idx} className="content-card rank-card" style={{ padding: '16px 20px' }}>
                    <div className="rank-head">
                      <span className="rank-name">{m.name}</span>
                      <span className={`rank-badge ${leader ? 'lead' : m.rank == null ? 'none' : 'mid'}`}>
                        {m.rank == null ? 'Observed' : `#${m.rank} of ${m.total_peers}`}
                      </span>
                    </div>
                    <div className="rank-value"><Num value={m.value} decimals={Number.isInteger(m.value) ? 0 : 2} style={{ color: leader ? 'var(--pos)' : 'var(--text-strong)' }} /></div>
                    <div style={{ marginTop: 10 }}><Meter value={share} gradient={leader ? 'var(--grad-pos)' : 'var(--grad-brand)'} /></div>
                    <div className="rank-foot">{leader ? 'Top of the peer cohort' : m.rank == null ? 'No comparable peers in the supplied data' : `Mid-pack against ${m.total_peers} peers`}</div>
                  </div>
                );
              })}
            </div>

            {/* Pros & Cons Columns */}
            <div className="grid-2col">
              {/* Pros Card */}
              <div className="content-card" style={{ borderLeft: '4px solid var(--pos)' }}>
                <div className="card-title" style={{ color: 'var(--pos)' }}>
                  <span>{selectedCompanyId.startsWith('UPLOAD-') ? 'Observed Strengths' : 'Key Strengths & Competitive Moats'}</span>
                  <CheckCircle2 size={18} />
                </div>
                {strengths.pros.map((p, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: idx < strengths.pros.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
                    <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-strong)' }}>{p.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{p.desc}</div>
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--accent)', fontWeight: '600' }}>
                      Linked Influencer: {p.linked_to} ({p.type})
                    </div>
                  </div>
                ))}
              </div>

              {/* Cons Card */}
              <div className="content-card" style={{ borderLeft: '4px solid var(--neg)' }}>
                <div className="card-title" style={{ color: 'var(--neg)' }}>
                  <span>{selectedCompanyId.startsWith('UPLOAD-') ? 'Observed Risks & Data Limits' : 'Vulnerabilities & Downside Exposures'}</span>
                  <AlertTriangle size={18} />
                </div>
                {strengths.cons.map((c, idx) => (
                  <div key={idx} style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: idx < strengths.cons.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
                    <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-strong)' }}>{c.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.desc}</div>
                    <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--neg)', fontWeight: '600' }}>
                      Exposed To: {c.linked_to} ({c.type})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: HISTORICAL TRENDS */}
        {activeTab === 3 && historyData && (
          <div>
            {/* View & Overlays Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Overlays:</span>
                <button 
                  className={`bubble-btn ${overlayFestivals ? 'active' : ''}`}
                  onClick={() => setOverlayFestivals(!overlayFestivals)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)' }}></span>
                  Festivals
                </button>
                <button 
                  className={`bubble-btn ${overlayEvents ? 'active' : ''}`}
                  onClick={() => setOverlayEvents(!overlayEvents)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet)' }}></span>
                  Major Events (9/11, COVID-19)
                </button>
                <button 
                  className={`bubble-btn ${overlayPins ? 'active' : ''}`}
                  onClick={() => setOverlayPins(!overlayPins)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pink)' }}></span>
                  Decision Pins
                </button>
                <button 
                  className={`bubble-btn ${overlayTrend ? 'active' : ''}`}
                  onClick={() => setOverlayTrend(!overlayTrend)}
                >
                  Turning Points
                </button>
              </div>

              <div className="span-pill-group">
                <button 
                  className={`span-pill ${historyView === 'monthly' ? 'active' : ''}`}
                  onClick={() => setHistoryView('monthly')}
                >
                  Monthly View
                </button>
                <button 
                  className={`span-pill ${historyView === 'yearly' ? 'active' : ''}`}
                  onClick={() => setHistoryView('yearly')}
                >
                  Yearly View
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                {historyView === 'monthly' && <select value={historyMetric} onChange={event => setHistoryMetric(event.target.value)} style={{ padding: '7px 9px', border: '1px solid var(--line-strong)', borderRadius: '8px', color: 'var(--text-strong)' }}>
                  {(historyData.metric_options || [{ key: 'close', label: 'Adjusted close' }]).map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>}
                <div className="span-pill-group" aria-label="Historical graph line style">
                  {[['straight', 'Line'], ['curve', 'Smooth']].map(([style, label]) => <button key={style} className={`span-pill ${historyLineStyle === style ? 'active' : ''}`} onClick={() => setHistoryLineStyle(style)}>{label}</button>)}
                </div>
                <select aria-label="Historical graph time range" value={historyRange} onChange={event => { setHistoryRange(event.target.value); setHistoryHoverIndex(null); }} style={{ padding: '7px 9px', border: '1px solid var(--line-strong)', borderRadius: '8px', color: 'var(--text-strong)', background: 'var(--surface-1)' }}>
                  <optgroup label="Trading sessions"><option value="1D">1 day</option><option value="2D">2 days</option><option value="3D">3 days</option><option value="7D">7 days</option><option value="1W">1 week</option><option value="2W">2 weeks</option><option value="3W">3 weeks</option><option value="4W">4 weeks</option></optgroup>
                  <optgroup label="Calendar range"><option value="1M">1 month</option><option value="3M">3 months</option><option value="6M">6 months</option><option value="12M">12 months</option><option value="24M">24 months</option><option value="60M">5 years</option><option value="ALL">All history (monthly)</option></optgroup>
                </select>
              </div>
            </div>

            {/* Interactive History SVG Chart */}
            <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title">
                <span><BarChart3 size={17} style={{ color: 'var(--accent)' }} /> Observed {displayedHistoryFrequency}  |  {historyData.metric_options?.find(option => option.key === displayHistoryMetric)?.label || 'Adjusted Close'}</span>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: 700, flexWrap: 'wrap', alignItems: 'center' }}>
                  {historySeriesStale && <span className="recomputing-chip"><RefreshCw size={12} /> switching window</span>}
                  <span className="legend-chip" style={{ color: historyLineColor }}><i style={{ background: historyLineColor }} /> Actual history</span>
                  {overlayTrend && <span className="legend-chip" style={{ color: 'var(--text-muted)' }}><i style={{ background: 'var(--text-muted)' }} /> Trend</span>}
                  <span className="legend-chip" style={{ color: 'var(--pos)' }}><i style={{ background: 'var(--pos)' }} /> Peaks</span>
                  <span className="legend-chip" style={{ color: 'var(--neg)' }}><i style={{ background: 'var(--neg)' }} /> Troughs</span>
                </div>
              </div>

              {visibleHistoryPoints.length > 0 && (() => {
                const metricValues = visibleMetricValues;
                if (!metricValues.length) return null;
                const first = metricValues[0], latest = metricValues.at(-1);
                const high = Math.max(...metricValues), low = Math.min(...metricValues);
                const signedSeries = isSignedSeries(metricValues);
                const digits = decimalsFor(seriesSpan(metricValues));
                const absoluteChange = latest - first;
                const movement = changeDisplay(first, latest);
                // A return series straddles zero, so "percentage change from the
                // first observation" is meaningless there (-0.0004 to +0.0012
                // prints +450%): those get the absolute move. Growth that spans
                // more than 1000% reads as a multiple, not a nine-digit percent.
                const tiles = [
                  { label: 'Latest', tone: 'var(--text-strong)', node: <Num value={latest} decimals={digits} compact={Math.abs(latest) >= 1e5} /> },
                  {
                    label: signedSeries ? 'Range move (abs)' : movement.kind === 'multiple' ? 'Range multiple' : 'Range change',
                    tone: absoluteChange >= 0 ? 'var(--pos)' : 'var(--neg)',
                    node: signedSeries
                      ? <span className="num">{`${absoluteChange >= 0 ? '+' : ''}${absoluteChange.toFixed(digits)}`}</span>
                      : movement.kind === 'multiple'
                        ? <span className="num">{`\u00d7${movement.value.toFixed(2)}`}</span>
                        : <DeltaChip value={movement.value ?? null} />,
                  },
                  { label: 'Range high', tone: 'var(--pos)', node: <Num value={high} decimals={digits} compact={high >= 1e5} /> },
                  { label: 'Range low', tone: 'var(--neg)', node: <Num value={low} decimals={digits} compact={Math.abs(low) >= 1e5} /> },
                ];
                return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(146px, 1fr))', gap: '12px', marginBottom: '16px', opacity: historySeriesStale ? 0.55 : 1 }}>
                  {tiles.map(tile => <div key={tile.label} className="stat-tile">
                    <small>{tile.label}</small>
                    <div className="stat-tile-value" style={{ color: tile.tone }}>{tile.node}</div>
                  </div>)}
                </div>;
              })()}

              <div className="chart-tools">
                <span className="chart-tools-hint">drag across the chart to zoom · double-click to reset</span>
                <div className="chart-tools-actions">
                  <button className="icon-btn" onClick={() => historyZoom.zoomBy(0.7)} disabled={visibleHistoryPoints.length < 4} title="Zoom into the middle of the window"><ZoomIn size={13} /> In</button>
                  <button className="icon-btn" onClick={() => historyZoom.zoomBy(1.45)} disabled={visibleHistoryPoints.length < 4} title="Zoom out"><ZoomOut size={13} /> Out</button>
                  <button className="icon-btn" onClick={historyZoom.reset} disabled={!historyZoom.active} title="Show the whole window again"><Maximize2 size={13} /> Reset</button>
                  {historyZoom.active && <span className="legend-chip" style={{ color: 'var(--accent)' }}>{historyZoom.count} of {windowedHistoryPoints.length} points</span>}
                </div>
              </div>

              <div className="chart-container" ref={historyChartRef} style={{ height: '360px' }}>
                {((overlayEvents && !visibleEventExplanations.some(item => item.category === 'event')) || (overlayFestivals && !visibleEventExplanations.some(item => item.category === 'festival')) || (overlayPins && visibleDecisions.length === 0)) && <div style={{ margin: '0 8px 6px', color: 'var(--text-muted)', fontSize: '11px' }}>
                  {overlayEvents && !visibleEventExplanations.some(item => item.category === 'event') && <span style={{ marginRight: 12 }}>No named 9/11 or COVID period falls within this date range.</span>}
                  {overlayFestivals && visibleEventExplanations.some(item => item.category === 'festival') && <span style={{ marginRight: 12 }}>Yellow bands show dated festivals or approximate regional calendar windows.</span>}
                  {overlayPins && visibleDecisions.length === 0 && <span>No dated decision records are available for this period.</span>}
                </div>}
                {(() => {
                  // Data-driven historical SVG chart  -  real dates, zoomable window
                  const pts = visibleHistoryPoints;
                  if (pts.length === 0) return <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>{dailyHistoryRange && historyView === 'monthly' ? (dailyHistoryData ? 'No source observations are available for this range.' : 'Loading observations for this time range...') : 'No history is available for this range.'}</div>;

                  const SVG_W = 900, SVG_H = 320;
                  // Top padding is the festival lane: band names sit above the plot,
                  // never on top of the line.
                  const PAD_L = 58, PAD_R = 20, PAD_T = 48, PAD_B = 44;
                  const plotW = SVG_W - PAD_L - PAD_R;
                  const plotH = SVG_H - PAD_T - PAD_B;

                  // Label size and tick count follow the rendered width, so the chart
                  // stays legible at full screen, half screen or a quarter of it.
                  const labelScale = Math.min(2, Math.max(1, 900 / Math.max(320, historyChartWidth)));
                  const maxTicks = Math.max(3, Math.min(10, Math.floor(Math.max(320, historyChartWidth) / 96)));
                  const tickEvery = Math.max(1, Math.ceil((pts.length - 1) / (maxTicks - 1)));

                  const vals = pts.map(p => Number(p.metric_values?.[displayHistoryMetric] ?? p.value));
                  const rawMin = Math.min(...vals), rawMax = Math.max(...vals);
                  // The old floor of 0.01 absolute blew a daily-return series (span
                  // 0.006) out to a hair on the axis. Padding now scales with the
                  // data instead of assuming prices live in the hundreds.
                  const dataSpan = rawMax - rawMin;
                  const magnitude = Math.max(Math.abs(rawMax), Math.abs(rawMin));
                  const pad = Math.max(dataSpan * 0.12, magnitude * 0.02, Math.abs(rawMax || rawMin || 1) * 0.001, 1e-9);
                  const minV = rawMin - pad;
                  const maxV = rawMax + pad;
                  const lineColor = vals.at(-1) >= vals[0] ? 'var(--pos)' : 'var(--neg)';

                  const getX = i => PAD_L + (i / Math.max(1, pts.length - 1)) * plotW;
                  // The old `Math.max(1, maxV - minV)` denominator silently
                  // clamped every sub-1 series (daily return, volatility, FX)
                  // to a 0-1 domain, so the line drew as a hair on the axis while
                  // the tick labels used the real data range. Scale by the data.
                  const ySpan = Math.max(maxV - minV, 1e-12);
                  const getY = v => PAD_T + plotH - ((v - minV) / ySpan) * plotH;

                  // Connect every observation so the chart shows the actual rise and fall, not isolated dots.
                  const coordinates = pts.map((_, i) => ({ x: getX(i), y: getY(vals[i]) }));
                  const histPath = coordinates.reduce((path, point, i) => {
                    if (i === 0) return `M ${point.x} ${point.y}`;
                    if (historyLineStyle === 'straight' || coordinates.length < 3) return `${path} L ${point.x} ${point.y}`;
                    const previous = coordinates[i - 1];
                    const before = coordinates[Math.max(0, i - 2)];
                    const after = coordinates[Math.min(coordinates.length - 1, i + 1)];
                    const c1x = previous.x + (point.x - before.x) / 6;
                    const c1y = previous.y + (point.y - before.y) / 6;
                    const c2x = point.x - (after.x - previous.x) / 6;
                    const c2y = point.y - (after.y - previous.y) / 6;
                    return `${path} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${point.x} ${point.y}`;
                  }, '');

                  // Trailing three-observation trend follows the selected metric.
                  const trendValues = vals.map((value, i) => {
                    const start = Math.max(0, i - 2);
                    return vals.slice(start, i + 1).reduce((sum, item) => sum + item, 0) / (i - start + 1);
                  });
                  const trendPath = trendValues.map((value, i) => `${i ? 'L' : 'M'} ${getX(i)} ${getY(value)}`).join(' ');
                  const turningPoints = trendValues.slice(1, -1).map((value, offset) => {
                    const i = offset + 1;
                    const before = trendValues[i - 1], after = trendValues[i + 1];
                    const isTurn = (value >= before && value > after) || (value <= before && value < after);
                    const material = Math.abs(value - before) + Math.abs(value - after) >= (rawMax - rawMin) * 0.08;
                    return isTurn && material ? { index: i, direction: value > before ? 'Peak' : 'Trough' } : null;
                  }).filter(Boolean);

                  // Peak & Trough from data
                  let peakIdx = 0, troughIdx = 0;
                  vals.forEach((v, i) => {
                    if (v > vals[peakIdx]) peakIdx = i;
                    if (v < vals[troughIdx]) troughIdx = i;
                  });

                  // Overlay region X coords mapped from dates
                  const dateToX = date => {
                    const i = pts.findIndex(p => p.date === date || p.date.startsWith(date) || (p.date.length === 4 && date.startsWith(p.date)));
                    return i >= 0 ? getX(i) : null;
                  };

                  // Format date string "YYYY-MM" -> "Jan 2022"
                  const fmtDate = d => {
                    if (String(d).length === 4) return String(d);
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    try {
                      const [y, m] = d.split('-');
                      return `${months[parseInt(m,10)-1]} ${y}`;
                    } catch { return d; }
                  };

                  // X-axis hover and zoom use the same index maths as the plot.
                  const hoverIndex = historyHoverIndex == null ? null : Math.min(pts.length - 1, historyHoverIndex);
                  const hoverPoint = hoverIndex == null ? null : pts[hoverIndex];
                  const indexAt = (clientX, target) => {
                    const rect = target.getBoundingClientRect();
                    const svgX = ((clientX - rect.left) / rect.width) * SVG_W;
                    const ratio = Math.max(0, Math.min(1, (svgX - PAD_L) / plotW));
                    return Math.round(ratio * (pts.length - 1));
                  };

                  // Map overlay regions from API
                  const eventRegions = (historyData.regions || []).filter(r => r.category === 'event');
                  const festRegions  = (historyData.regions || []).filter(r => r.category === 'festival');
                  const metricOption = historyData.metric_options?.find(option => option.key === displayHistoryMetric);
                  const yLabel = metricOption?.unit || 'source units';
                  const areaPath = `${histPath} L ${getX(pts.length - 1)} ${PAD_T + plotH} L ${getX(0)} ${PAD_T + plotH} Z`;
                  const nearestX = date => {
                    const idx = pts.findIndex(p => p.date === date || p.date.startsWith(date) || (p.date.length === 4 && date.startsWith(p.date)));
                    return idx < 0 ? null : getX(idx);
                  };
                  const regionBounds = region => {
                    const firstMonth = String(pts[0].date).slice(0, 7);
                    const lastMonth = String(pts.at(-1).date).slice(0, 7);
                    if (region.end < firstMonth || region.start > lastMonth) return null;
                    let first = -1, last = -1;
                    pts.forEach((point, index) => {
                      const month = String(point.date).slice(0, 7);
                      if (month >= region.start && month <= region.end) { if (first < 0) first = index; last = index; }
                    });
                    if (first < 0 || last < 0) return null;
                    const halfStep = plotW / Math.max(1, pts.length - 1) / 2;
                    return { x: Math.max(PAD_L, getX(first) - halfStep), width: Math.min(PAD_L + plotW, getX(last) + halfStep) - Math.max(PAD_L, getX(first) - halfStep), center: getX(first) };
                  };

                  // Festival lane. Only a *dated, non-calendar* record from the
                  // company's own file outranks the world calendar - the datasets
                  // carry generic "holiday shopping season" windows that used to
                  // swallow Diwali, Thanksgiving and Black Friday entirely. Each
                  // festival is named once, in the first free lane above the plot.
                  const claimedMonths = new Set();
                  const datedNames = new Set();
                  festRegions.forEach(region => {
                    if (region.calendar_based) return;
                    datedNames.add(String(region.name || '').toLowerCase());
                    pts.forEach(point => {
                      const month = String(point.date).slice(0, 7);
                      if (month >= region.start && month <= region.end) claimedMonths.add(month);
                    });
                  });
                  const calendarBands = [];
                  festivalsForCountry(profile?.identity?.main_country, 18).forEach(festival => {
                    if ([...datedNames].some(name => name && name.includes(festival.name.toLowerCase()))) return;
                    const months = new Set(monthsCovered(festival));
                    let run = null;
                    pts.forEach((point, index) => {
                      const monthKey = String(point.date).slice(0, 7);
                      const inside = months.has(Number(monthKey.slice(5, 7))) && !claimedMonths.has(monthKey);
                      if (inside) run = run ? { ...run, end: index } : { start: index, end: index };
                      else if (run) { calendarBands.push({ ...festival, ...run }); run = null; }
                    });
                    if (run) calendarBands.push({ ...festival, ...run });
                  });
                  const namedFestivals = new Set();
                  // Three label lanes above the plot; a label that would collide
                  // with the one already in every lane is dropped (the band and its
                  // tooltip stay, and the full list is printed under the chart).
                  const laneFreeAt = [0, 0, 0];
                  const placeLabel = (x, width) => {
                    const lane = laneFreeAt.findIndex(right => right + 6 <= x);
                    if (lane < 0) return null;
                    laneFreeAt[lane] = x + width;
                    return lane;
                  };
                  const halfStepX = plotW / Math.max(1, pts.length - 1) / 2;

                  return (
                    <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label={`${historyData.metric_options?.find(option => option.key === displayHistoryMetric)?.label || 'Company metric'} history chart`} style={{ cursor: 'crosshair', touchAction: 'pan-y' }}
                      onMouseDown={event => { if (event.button !== 0 || pts.length < 4) return; const index = indexAt(event.clientX, event.currentTarget); setHistoryDrag({ from: index, to: index }); }}
                      onMouseMove={event => { const index = indexAt(event.clientX, event.currentTarget); setHistoryHoverIndex(index); if (historyDrag) setHistoryDrag(previous => ({ ...previous, to: index })); }}
                      onMouseUp={() => {
                        if (!historyDrag) return;
                        const low = Math.min(historyDrag.from, historyDrag.to);
                        const high = Math.max(historyDrag.from, historyDrag.to);
                        if (high - low >= 1) historyZoom.zoomToRange(low + historyZoom.start, high + 1 + historyZoom.start);
                        setHistoryDrag(null);
                      }}
                      onDoubleClick={historyZoom.reset}
                      onMouseLeave={() => { setHistoryHoverIndex(null); setHistoryDrag(null); }}>
                      <defs>
                        <linearGradient id="historyAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={lineColor} stopOpacity=".20"/><stop offset="100%" stopColor={lineColor} stopOpacity="0"/></linearGradient>
                        <filter id="historyLineGlow" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="3.4" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      {/* Grid Lines - full floor-to-top coverage so no data sits
                          below the lowest labelled tick */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, gi) => {
                        const y = PAD_T + (1 - ratio) * plotH;
                        const label = axisNumber(minV + ratio * (maxV - minV), maxV - minV);
                        return <g key={gi}><line x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} stroke="var(--grid-line)" strokeWidth="1" />
                          <text x={PAD_L - 5} y={y - 3} textAnchor="end" fontSize={10 * labelScale} fill="var(--text-muted)">{label}</text></g>;
                      })}

                      {/* Shaded Event Regions (from API) */}
                      {overlayFestivals && festRegions.map(r => {
                        const bounds = regionBounds(r);
                        if (!bounds) return null;
                        const alreadyNamed = namedFestivals.has(r.name);
                        let labelLane = null;
                        if (!alreadyNamed) {
                          namedFestivals.add(r.name);
                          labelLane = placeLabel(bounds.x, String(r.name || '').length * 5.6 * labelScale + 8);
                        }
                        return <g key={`${r.event_id}-${r.start}`}>
                          <rect x={bounds.x} y={PAD_T} width={Math.max(2, bounds.width)} height={plotH} fill="var(--gold)" fillOpacity={r.calendar_based ? '.12' : '.24'}><title>{r.name}. {r.calendar_based ? 'Approximate regional calendar context; not a verified company event.' : 'Dated festival record in the supplied data.'}</title></rect>
                          {labelLane !== null && <text x={bounds.x + 3} y={PAD_T - 6 - labelLane * 12} fontSize={9.5 * labelScale} fontWeight="800" fill="var(--gold)">{r.name}</text>}
                        </g>;
                      })}
                      {overlayFestivals && calendarBands.map(band => {
                        const x = Math.max(PAD_L, getX(band.start) - halfStepX);
                        const right = Math.min(PAD_L + plotW, getX(band.end) + halfStepX);
                        const alreadyNamed = namedFestivals.has(band.name);
                        let lane = null;
                        if (!alreadyNamed) {
                          namedFestivals.add(band.name);
                          lane = placeLabel(x, band.name.length * 5.6 * labelScale + 8);
                        }
                        return <g key={`calendar-${band.name}-${band.start}`} pointerEvents="none">
                          <rect x={x} y={PAD_T} width={Math.max(2, right - x)} height={plotH} fill="var(--gold)" fillOpacity=".07">
                            <title>{band.name} - {band.note} Approximate calendar window, not a verified company event.</title>
                          </rect>
                          <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + plotH} stroke="var(--gold)" strokeOpacity=".32" strokeDasharray="2 4" />
                          {lane !== null && <text x={x + 3} y={PAD_T - 6 - lane * 12} fontSize={9.5 * labelScale} fontWeight="800" fill="var(--gold)" opacity=".95">{band.name}</text>}
                        </g>;
                      })}
                      {overlayEvents && eventRegions.map(r => {
                        const bounds = regionBounds(r);
                        if (!bounds) return null;
                        return <g key={`${r.event_id}-${r.start}`}><rect x={bounds.x} y={PAD_T} width={Math.max(2, bounds.width)} height={plotH} fill="var(--violet)" fillOpacity=".10"><title>{r.name}: {r.start} to {r.end}. Context annotation, not a causal claim.</title></rect><line x1={bounds.x} y1={PAD_T} x2={bounds.x} y2={PAD_T + plotH} stroke="var(--violet)" strokeWidth="1.5" strokeDasharray="4 4"/><rect x={Math.min(bounds.x + 4, PAD_L + plotW - 150)} y={PAD_T + 4} width="146" height="16" rx="4" fill="var(--violet-tint)"/><text x={Math.min(bounds.x + 8, PAD_L + plotW - 146)} y={PAD_T + 15} fontSize="8.5" fontWeight="700" fill="var(--violet)">{r.name}</text></g>;
                      })}

                      <text x="8" y={PAD_T + plotH / 2} transform={`rotate(-90 8 ${PAD_T + plotH / 2})`} textAnchor="middle" fontSize={10 * labelScale} fill="var(--text-muted)">{yLabel}</text>

                      {/* Three-point trend guide with its meaningful local turning points. */}
                      {overlayTrend && (
                        <g><path d={trendPath} fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" />
                          {turningPoints.map(({ index, direction }) => <g key={`turn-${index}`}><circle cx={getX(index)} cy={getY(trendValues[index])} r="4.5" fill={direction === 'Peak' ? 'var(--pos)' : 'var(--neg)'} stroke="var(--dot-ring)" strokeWidth="1.5"><title>{direction} in {fmtDate(pts[index].date)}  |  smoothed trend turning point</title></circle></g>)}
                        </g>
                      )}

                      {/* Actual History Line (Solid Blue var(--accent)) */}
                      <path d={areaPath} fill="url(#historyAreaFill)" />
                      <path d={histPath} fill="none" stroke={lineColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#historyLineGlow)" />

                      {/* Subtle high and low points; exact values are in the range summary above. */}
                      <circle cx={getX(peakIdx)} cy={getY(vals[peakIdx])} r="4" fill="var(--dot-ring)" stroke="var(--pos)" strokeWidth="2"><title>Period high: {fmtDate(pts[peakIdx].date)}  |  {Number(vals[peakIdx]).toLocaleString()}</title></circle>
                      {troughIdx !== peakIdx && <circle cx={getX(troughIdx)} cy={getY(vals[troughIdx])} r="4" fill="var(--dot-ring)" stroke="var(--neg)" strokeWidth="2"><title>Period low: {fmtDate(pts[troughIdx].date)}  |  {Number(vals[troughIdx]).toLocaleString()}</title></circle>}

                      {historyDrag && Math.abs(historyDrag.to - historyDrag.from) >= 1 && <rect
                        x={Math.min(getX(historyDrag.from), getX(historyDrag.to))}
                        y={PAD_T}
                        width={Math.abs(getX(historyDrag.to) - getX(historyDrag.from))}
                        height={plotH}
                        fill="var(--accent)" fillOpacity=".16" stroke="var(--accent)" strokeDasharray="3 3" pointerEvents="none"
                      />}

                      {hoverIndex != null && hoverPoint && <g pointerEvents="none">
                        <line x1={getX(hoverIndex)} y1={PAD_T} x2={getX(hoverIndex)} y2={PAD_T + plotH} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx={getX(hoverIndex)} cy={getY(vals[hoverIndex])} r="5" fill={lineColor} stroke="var(--dot-ring)" strokeWidth="2" />
                        <g transform={`translate(${getX(hoverIndex) > PAD_L + plotW * .72 ? getX(hoverIndex) - 165 : getX(hoverIndex) + 8}, ${Math.max(PAD_T + 4, getY(vals[hoverIndex]) - 48)})`} pointerEvents="none">
                          <rect width="158" height="40" rx="8" fill="var(--tip-bg)" stroke="var(--tip-line)" />
                          <text x="9" y="15" fontSize="10" fill="var(--tip-sub)">{fmtDate(hoverPoint.date)}</text>
                          <text x="9" y="31" fontSize="12" fontWeight="700" fill="var(--tip-text)">{Number(vals[hoverIndex]).toLocaleString(undefined, { maximumFractionDigits: 3 })} {yLabel}</text>
                        </g>
                      </g>}

                      {/* Decision markers are pinned to their observed effective month. */}
                      {overlayPins && visiblePinMarkers.map((pin, pinNo) => {
                        const pinMonth = String(pin.date).slice(0, 7);
                        const idx = pts.findIndex(p => p.date === pinMonth || p.date.startsWith(pinMonth));
                        if (idx < 0) return null;
                        const isSelected = selectedDecisionPin === pin;
                        return <g key={`${pin.date}-${pin.title}-${pinNo}`} onClick={() => setSelectedDecisionPin(isSelected ? null : pin)} style={{ cursor: 'pointer' }}>
                          <line x1={getX(idx)} y1={PAD_T} x2={getX(idx)} y2={PAD_T + plotH} stroke="var(--pink)" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle cx={getX(idx)} cy={getY(vals[idx])} r="6" fill="var(--pink)" stroke="var(--dot-ring)" strokeWidth="2"><title>{pin.title}: {pin.description}</title></circle>
                          {isSelected && <g><rect x={Math.min(getX(idx) + 8, PAD_L + plotW - 210)} y={PAD_T + 30} width="205" height="48" rx="8" fill="var(--tip-bg)" stroke="var(--pink)"/><text x={Math.min(getX(idx) + 14, PAD_L + plotW - 204)} y={PAD_T + 46} fontSize="9" fontWeight="700" fill="var(--pink)">{pin.date}  |  {pin.title}</text><text x={Math.min(getX(idx) + 14, PAD_L + plotW - 204)} y={PAD_T + 62} fontSize="8" fill="var(--tip-sub)">{String(pin.description || '').slice(0, 42)}</text></g>}
                        </g>;
                      })}

                      {/* X-Axis Labels (real dates from API). Ticks are spaced so the final
                          label never lands on top of the one before it. */}
                      {(() => {
                        const lastIndex = pts.length - 1;
                        const ticks = new Set();
                        for (let index = 0; index <= lastIndex; index += tickEvery) ticks.add(index);
                        const previous = Math.max(...ticks);
                        if (lastIndex - previous < tickEvery * 0.6) ticks.delete(previous);
                        ticks.add(lastIndex);
                        return [...ticks].sort((a, b) => a - b).map(i => {
                          const p = pts[i];
                          const x = getX(i);
                          const label = historyView === 'yearly'
                            ? (p.date ? p.date.slice(0, 4) : '')
                            : dailyHistoryRange && p.date_label ? p.date_label : fmtDate(p.date);
                          return (
                            <g key={i}>
                              <line x1={x} y1={PAD_T + plotH} x2={x} y2={PAD_T + plotH + 4} stroke="var(--line-strong)" strokeWidth="1" />
                              <text
                                x={x}
                                y={PAD_T + plotH + 16}
                                textAnchor="middle"
                                fontSize={10.5 * labelScale}
                                fontWeight="600"
                                fill="var(--text-muted)"
                                transform={pts.length > 12 ? `rotate(-35, ${x}, ${PAD_T + plotH + 16})` : undefined}
                              >
                                {label}
                              </text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  );
                })()}
              </div>

              {/* Every festival in view is listed here, so a label that had to be
                  dropped to avoid a pile-up on the axis is still readable. */}
              {overlayFestivals && visibleHistoryPoints.length > 0 && (() => {
                const monthsInView = new Set(visibleHistoryPoints.map(point => Number(String(point.date).slice(5, 7))));
                const inView = festivalsForCountry(profile?.identity?.main_country, 18)
                  .filter(festival => monthsCovered(festival).some(month => monthsInView.has(month)));
                if (!inView.length) return null;
                return <div className="festival-legend">
                  <span className="festival-legend-title">Festival &amp; shopping windows touching this range</span>
                  <div className="festival-legend-items">
                    {inView.map(festival => <span key={festival.name} className="festival-legend-item" title={festival.note}><i />{festival.name}</span>)}
                  </div>
                </div>;
              })()}
            </div>

            <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title"><span>What the selected overlays show</span></div>
              {overlayFestivals && visibleEventExplanations.filter(item => item.category === 'festival').map((item, idx) => (
                <div key={`festival-${idx}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-2)', fontSize: '13px' }}>
                  <strong>{item.name}</strong>  ·  {item.start}  ·  observed company move {item.observed_change_pct ?? 'n/a'}%
                  {item.sector_change_pct !== null && `  ·  sector ${item.sector_change_pct}%`}<div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.interpretation}</div>
                </div>
              ))}
              {overlayEvents && visibleEventExplanations.filter(item => item.category === 'event').map((item, idx) => (
                <div key={`event-${idx}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-2)', fontSize: '13px' }}>
                  <strong>{item.name}</strong>  ·  {item.start}  ·  observed company move {item.observed_change_pct ?? 'n/a'}%
                  {item.sector_change_pct !== null && `  ·  sector ${item.sector_change_pct}%`}<div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{item.interpretation}</div>
                </div>
              ))}
              {overlayPins && visibleDecisions.length > 0 && visibleDecisions.slice(-50).map((decision, idx) => (
                <div key={`decision-${idx}`} style={{ padding: '10px 0', borderBottom: '1px solid var(--surface-2)', fontSize: '13px' }}>
                  <strong>{decision.date}  ·  {decision.type}</strong>  ·  {decision.description || 'No description provided'}
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Following-month market move: {decision.company_return_month_pct ?? 'n/a'}%  ·  {decision.interpretation}</div>
                </div>
              ))}
              {overlayPins && visibleDecisions.length > 50 && <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Showing the latest 50 of {visibleDecisions.length} monthly decision records in this view. The chart samples up to 12 dated monthly pins; click a pin for its source description.</p>}
              {overlayPins && visibleDecisions.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No usable dated decision records were found in this company file.</p>}
              {overlayFestivals && !(historyData.event_explanations || []).some(item => item.category === 'festival') &&
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>The supplied data has no dated festival or sale-event records for this company, so no festival effect is inferred.</p>}
              {overlayEvents && !(historyData.event_explanations || []).some(item => item.category === 'event') &&
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No dated special-event records are available for this company in the selected period.</p>}
            </div>

            <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title"><span><CalendarDays size={17} style={{ color: 'var(--gold)' }} /> Calendar-Month Return Heat Map</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>average monthly return</span></div>
              <p className="card-lede">Historical adjusted-close returns grouped by calendar month. This measures seasonality in the supplied market series; it does not assign an effect to a festival unless that event is present in the source. Stronger colour means a larger repeat pattern.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))', gap: '8px' }}>
                {(historyData.seasonality || []).map(item => {
                  const strength = Math.min(1, Math.abs(item.average_return_pct ?? 0) / 4);
                  const tint = (item.average_return_pct ?? 0) >= 0
                    ? `color-mix(in srgb, var(--pos) ${Math.round(8 + strength * 34)}%, var(--surface-2))`
                    : `color-mix(in srgb, var(--neg) ${Math.round(8 + strength * 34)}%, var(--surface-2))`;
                  return (
                    <div key={item.month} className="heat-cell" style={{ background: tint }}>
                      <div className="heat-month">{new Date(2000, item.month - 1, 1).toLocaleString('en', { month: 'short' })}</div>
                      <div className="heat-value" style={{ color: item.average_return_pct >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                        <Num value={item.average_return_pct} decimals={2} signed suffix="%" />
                      </div>
                      <div className="heat-sub">n={item.observations}  ·  median {item.median_return_pct}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-dim)' }}>Data: {historyData.data_quality?.source_file || 'company file'}  ·  {historyData.data_quality?.first_observation} to {historyData.data_quality?.last_observation}  ·  month-end close aggregated from intraday rows.</div>
            </div>

            {/* Yearly Summary */}
            <div className="content-card">
              <div className="card-title">
                <span><TrendingUp size={17} style={{ color: 'var(--pos)' }} /> Year-End Close &amp; Annual Return</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>peak year highlighted</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {historyData.yearly_summary.map(y => (
                  <div key={y.year} className={`year-card ${y.is_peak ? 'peak' : ''}`}>
                    {y.is_peak && <span className="year-ribbon">All-time peak year</span>}
                    <div className="year-label">Calendar {y.year}</div>
                    <div className="year-value"><Num value={y.year_end_close} decimals={2} prefix="$" /></div>
                    <div className="year-change">
                      {y.growth_pct === null ? 'First observed year' : <><DeltaChip value={y.growth_pct} /> annual change</>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}



        {/* PAGE 4: FUTURE FORECAST & SCENARIOS */}
        {activeTab === 4 && (
          <div>
            <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title">
                <span><Flame size={17} style={{ color: 'var(--orange)' }} /> Scenario Studio</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeTogglesCount === 0 ? 'General company trend' : `${activeTogglesCount} input${activeTogglesCount === 1 ? '' : 's'} active`}</span>
              </div>
              <p className="card-lede">Start from one of five umbrellas - world events, this company's decisions, peer moves, seasonality, or macro shocks. Only the family you open expands, so nothing hides behind a long scroll. Every estimate is an association measured from supplied data, never a causal claim.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', margin: '4px 0 18px' }}>
                <label className="field-label">Forecast start
                  <input className="field-input" type="month" value={forecastStartMonth} onChange={event => setForecastStartMonth(event.target.value)} />
                </label>
                <label className="field-label">Forecast end
                  <input className="field-input" type="month" value={forecastEndMonth} onChange={event => setForecastEndMonth(event.target.value)} />
                </label>
                {[6, 12, 24].map(months => (
                  <button key={months} type="button" className={`span-pill ${selectedSpan === `${months}M` ? 'active' : ''}`} onClick={() => selectPresetSpan(`${months}M`)}>{months}M</button>
                ))}
              </div>
              {!scenarioCatalog && !scenarioCatalogRequested ? (
                <div style={{ padding: '16px 18px', border: '1px dashed var(--line-strong)', borderRadius: 14, background: 'var(--surface-2)' }}>
                  <strong style={{ fontSize: 14 }}>Scenario conditions are optional</strong>
                  <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--text-muted)', maxWidth: 720 }}>
                    {forecastLoading || !forecastData ? 'The baseline projection is being prepared. ' : 'The baseline projection is ready. '}Load dated event and decision analogs only when you want to compare a conditioned path against it.
                  </p>
                  <button className="bubble-btn active" onClick={() => setScenarioCatalogRequested(true)}><Sparkles size={14} /> Open the scenario umbrellas</button>
                </div>
              ) : (
                <ScenarioLab
                  catalog={scenarioCatalog}
                  toggles={toggles}
                  onToggle={toggleSwitch}
                  primitives={scenarioPrimitives}
                  onPrimitiveChange={(key, value) => setScenarioPrimitives(previous => ({ ...previous, [key]: value }))}
                  rateShockBps={rateShockBps}
                  onRateShockChange={setRateShockBps}
                  userCalendarInputs={userCalendarInputs}
                  calendarEventName={calendarEventName}
                  onCalendarEventNameChange={setCalendarEventName}
                  calendarEventMonth={calendarEventMonth}
                  onCalendarEventMonthChange={setCalendarEventMonth}
                  onAddCalendar={addCalendarScenario}
                  onClearAll={resetAllToggles}
                  activeCount={activeTogglesCount}
                  busy={forecastLoading}
                />
              )}
            </div>

            {forecastData?.current_position && <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title"><span><Gauge size={17} style={{ color: 'var(--accent)' }} /> Current Company Position</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>As of {forecastData.current_position.as_of || 'last supplied observation'}</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '26px', alignItems: 'flex-end' }}>
                <div>
                  <div className="hero-label">Trend</div>
                  <strong style={{ fontSize: 22, color: forecastData.current_position.trend === 'falling' ? 'var(--neg)' : 'var(--pos)', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>{forecastData.current_position.trend}</strong>
                </div>
                <div>
                  <div className="hero-label">Latest {forecastData.current_position.metric}</div>
                  <Num value={forecastData.current_position.latest_value} decimals={2} style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)' }} />
                </div>
                <div>
                  <div className="hero-label">3-month</div>
                  <DeltaChip value={forecastData.current_position.three_month_change_pct} />
                </div>
                <div>
                  <div className="hero-label">12-month</div>
                  <DeltaChip value={forecastData.current_position.twelve_month_change_pct} />
                </div>
                <div>
                  <div className="hero-label">Drawdown from 12m high</div>
                  <DeltaChip value={forecastData.current_position.drawdown_from_12m_high_pct == null ? null : -Math.abs(forecastData.current_position.drawdown_from_12m_high_pct)} />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '12px 0 0' }}>{(forecastData.current_position.observed_signals || []).join('  |  ') || forecastData.current_position.interpretation}</p>
            </div>}

            {/* Core Forecast SVG Chart with Uncertainty Band */}
            <div className="content-card" style={{ marginBottom: '24px' }}>
              {(() => {
                const points = forecastData?.forecast_series || [];
                const latest = (forecastData?.recent_history || historyData?.history || []).at(-1);
                const end = [...points].reverse().find(point => point.in_requested_range) || points.at(-1);
                if (!latest || !end) return null;
                const startValue = Number(latest.value), endValue = Number(end.forecast_value);
                const change = startValue ? (endValue / startValue - 1) * 100 : null;
                return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                  {[
                    { label: 'Latest observed', value: startValue, date: latest.date, color: 'var(--accent)', decimals: 2 },
                    { label: 'Projected at range end', value: endValue, date: end.date_label || end.date, color: 'var(--teal)', decimals: 2 },
                    { label: 'Projected change', delta: change, note: 'from latest observation', color: change >= 0 ? 'var(--pos)' : 'var(--neg)' },
                    { label: 'End-range interval', low: end.band_low, high: end.band_high, color: 'var(--text-muted)' }
                  ].map(tile => <div key={tile.label} className="stat-tile">
                    <small>{tile.label}</small>
                    <div className="stat-tile-value" style={{ color: tile.color }}>
                      {tile.delta !== undefined
                        ? <><Num value={tile.delta} decimals={2} signed suffix="%" /> <DeltaChip value={tile.delta} /></>
                        : tile.low !== undefined
                          ? <><Num value={tile.low} decimals={2} /> <span style={{ opacity: .5 }}>to</span> <Num value={tile.high} decimals={2} /></>
                          : <Num value={tile.value} decimals={tile.decimals} />}
                    </div>
                    {(tile.date || tile.note) && <div className="stat-tile-note">{tile.date || tile.note}</div>}
                  </div>)}
                </div>;
              })()}
              <div className="card-title">
                <span><TrendingUp size={17} style={{ color: 'var(--teal)' }} /> {historyData?.metric_options?.find(option => option.key === historyMetric)?.label || 'Adjusted Close'} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>· {forecastStartMonth || selectedSpan} to {forecastEndMonth || selectedSpan}</span></span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', alignItems: 'center' }}>
                  {forecastLoading && <span className="recomputing-chip"><RefreshCw size={12} /> Recomputing</span>}
                  <span className="legend-chip" style={{ color: 'var(--pos)' }}><i style={{ height: 3, borderRadius: 2, background: 'var(--pos)' }} /> History &amp; forecast</span>
                  <span className="legend-chip" style={{ color: 'var(--text-dim)' }}><i style={{ height: 2, borderTop: '2px dashed var(--text-dim)', background: 'none' }} /> Baseline</span>
                  <span className="legend-chip" style={{ color: 'var(--teal)' }}><i style={{ height: 10, borderRadius: 2, background: 'var(--teal-tint)', border: '1px solid var(--teal)' }} /> Forecast range</span>
                </div>
              </div>

              <div className="chart-container" style={{ height: '340px' }}>
                {(() => {
                  // Data-driven forecast SVG  -  same visual style, real X-axis dates
                  const series = forecastData?.forecast_series || [];
                  if (series.length === 0) {
                    // No forecast data yet  -  show placeholder
                    return (
                      <svg className="chart-svg" viewBox="0 0 900 300">
                        {[60, 120, 180, 240].map(y => (
                          <line key={y} x1="40" y1={y} x2="880" y2={y} stroke="var(--grid-line)" strokeWidth="1" />
                        ))}
                        <text x="450" y="160" textAnchor="middle" fontSize="13" fill="var(--text-muted)">{forecastData ? (forecastData.forecast_explanation?.unavailable_reason || 'Not enough eligible positive observations to forecast this metric.') : 'Loading forecast...'}</text>
                      </svg>
                    );
                  }

                  const histPts = forecastData?.recent_history || historyData?.history?.slice(-6) || [];
                  const SVG_W = 900, SVG_H = 300;
                  const PAD_L = 50, PAD_R = 20, PAD_T = 20, PAD_B = 44;
                  const plotW = SVG_W - PAD_L - PAD_R;
                  const plotH = SVG_H - PAD_T - PAD_B;

                  // Combined time axis: last 6 history points + all forecast points
                  const totalPts = histPts.length + series.length;
                  const histEndRatio = histPts.length / Math.max(1, totalPts - 1);
                  const splitX = PAD_L + histEndRatio * plotW;

                  // Gather all values to find Y scale
                  const histVals = histPts.map(p => p.value);
                  const foreVals = series.map(s => s.forecast_value);
                  const baseVals = series.map(s => s.baseline_value);
                  const bandHighVals = series.map(s => s.band_high ?? s.forecast_value * 1.05);
                  const bandLowVals  = series.map(s => s.band_low  ?? s.forecast_value * 0.95);
                  const allVals = [...histVals, ...foreVals, ...baseVals, ...bandHighVals, ...bandLowVals];
                  const rawMin = Math.min(...allVals), rawMax = Math.max(...allVals);
                  // Same scaling rule as the history chart: padding is relative to
                  // the data, so a small-magnitude metric is not flattened against
                  // the axis by a hard 0.01 floor meant for prices.
                  const foreSpan = rawMax - rawMin;
                  const foreMagnitude = Math.max(Math.abs(rawMax), Math.abs(rawMin));
                  const scalePad = Math.max(foreSpan * 0.12, foreMagnitude * 0.02, Math.abs(rawMax || rawMin || 1) * 0.001, 1e-9);
                  const minV = rawMin - scalePad;
                  const maxV = rawMax + scalePad;

                  const getX = idx => PAD_L + (idx / Math.max(1, totalPts - 1)) * plotW;
                  // Same scaling rule as the history chart: never clamp the
                  // vertical domain to a minimum width of 1.
                  const foreYSpan = Math.max(maxV - minV, 1e-12);
                  const getY = v  => PAD_T + plotH - ((v - minV) / foreYSpan) * plotH;

                  // Build paths
                  const histPath = histPts.reduce((acc, p, i) => {
                    const x = getX(i), y = getY(p.value);
                    if (i === 0) return `M ${x} ${y}`;
                    return `${acc} L ${x} ${y}`;
                  }, '');

                  const foreOffset = histPts.length;
                  const foreStart = histPts.length > 0 ? { x: getX(histPts.length - 1), y: getY(histPts[histPts.length - 1].value) } : { x: splitX, y: getY(foreVals[0]) };
                  const country = String(profile?.identity?.main_country || '').toLowerCase();
                  const festivalMonths = country.includes('india') ? [10, 11] : ((country.includes('china') || country.includes('hong kong') || country.includes('taiwan')) ? [1, 2] : [11, 12]);
                  const festivalLabel = country.includes('india') ? 'Regional festive season' : festivalMonths[0] === 1 ? 'Lunar New Year season' : 'Holiday season';

                  const basePath = series.reduce((acc, s, i) => {
                    const x = getX(foreOffset + i), y = getY(s.baseline_value);
                    return i === 0 ? `M ${foreStart.x} ${foreStart.y} L ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '');

                  const whatIfStroke = summary.direction === 'fall' ? 'var(--neg)' : 'var(--pos)';
                  const historicalStroke = summary.direction === 'fall' ? 'var(--neg)' : 'var(--pos)';
                  const whatIfPath = series.reduce((acc, s, i) => {
                    const x = getX(foreOffset + i), y = getY(s.forecast_value);
                    return i === 0 ? `M ${foreStart.x} ${foreStart.y} L ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '');
                  const trendPoints = [...histPts.map((point, i) => ({ x: getX(i), y: getY(point.value) })), ...series.map((point, i) => ({ x: getX(foreOffset + i), y: getY(point.forecast_value) }))];
                  const trendPath = trendPoints.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
                  const trendAreaPath = trendPoints.length ? `${trendPath} L ${trendPoints.at(-1).x} ${PAD_T + plotH} L ${trendPoints[0].x} ${PAD_T + plotH} Z` : '';

                  // Uncertainty band polygon
                  const topBand = series.map((s, i) => `${getX(foreOffset + i)},${getY(s.band_high ?? s.forecast_value * 1.05)}`).join(' ');
                  const botBand = [...series].reverse().map((s, i) => {
                    const ri = series.length - 1 - i;
                    return `${getX(foreOffset + ri)},${getY(s.band_low ?? s.forecast_value * 0.95)}`;
                  }).join(' ');
                  const bandPoly = `${foreStart.x},${foreStart.y} ${topBand} ${botBand}`;

                  // X-axis labels: history dates + forecast date_labels
                  const allLabels = [
                    ...histPts.map(p => {
                      try {
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const [yr, mo] = p.date.split('-');
                        return `${months[parseInt(mo,10)-1]} ${yr}`;
                      } catch { return p.date; }
                    }),
                    ...series.map(s => s.date_label)
                  ];
                  const tickEvery = Math.max(1, Math.ceil((totalPts - 1) / 6));
                  const formatAxisValue = value => axisNumber(value, maxV - minV);

                  return (
                    <svg className="chart-svg" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Company history and forecast chart" onMouseMove={event => { const rect = event.currentTarget.getBoundingClientRect(); const svgX = ((event.clientX - rect.left) / rect.width) * SVG_W; const fraction = Math.max(0, Math.min(1, (svgX - PAD_L) / plotW)); setForecastHoverIndex(Math.round(fraction * (totalPts - 1))); }} onMouseLeave={() => setForecastHoverIndex(null)}>
                      <defs>
                        <linearGradient id="forecastAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={historicalStroke} stopOpacity=".18"/><stop offset="100%" stopColor={historicalStroke} stopOpacity="0"/></linearGradient>
                        <linearGradient id="forecastLineGradient" x1={splitX - 400} y1="0" x2={PAD_L + plotW} y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={historicalStroke}/><stop offset="55%" stopColor={historicalStroke}/><stop offset="100%" stopColor={whatIfStroke}/></linearGradient>
                        <filter id="forecastLineGlow" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="3.6" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, gi) => {
                        const y = PAD_T + (1 - ratio) * plotH;
                        const value = minV + ratio * (maxV - minV);
                        return <g key={gi}><line x1={PAD_L} y1={y} x2={PAD_L + plotW} y2={y} stroke="var(--grid-line)" strokeWidth="1" /><text x={PAD_L - 9} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">{formatAxisValue(value)}</text></g>;
                      })}

                      {overlayFestivals && series.map((item, i) => {
                        const month = Number(String(item.date).slice(5, 7));
                        if (!festivalMonths.includes(month)) return null;
                        const step = plotW / Math.max(1, totalPts - 1);
                        return <rect key={`future-festival-${item.date}`} x={Math.max(PAD_L, getX(foreOffset + i) - step / 2)} y={PAD_T} width={step} height={plotH} fill="var(--gold)" fillOpacity=".14"><title>{festivalLabel} calendar context for {item.date}; not a verified company event or causal effect.</title></rect>;
                      })}

                      {/* Forecast Uncertainty Band */}
                      <polygon className="band-fade-in" points={bandPoly} fill="var(--teal)" fillOpacity="0.13"><title>Walk-forward forecast uncertainty interval</title></polygon>

                      {/* Soft area fill, like an investment price chart */}
                      {trendAreaPath && <path d={trendAreaPath} fill="url(#forecastAreaFill)" />}

                      {/* Observed company history */}
                      {histPath && <path d={histPath} fill="none" stroke={historicalStroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#forecastLineGlow)" />}

                      {/* Baseline Dotted Line (Grey var(--grey)) */}
                      <path d={basePath} fill="none" stroke="var(--grey)" strokeWidth="2.5" strokeDasharray="5 5" />

                      {/* What-If Forecast Line */}
                      <path className="restructure-path" d={whatIfPath} fill="none" stroke="url(#forecastLineGradient)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#forecastLineGlow)" />

                      {/* Forecast Start Marker */}
                      <line x1={splitX} y1={PAD_T} x2={splitX} y2={PAD_T + plotH} stroke="var(--text-dim)" strokeWidth="1" strokeDasharray="3 5" />
                      <circle cx={splitX} cy={foreStart.y} r="5" fill="var(--accent)" stroke="var(--dot-ring)" strokeWidth="2" />
                      <text x={Math.min(PAD_L + plotW - 4, splitX + 7)} y={PAD_T + 13} textAnchor="start" fontSize="10" fontWeight="700" fill="var(--text-muted)">
                        {forecastData?.forecast_start_date
                          ? (() => { const [y, m] = (forecastData.forecast_start_date || '').split('-'); const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `Forecast  ${mn[parseInt(m,10)-1] || ''} ${y || ''}`; })()
                          : 'Forecast Start'}
                      </text>

                      {forecastHoverIndex != null && (() => {
                        const index = Math.max(0, Math.min(totalPts - 1, forecastHoverIndex));
                        const isForecastPoint = index >= histPts.length;
                        const seriesPoint = isForecastPoint ? series[index - histPts.length] : null;
                        const historyPoint = !isForecastPoint ? histPts[index] : null;
                        const value = seriesPoint?.forecast_value ?? historyPoint?.value;
                        const x = getX(index), y = getY(value);
                        const dateLabel = seriesPoint?.date_label || seriesPoint?.date || historyPoint?.date || '';
                        const boxX = Math.max(PAD_L + 4, Math.min(PAD_L + plotW - 174, x + 12));
                        const boxY = Math.max(PAD_T + 4, Math.min(PAD_T + plotH - 58, y - 65));
                        return <g pointerEvents="none">
                          <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + plotH} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="3 4" />
                          <circle cx={x} cy={y} r="5" fill={historicalStroke} stroke="var(--dot-ring)" strokeWidth="2" />
                          <rect x={boxX} y={boxY} width="170" height="54" rx="9" fill="var(--tip-bg)" stroke="var(--tip-line)" style={{ filter: 'var(--tip-shadow)' }} pointerEvents="none" />
                          <text x={boxX + 10} y={boxY + 17} fontSize="10" fontWeight="700" fill="var(--tip-text)">{dateLabel}{isForecastPoint ? ' · Forecast' : ' · Observed'}</text>
                          <text x={boxX + 10} y={boxY + 34} fontSize="12" fontWeight="700" fill={historicalStroke}>{formatAxisValue(value)}</text>
                          {seriesPoint && <text x={boxX + 10} y={boxY + 47} fontSize="9" fill="var(--tip-sub)">Range {formatAxisValue(seriesPoint.band_low)} – {formatAxisValue(seriesPoint.band_high)}</text>}
                        </g>;
                      })()}

                      {/* X-Axis Labels */}
                      {allLabels.map((label, i) => {
                        if (i % tickEvery !== 0 && i !== allLabels.length - 1) return null;
                        const x = getX(i);
                        const isFore = i >= histPts.length;
                        return (
                          <g key={i}>
                            <line x1={x} y1={PAD_T + plotH} x2={x} y2={PAD_T + plotH + 4} stroke="var(--line-strong)" strokeWidth="1" />
                            <text
                              x={x}
                              y={PAD_T + plotH + 16}
                              textAnchor="middle"
                              fontSize="10.5"
                              fontWeight={isFore ? '700' : '600'}
                              fill={isFore ? 'var(--teal)' : 'var(--text-muted)'}
                            >
                              {label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  );
                })()}
              </div>
            </div>

            {forecastData?.selected_range_outlook && <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title"><span>Month-by-Month Outlook for the Selected Range</span><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{forecastData.selected_range_outlook.forecast_months_in_range} months</span></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>The selected path ends {forecastData.selected_range_outlook.baseline_to_end_change_pct == null ? 'with insufficient data for a range change estimate' : `${forecastData.selected_range_outlook.baseline_to_end_change_pct >= 0 ? '+' : ''}${forecastData.selected_range_outlook.baseline_to_end_change_pct}% from the first forecast month in this range`}. Historical-residual paths estimate {forecastData.selected_range_outlook.positive_horizon_probability_pct == null ? 'no positive-versus-negative probability (insufficient validation residuals)' : `${forecastData.selected_range_outlook.positive_horizon_probability_pct}% chance of a positive horizon return`}.</p>
              <div style={{ maxHeight: '260px', overflow: 'auto' }}><table className="perm-table"><thead><tr><th>Month</th><th>Baseline</th><th>Selected path</th><th>Scenario delta</th><th>Uncertainty interval</th></tr></thead><tbody>
                {(forecastData.forecast_series || []).filter(point => point.in_requested_range).map(point => <tr key={point.date}>
                  <td>{point.date}</td><td>{Number(point.baseline_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td>{Number(point.forecast_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td>{point.baseline_value ? `${((point.forecast_value / point.baseline_value - 1) * 100).toFixed(2)}%` : 'n/a'}</td>
                  <td>{Number(point.band_low).toLocaleString(undefined, { maximumFractionDigits: 2 })}  to  {Number(point.band_high).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>)}
              </tbody></table></div>
            </div>}

            {forecastData?.forecast_explanation && (
              <div className="content-card" style={{ marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>Forecast method:</strong> {forecastData.model_version}. Trained on {forecastData.forecast_explanation.training_observations} monthly observations through {forecastData.data_date || 'the latest supplied date'}; selected by walk-forward validation (MAE {forecastData.forecast_explanation.walk_forward_validation_mae_log_return}).
                {activeTogglesCount > 0 && !forecastData.scenario_evidence?.matched && !forecastData.calendar_scenario_evidence?.matched && !forecastData.primitive_scenario_evidence?.matched && !forecastData.rate_shock_evidence?.matched &&
                  <div style={{ color: 'var(--warn)', marginTop: '8px' }}>No sufficiently supported effect was found for the selected scenario. The path remains at baseline. The option is retained so users can inspect the source coverage.</div>}
                {forecastData.scenario_evidence?.matched &&
                  <div style={{ marginTop: '8px' }}>Scenario effect: {forecastData.scenario_evidence.estimated_excess_return_pct}% estimated excess return from {forecastData.scenario_evidence.observations} matching dated records. This is a historical association, not a causal estimate.</div>}
                {Number(rateShockBps) !== 0 && !forecastData.rate_shock_evidence?.matched &&
                  <div style={{ color: 'var(--warn)', marginTop: '8px' }}>This company's walk-forward-selected model did not validate a rate-sensitive ridge model, so the requested rate change was not applied to its price path.</div>}
                {forecastData.rate_shock_evidence?.matched &&
                  <div style={{ marginTop: '8px' }}>The {forecastData.rate_shock_evidence.requested_bps} bps rate change adds an estimated {forecastData.rate_shock_evidence.estimated_first_month_excess_return_pct}% first-month return based on the fitted company-specific rate coefficient.</div>}
                {forecastData.primitive_scenario_evidence?.matched && <div style={{ marginTop: '8px' }}>External primitive shocks were evaluated against company history with a walk-forward-validated macro ridge. The requested deltas are {JSON.stringify(forecastData.primitive_scenario_evidence.requested_deltas)}. This is a fitted association, not a causal effect.</div>}
                {forecastData.calendar_scenario_evidence?.matched && <div style={{ marginTop: '8px' }}>Calendar proxy applied to {forecastData.calendar_scenario_evidence.months.map(month => new Date(2000, month - 1, 1).toLocaleString('en', { month: 'long' })).join(', ')} using observed company month-of-year returns. No festival-specific records were found, so this does not isolate a festival effect.</div>}
              </div>
            )}

            {/* Crash & Peak Timing (Section 7) */}
            {timingData && (
              <div className="grid-2col">
                {[
                  { key: 'crash_timing', title: 'Crash & Downfall Probability', icon: <AlertTriangle size={17} color="var(--neg)" />, tone: 'var(--neg)', gradient: 'var(--grad-neg)', definitionLabel: 'Downside definition' },
                  { key: 'peak_timing', title: 'Peak Expansion Probability', icon: <TrendingUp size={17} color="var(--pos)" />, tone: 'var(--pos)', gradient: 'var(--grad-pos)', definitionLabel: 'Peak estimate' },
                ].map(panel => {
                  const block = timingData[panel.key];
                  if (!block?.bars?.length) return null;
                  const maxProb = Math.max(...block.bars.map(bar => Number(bar.prob_pct) || 0), 1);
                  return (
                    <div key={panel.key} className="content-card">
                      <div className="card-title">
                        <span style={{ color: panel.tone }}>{panel.icon} {panel.title}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>per calendar year</span>
                      </div>
                      <div className="timing-bars">
                        {block.bars.map(b => (
                          <div key={b.year} className="timing-bar">
                            {b.is_most_likely && <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: panel.tone }}>Most likely</span>}
                            <div
                              className="timing-bar-fill"
                              style={{
                                height: `${Math.max(12, (Number(b.prob_pct) / maxProb) * 100)}%`,
                                background: b.is_most_likely ? panel.gradient : 'var(--surface-3)',
                                color: b.is_most_likely ? '#04121F' : 'var(--text-muted)',
                                boxShadow: b.is_most_likely ? `0 12px 28px -14px ${panel.tone}` : 'none',
                              }}
                            >
                              {b.prob_pct}%
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-dim)', fontFamily: 'var(--font-num)' }}>{b.year}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                        <strong>{panel.definitionLabel}:</strong> {block.definition}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* PAGE 5: ASK, EXPLORE, AND DECISIONS */}
        {activeTab === 5 && (
          <div>
            <section className="content-card ask-card" style={{ marginBottom: '20px' }}>
              <div className="card-title"><span><HelpCircle size={17} style={{ color: 'var(--accent)' }} /> Ask the model</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentCompanyName}  |  {historyData?.history?.length ?? 0} monthly observations</span></div>
              <p className="card-lede">Ask about a trend, a month, an event, a company or peer decision, or the scenario you selected. Answers are built only from the supplied history and the same forecast options - nothing is invented.</p>
              <form onSubmit={runCompanyQuestion}>
                <textarea
                  className="ask-input"
                  aria-label="Ask a question about the company"
                  value={analystQuestion}
                  onChange={event => setAnalystQuestion(event.target.value)}
                  placeholder="For example: How has the company trended since 2022, and what does the selected scenario suggest for the next year?"
                  rows={2}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  {['How has this company trended over the last 3 years?', 'What does the selected scenario suggest for the next 12 months?', 'Where did the observed history fall hardest?'].map(sample => (
                    <button key={sample} type="button" className="bubble-btn" onClick={() => setAnalystQuestion(sample)}><Sparkles size={12} /> {sample}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 12 }}>
                  <label className="field-label">Start
                    <input className="field-input" aria-label="Analysis start month" type="month" value={forecastStartMonth} onChange={event => setForecastStartMonth(event.target.value)} />
                  </label>
                  <label className="field-label">End
                    <input className="field-input" aria-label="Analysis end month" type="month" value={forecastEndMonth} onChange={event => setForecastEndMonth(event.target.value)} />
                  </label>
                  <label className="field-label">Series
                    <select className="field-select" aria-label="Analysis metric" value={historyMetric} onChange={event => setHistoryMetric(event.target.value)} style={{ maxWidth: 210 }}>{(historyData?.metric_options || [{ key: 'close', label: 'Adjusted close' }]).map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
                  </label>
                  <div className="span-pill-group">
                    {[6, 12, 24].map(months => <button key={months} type="button" className={`span-pill ${selectedSpan === `${months}M` ? 'active' : ''}`} onClick={() => selectPresetSpan(`${months}M`)}>{months}M</button>)}
                  </div>
                  <button type="submit" className="bubble-btn active" disabled={questionLoading || !historyData?.history?.length}><Activity size={13} /> {questionLoading ? 'Analyzing...' : 'Analyze question'}</button>
                </div>
              </form>
              {questionError && <p role="alert" style={{ color: 'var(--neg)', fontSize: 12, marginTop: 9 }}>{questionError}</p>}
            </section>

            <section className="content-card" style={{ marginBottom: '20px' }}>
              <div className="card-title"><span><Flame size={17} style={{ color: 'var(--orange)' }} /> Choose forecast conditions</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeTogglesCount === 0 ? 'Baseline path' : `${activeTogglesCount} selected`}</span></div>
              <p className="card-lede">The same five umbrellas as the forecast page. Conditions picked here drive the answer above and the peer comparison below, so a scenario set stays consistent across the whole story.</p>
              <ScenarioLab
                catalog={scenarioCatalog}
                toggles={toggles}
                onToggle={toggleSwitch}
                primitives={scenarioPrimitives}
                onPrimitiveChange={(key, value) => setScenarioPrimitives(previous => ({ ...previous, [key]: value }))}
                rateShockBps={rateShockBps}
                onRateShockChange={setRateShockBps}
                userCalendarInputs={userCalendarInputs}
                calendarEventName={calendarEventName}
                onCalendarEventNameChange={setCalendarEventName}
                calendarEventMonth={calendarEventMonth}
                onCalendarEventMonthChange={setCalendarEventMonth}
                onAddCalendar={addCalendarScenario}
                onClearAll={resetAllToggles}
                activeCount={activeTogglesCount}
                busy={forecastLoading}
              />
            </section>

            {questionAnalysis && <section className="content-card" style={{ marginBottom: 20 }}>
              <div className="card-title"><span><CheckCircle2 size={17} style={{ color: 'var(--pos)' }} /> Answer and trend</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{questionAnalysis.mode === 'historical' ? 'Observed history' : questionAnalysis.model}</span></div>
              <p className="answer-line">{questionAnalysis.answer}</p>
              <div className="chart-container" style={{ height: 290, marginTop: 12 }}>
                {(() => {
                  const observed = questionAnalysis.observedPoints.filter(point => Number.isFinite(point.value));
                  const forecast = questionAnalysis.forecastPoints.filter(point => Number.isFinite(point.value));
                  const all = [...observed, ...forecast];
                  if (!all.length) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>No data points in this range.</p>;
                  const values = all.map(point => point.value);
                  const low = Math.min(...values), high = Math.max(...values);
                  const pad = Math.max((high - low) * 0.12, Math.abs(high || low || 1) * 0.02);
                  const min = low - pad, max = high + pad;
                  const x = index => 55 + index / Math.max(1, all.length - 1) * 790;
                  const y = value => 225 - (value - min) / Math.max(0.0001, max - min) * 185;
                  const observedPath = observed.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point.value)}`).join(' ');
                  const offset = Math.max(0, observed.length - 1);
                  const forecastPath = forecast.map((point, index) => `${index ? 'L' : 'M'} ${x(offset + index)} ${y(point.value)}`).join(' ');
                  return <svg className="chart-svg" viewBox="0 0 900 270" role="img" aria-label="Observed and projected values for the selected date range">
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => <g key={index}><line x1="55" y1={225 - ratio * 185} x2="845" y2={225 - ratio * 185} stroke="var(--line)" /><text x="48" y={229 - ratio * 185} textAnchor="end" fontSize="10" fill="var(--text-muted)">{axisNumber(min + ratio * (max - min), max - min)}</text></g>)}
                    {observedPath && <path d={observedPath} fill="none" stroke="var(--accent)" strokeWidth="3" />}{forecastPath && <path d={forecastPath} fill="none" stroke="var(--teal)" strokeWidth="3" strokeDasharray="7 4" />}
                    {all.map((point, index) => index % Math.max(1, Math.ceil(all.length / 8)) === 0 || index === all.length - 1 ? <text key={`${point.date}-${index}`} x={x(index)} y="250" textAnchor="middle" fontSize="9" fill={index >= observed.length ? 'var(--teal)' : 'var(--text-muted)'}>{point.date}</text> : null)}
                  </svg>;
                })()}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}><span style={{ color: 'var(--accent)' }}>Observed</span>{questionAnalysis.forecastPoints.length > 0 && <span style={{ color: 'var(--teal)' }}> Projected under selected conditions</span>}</div>
              {questionAnalysis.evidence?.length > 0 && <div style={{ marginTop: 12, padding: 10, background: 'var(--surface-2)', borderRadius: 8 }}><strong style={{ fontSize: 12 }}>Evidence and model notes</strong>{questionAnalysis.evidence.map((item, index) => <p key={index} style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>{item}</p>)}</div>}
            </section>}
          </div>
        )}

        {/* PAGE 5: COMPETITORS & DECISIONS */}
        {activeTab === 5 && (profile || forecastData || recommendationsData) && (
          <div>
            {/* Peer Comparison Chart (Indexed to 100) */}
            {!nicheComparison && <div className="content-card" style={{ marginBottom: '24px' }}>
              <div className="card-title">
                <span><Users size={17} style={{ color: 'var(--grey)' }} /> Peer co-movement chart</span>
                <span className="recomputing-chip"><RefreshCw size={12} /> still warming</span>
              </div>
              <p className="card-lede" style={{ marginBottom: 0 }}>
                This is the heaviest calculation in the panel - it forecasts every comparable company in the
                niche, so it runs last. Everything else on this page is already loaded, and the chart lands
                here on its own.
              </p>
            </div>}
            {nicheComparison && (
              <div className="content-card" style={{ marginBottom: '24px' }}>
                <div className="card-title">
                  <span>Observed Market Co-Movement Peers & Data-Based Forecast (Index = 100)</span>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontWeight: '600' }}>
                    <span style={{ color: 'var(--accent)' }}> {currentCompanyName} (Focus)</span>
                    <span style={{ color: 'var(--grey)' }}> Peer Cohort (Status Quo)</span>
                  </div>
                </div>
                {nicheComparison.series?.length ? (() => {
                  const series = nicheComparison.series;
                  const values = series.flatMap(item => [...(item.indexed_history || []), ...(item.indexed_forecast || [])]);
                  const min = Math.min(100, ...values) * 0.96;
                  const max = Math.max(100, ...values) * 1.04;
                  const historyCount = series[0].indexed_history?.length || 0;
                  const x = i => 55 + i / Math.max(1, historyCount + (series[0].indexed_forecast?.length || 0) - 1) * 790;
                  const y = v => 190 - ((v - min) / Math.max(0.01, max - min)) * 150;
                  return <>
                    <div className="chart-container" style={{ height: '260px' }}>
                      <svg className="chart-svg" viewBox="0 0 900 220">
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                          const yy = 190 - ratio * 150;
                          return <g key={i}><line x1="55" y1={yy} x2="845" y2={yy} stroke="var(--grid-line)" />
                            <text x="48" y={yy + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{(min + ratio * (max - min)).toFixed(0)}</text></g>;
                        })}
                        {series.map(item => {
                          const historical = item.indexed_history || [];
                          const future = item.indexed_forecast || [];
                          const historyPath = historical.map((v, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(v)}`).join(' ');
                          const futurePath = future.map((v, i) => `${i ? 'L' : 'M'} ${x(historical.length - 1 + i)} ${y(i === 0 ? historical.at(-1) : future[i - 1])} L ${x(historical.length + i)} ${y(v)}`).join(' ');
                          const totalChange = historical.length && future.length ? ((future.at(-1) / historical[0] - 1) * 100) : null;
                          return <g key={item.company_id}>
                            <path d={historyPath} fill="none" stroke={item.color} strokeWidth={item.is_focus ? 3 : 2} />
                            <path d={futurePath} fill="none" stroke={item.color} strokeWidth={item.is_focus ? 2.5 : 1.8} strokeDasharray="5 4" />
                            {totalChange !== null && <text x="850" y={y(future.at(-1)) + 4} fontSize="10" fontWeight="700" fill={item.color}>{totalChange >= 0 ? '+' : ''}{totalChange.toFixed(1)}%</text>}
                          </g>;
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', marginTop: '6px' }}>
                      {series.map(item => <span key={item.company_id} style={{ color: item.color, fontWeight: 700 }}>{item.company_name}{item.is_focus ? '  |  Focus' : ''}  |  {item.forecast_model || 'forecast unavailable'}</span>)}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: 0 }}>{nicheComparison.peer_selection} {nicheComparison.message}</p>
                    {nicheComparison.scenario_terms?.length > 0 && !series.some(s => s.scenario_effect?.matched) &&
                      <p style={{ color: 'var(--warn)', fontSize: '12px', marginBottom: 0 }}>No matching dated event or decision records were found for this scenario in these companies. Their forecast lines remain baseline.</p>}
                  </>;
                })() : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No peer history is available in the supplied files for comparison.</p>}
              </div>
            )}

            {/* Section 12.6 Recommendations (3 Tiers) */}
            {recommendationsData ? (
            <div className="content-card">
              <div className="card-title">
                <span>Historical Decision Evidence & Action Review</span>
                <span className="provenance-tag">Observed outcomes after dated decisions</span>
              </div>

              {recommendationsData.recommendations?.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{recommendationsData.evidence_note} No recommendation is shown until the file contains enough distinct, dated decisions with measurable follow-up outcomes.</p>}

              {recommendationsData.standing_state_labels?.length > 0 && (
                <div className="standing-note">
                  <Info size={15} />
                  <div>
                    <strong>{recommendationsData.standing_state_labels.length} decision field{recommendationsData.standing_state_labels.length === 1 ? '' : 's'} in this file are written on almost every month.</strong>
                    {' '}That describes standing strategy, not a discrete event, so its measured outcome is indistinguishable from the company's own average move. Crestfall reports them here instead of turning them into recommendations:
                    {' '}{recommendationsData.standing_state_labels.slice(0, 6).map(item => `${item.decision} (${item.coverage_pct}% of months)`).join('; ')}
                    {recommendationsData.standing_state_labels.length > 6 ? `; +${recommendationsData.standing_state_labels.length - 6} more` : ''}
                  </div>
                </div>
              )}

              {(recommendationsData.recommendations || []).map((rec, idx) => (
                <div 
                  key={idx} 
                  className={`rec-card ${
                    ['Likely to help', 'Historically positive association'].includes(rec.tier) ? 'rec-tier-help' :
                    ['Likely to hurt', 'Historically negative association'].includes(rec.tier) ? 'rec-tier-hurt' : 'rec-tier-uncertain'
                  }`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        background: ['Likely to help', 'Historically positive association'].includes(rec.tier) ? 'var(--pos-tint)' : ['Likely to hurt', 'Historically negative association'].includes(rec.tier) ? 'var(--neg-tint)' : 'var(--surface-2)',
                        color: rec.tier_color,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {rec.tier}
                      </span>
                      <strong style={{ fontSize: '15px', color: 'var(--text-strong)' }}>{rec.decision}</strong>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '700', color: rec.tier_color }}>
                      Impact Range: {rec.estimated_growth_range}
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{rec.description}</p>

                  {/* The numbers that make this card different from its siblings. */}
                  <div className="evidence-strip">
                    {rec.months_coverage_pct != null && <span>in file <strong>{rec.months_coverage_pct}%</strong> of months</span>}
                    {rec.above_average_share != null && <span>beat own average <strong>{rec.above_average_share}%</strong></span>}
                    {rec.company_ordinary_3m_pct != null && <span>company's ordinary 3-month move <strong>{rec.company_ordinary_3m_pct >= 0 ? '+' : ''}{rec.company_ordinary_3m_pct}%</strong></span>}
                    {rec.matched_cases_count != null && <span><strong>{rec.matched_cases_count}</strong> dated episodes</span>}
                  </div>
                  {rec.effect_meaning && <p className="effect-meaning"><Info size={12} /> {rec.effect_meaning}</p>}
                  {rec.environment_context && <p style={{ fontSize: '12.5px', color: 'var(--text-body)', margin: '0 0 10px', paddingLeft: '10px', borderLeft: '2px solid var(--line-strong)' }}>{rec.environment_context}</p>}
                  {rec.implementation && <div style={{ fontSize: '12px', color: 'var(--text-strong)', marginBottom: '10px' }}><strong>How to implement responsibly:</strong> {rec.implementation}{rec.implementation_steps?.length > 0 && <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>{rec.implementation_steps.map((step, stepIdx) => <li key={stepIdx} style={{ margin: '3px 0' }}>{step}</li>)}</ol>}</div>}

                  {(rec.good_practices?.length > 0 || rec.bad_practices?.length > 0) && (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {rec.good_practices?.length > 0 && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div style={{ fontWeight: '600', color: '#22C55E', marginBottom: '6px', fontSize: '12px' }}>
                            ✓ Recommended practices
                          </div>
                          {rec.good_practices.map((practice, i) => (
                            <div key={i} style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0' }}>• {practice}</div>
                          ))}
                        </div>
                      )}
                      {rec.bad_practices?.length > 0 && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <div style={{ fontWeight: '600', color: '#EF4444', marginBottom: '6px', fontSize: '12px' }}>
                            ✗ Practices to avoid
                          </div>
                          {rec.bad_practices.map((practice, i) => (
                            <div key={i} style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '3px 0' }}>• {practice}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginTop: '12px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-strong)', marginBottom: '4px' }}>
                      Dated company episodes ({rec.matched_cases_count}):
                    </div>
                    {rec.evidence_list.map((ev, i) => (
                      <div key={i} style={{ color: 'var(--text-muted)', margin: '2px 0' }}>-  {ev}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Status Quo "Do Nothing" Card */}
              <div style={{ padding: '16px 20px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--line)', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{recommendationsData.do_nothing_path?.title || 'Do-nothing path'}</strong>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {recommendationsData.do_nothing_path?.estimated_growth == null ? 'Forecast unavailable' : `12-month market-price change: ${recommendationsData.do_nothing_path.estimated_growth >= 0 ? '+' : ''}${recommendationsData.do_nothing_path.estimated_growth}%`}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {recommendationsData.do_nothing_path?.description || 'No do-nothing comparison was returned for this company.'}
                </div>
              </div>
            </div>
            ) : (
              <div className="content-card" style={{ marginBottom: '24px' }}>
                <div className="card-title">
                  <span>Historical Decision Evidence & Action Review</span>
                  <span className="recomputing-chip"><RefreshCw size={12} /> still warming</span>
                </div>
                <p className="card-lede" style={{ marginBottom: 0 }}>
                  The second-heaviest call on this page: it re-forecasts the do-nothing path and scores every dated
                  decision in the file against its follow-up prices. The peer chart above and the steps below are
                  already usable while it runs.
                </p>
              </div>
            )}

            {/* Small action list: what to actually do next, from this company's numbers */}
            <div className="content-card" style={{ marginTop: '24px' }}>
              <div className="card-title">
                <span>Recommended next steps</span>
                <span className="provenance-tag">Read from this company's path, timing and dated decisions</span>
              </div>
              <ol className="reco-steps">
                {nextSteps.map((step, index) => (
                  <li key={index} className={`reco-step reco-step-${step.tone}`}>
                    <span>{step.text}</span>
                    {step.toggle && (
                      <button
                        type="button"
                        className={`bubble-btn ${toggles[step.toggle] ? 'active' : ''}`}
                        onClick={() => toggleSwitch(step.toggle)}
                      >
                        {toggles[step.toggle] ? 'Applied - engine is recomputing' : 'Test it in the forecast'}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              <p className="reco-steps-note">
                Anything marked measured comes from the dated records in the files you supplied. Anything marked general
                playbook is unnamed sector practice - a hypothesis to test, not a result from your data, and not financial
                advice. Every number moves with the horizon and the conditions you select.
              </p>
            </div>

            {/* Unnamed peer cohort: the general sector playbook.
                This is what lets an institute, a studio or a single hospital use the
                panel at all: no competitor file is required and no company is named. */}
            {recommendationsData?.general_playbook && (() => {
              const book = recommendationsData.general_playbook;
              const buckets = { prioritise: [], consider: [], caution: [], hold: [], backlog: [] };
              (book.moves || []).forEach(move => { (buckets[move.verdict] = buckets[move.verdict] || []).push(move); });
              const shown = [...buckets.prioritise, ...buckets.consider].slice(0, 8);
              const holdOff = [...buckets.caution, ...buckets.hold];
              return (
                <div className="content-card" style={{ marginTop: '24px' }}>
                  <div className="card-title">
                    <span><Layers size={17} style={{ color: 'var(--pink)' }} /> Peer playbook - what organisations like this one publicly do</span>
                    <span className="provenance-tag">{book.sector.label} · no competitor file needed</span>
                  </div>
                  <p className="card-lede">{book.sector.shape}</p>
                  <p className="playbook-policy"><Info size={13} /> {book.naming_policy}</p>

                  <div className="playbook-grid">
                    {shown.map(move => (
                      <article key={move.id} className={`playbook-card playbook-${move.verdict}`}>
                        <header className="playbook-head">
                          <span>{move.family_label}</span>
                          <span className={`playbook-verdict verdict-${move.verdict}`}>{move.verdict}</span>
                        </header>
                        <h4>{move.name}</h4>
                        <p className="playbook-what">{move.what}</p>
                        <div className="playbook-band">
                          <span>reference band</span>
                          <strong>{move.reference_band_pct[0]}% to +{move.reference_band_pct[1]}%</strong>
                          <em>{move.band_meaning}</em>
                        </div>
                        <p className="playbook-why">{move.why}</p>
                        <details className="playbook-check">
                          <summary>How to test it here</summary>
                          <ol>{(move.check || []).map((step, i) => <li key={i}>{step}</li>)}</ol>
                        </details>
                        <p className="playbook-risk"><ShieldAlert size={13} /> {move.risk}</p>
                        <p className="playbook-provenance">{move.provenance}</p>
                      </article>
                    ))}
                  </div>

                  {holdOff.length > 0 && (
                    <p className="playbook-hold"><ShieldAlert size={14} /> <strong>Usually hold off on:</strong> {holdOff.slice(0, 4).map(move => move.name).join(', ')}.</p>
                  )}

                  <ul className="playbook-env">
                    {(recommendationsData.action_plan?.environment_checks || []).map((line, i) => <li key={i}>{line}</li>)}
                  </ul>

                  <p className="reco-steps-note">
                    {book.provenance} Bands are directional priors from publicly reported strategy patterns, fitted to no
                    file - yours or anyone else's. When your own dated decisions exist they are shown above, measured, and
                    they take precedence.
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 4. Section 10 Disclaimer Footer */}
      <div className="window-footer">
        <div className="disclaimer-text">
          Disclaimer: Forecasts are estimates from past data and the conditions you select. They are not financial advice. 
          Peer selection reflects historical return co-movement and does not verify direct competition. Scenario paths change only when matching dated records exist; otherwise forecasts remain the baseline.
        </div>
        <div className="provenance-tag">
          Crestfall | Source date: {historyData?.data_quality?.last_observation || profile?.provenance?.data_date || 'unavailable'}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   App
   Three beats, in this order:
     gate     - choose a company from the panel, or import a CSV
     loading  - the dashboard mounts and fetches everything at once while the
                intro transition counts up from real completion, then the pill
                expands to black and lifts away
     app      - every tab is already warm
   ========================================================================== */
export default function App() {
  const [launch, setLaunch] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [warm, setWarm] = useState({ progress: 0, task: 'connecting to the engine', ready: false });

  const startAnalysis = (payload, list) => {
    if (list?.length) setCompanies(list);
    setLaunch(payload);
    setWarm({ progress: 0, task: 'connecting to the engine', ready: false });
    setRevealed(false);
    setShowIntro(true);
  };

  // Safety valve: if a single endpoint ever fails, the pill must not sit there
  // waiting for a 100% that cannot arrive. Reduced to 10s for faster failover.
  useEffect(() => {
    if (!showIntro || warm.ready) return undefined;
    const timer = setTimeout(() => setWarm(current => (current.ready ? current : { ...current, ready: true, task: 'continuing with the data that loaded' })), 10000);
    return () => clearTimeout(timer);
  }, [showIntro, warm.ready]);

  // The dashboard begins fading in on the exact frame the cover begins fading
  // out, so there is never a blank page between the two.
  const handleReveal = useCallback(() => setRevealed(true), []);
  const transitionFinished = useCallback(() => setShowIntro(false), []);
  const backToGate = useCallback(() => { setShowIntro(false); setRevealed(false); setLaunch(null); }, []);

  if (!launch) {
    return <WelcomeGate apiBase={API_BASE} initialCompanyId="AAPL" onLaunch={startAnalysis} seededCompanies={companies} />;
  }

  return (
    <>
      <div className={`app-shell ${revealed ? 'revealed' : ''}`}>
        <ErrorBoundary>
          <Dashboard launch={launch} onProgress={setWarm} onChangeCompany={backToGate} seededCompanies={companies} />
        </ErrorBoundary>
      </div>
      {showIntro && (
        <IntroTransition
          companyName={launch.companyName}
          ticker={launch.ticker}
          progress={warm.progress}
          task={warm.task}
          ready={warm.ready}
          onReveal={handleReveal}
          onFinished={transitionFinished}
        />
      )}
    </>
  );
}
