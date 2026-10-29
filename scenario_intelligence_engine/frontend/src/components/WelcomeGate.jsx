import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Upload, ArrowRight, Database, FileSpreadsheet, Sparkles,
  CheckCircle2, AlertTriangle, Download,
} from 'lucide-react';

/* ===========================================================================
   WelcomeGate
   The screen before the dashboard: pick a company from the loaded dataset,
   or import your own CSV. Whatever you choose here is what the intro
   transition writes behind the loader pill, and pressing Enter arms the
   engine so every tab is warm before the dashboard appears.
   =========================================================================== */

const TEMPLATE = 'date,close,revenue_usd_m,gross_margin_pct,units_sold,event_name,event_category,decision_type,short_description\n2024-01-31,100,1200,42,5000,,,,\n2024-02-29,104,1250,43,5300,,,,\n';

// Uploaded companies arrive with their filename as the ticker
// ("ANTHROPIC_ROCAST_DATASET"). Trim the noise so the cards stay readable.
const cleanTicker = value => String(value || '').replace(/[_ ]?rocast.*$/i, '').replace(/[_ ]?dataset.*$/i, '').trim();

export default function WelcomeGate({ apiBase, onLaunch, initialCompanyId, seededCompanies }) {
  // Seed from the list the shell already has, so returning here never paints an
  // empty "0 of 0" picker for a frame.
  const [companies, setCompanies] = useState(seededCompanies || []);
  const [status, setStatus] = useState(seededCompanies?.length ? 'ready' : 'loading');
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState(
    (seededCompanies || []).find(item => item.company_id === initialCompanyId) || (seededCompanies || [])[0] || null,
  );
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    // Returning from the dashboard must not stall on a fresh /companies call
    // while the engine is still busy with the previous company's forecast.
    if (seededCompanies?.length) {
      setCompanies(seededCompanies);
      setStatus('ready');
      setChosen(previous => previous || seededCompanies.find(item => item.company_id === initialCompanyId) || seededCompanies[0] || null);
      return undefined;
    }
    let cancelled = false;
    fetch(`${apiBase}/companies`)
      .then(response => response.json())
      .then(data => {
        if (cancelled) return;
        setCompanies(data);
        setStatus('ready');
        setChosen(previous => previous || data.find(item => item.company_id === initialCompanyId) || data[0] || null);
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [apiBase, initialCompanyId, seededCompanies]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return companies;
    return companies.filter(item => `${item.company_name} ${item.ticker} ${item.niche} ${item.main_country}`.toLowerCase().includes(needle));
  }, [companies, query]);

  const launch = (company, importResult) => {
    const target = company || chosen;
    if (!target) return;
    onLaunch({
      companyId: target.company_id,
      companyName: target.company_name || target.ticker,
      ticker: cleanTicker(target.ticker) || target.ticker,
      defaultMetric: importResult?.default_metric || target.default_metric || 'close',
      cleaningReport: importResult?.cleaning_report || null,
    }, companies);
  };

  const importCsv = async (file) => {
    if (!file) return;
    // CSV only, enforced here as well as on the server: the engine parses rows
    // as delimited text, so a workbook or JSON export would produce a confusing
    // "no date column" error instead of a clear refusal.
    if (/\.(xlsx|xls|parquet|json|txt|tsv|zip|numbers|ods)$/i.test(file.name)) {
      setImportMessage(`${file.name.split('.').pop().toUpperCase()} is not supported. Crestfall takes .csv files only - export this one as CSV first.`);
      return;
    }
    if (!/\.csv$/i.test(file.name)) {
      setImportMessage('Crestfall takes .csv files only. Add a plain CSV export of the dataset.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) { setImportMessage('That file is larger than 50 MB. Trim it and try again.'); return; }
    setImporting(true);
    setImportMessage('Reading the CSV and building the monthly series...');
    try {
      const csvText = await file.text();
      const response = await fetch(`${apiBase}/companies/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim(), csv_text: csvText }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'The CSV could not be imported.');
      setImportMessage('');
      // Hand the fresh company straight to the transition - the engine warms
      // it exactly like a company that was already in the dataset.
      launch({ company_id: result.company_id, company_name: result.company_name, ticker: result.company_id, default_metric: result.default_metric }, result);
    } catch (error) {
      setImportMessage(error.message || 'Import failed. Check the CSV format and try again.');
    } finally {
      setImporting(false);
    }
  };

  // Enter launches from anywhere on the screen.
  useEffect(() => {
    const onKey = event => {
      if (event.key !== 'Enter') return;
      if (importing || !chosen) return;
      event.preventDefault();
      launch(chosen);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="gate">
      <div className="gate-brand">
        <span className="brand-mark">C</span>
        <span className="brand-name">Crestfall</span>
        <span className="gate-brand-tag">rise &amp; fall, read from the record</span>
      </div>

      <div className="gate-grid">
        {/* ------------------------------------------------ left: the pitch */}
        <section className="gate-intro">
          <p className="gate-eyebrow"><Sparkles size={13} /> Step 1 of 2 &middot; choose a dataset</p>
          <h1 className="gate-headline">
            Every company leaves a record.<br />
            <span className="gate-headline-accent">We read where it goes next.</span>
          </h1>
          <p className="gate-lede">
            Pick one of the {companies.length || 49} companies already in the panel, or drop in your own CSV.
            Crestfall rebuilds the monthly series, finds the phase, times the most-likely peak and the crash window,
            and pre-computes all five workspaces before the dashboard opens - so nothing spins while you present.
          </p>

          <div className="gate-steps">
            {[
              { icon: Database, title: '49-company panel', copy: 'Dated prices, revenue, margins, events and decisions, already loaded on the engine.' },
              { icon: FileSpreadsheet, title: 'Your own CSV', copy: 'A date column plus two numeric series is enough. Cleaning happens on import.' },
            ].map(step => (
              <div key={step.title} className="gate-step">
                <span className="gate-step-icon"><step.icon size={16} /></span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.copy}</p>
                </div>
              </div>
            ))}
          </div>

          {status === 'error' && (
            <p className="gate-error"><AlertTriangle size={14} /> The engine at <code>{apiBase}</code> is not answering. Start it with <code>python main.py</code>, then reload this page.</p>
          )}
        </section>

        {/* ------------------------------------- right: the dataset picker */}
        <section className="gate-picker">
          <div className="gate-picker-head">
            <div className="gate-selected">
              <span className="gate-selected-label">Loaded into the transition</span>
              <strong className="gate-selected-name">{chosen ? chosen.company_name : 'Nothing selected yet'}</strong>
              <span className="gate-selected-meta">
                {chosen ? `${cleanTicker(chosen.ticker) || chosen.ticker}  ·  ${chosen.niche || 'niche not stated'}  ·  ${chosen.main_country || 'country not stated'}` : 'search the list below'}
              </span>
            </div>
            <button
              type="button"
              className="gate-launch"
              onClick={() => launch(chosen)}
              disabled={!chosen || importing || status !== 'ready'}
            >
              {importing ? 'Importing...' : 'Open the analysis'}
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="gate-search">
            <Search size={14} />
            <input
              className="gate-search-input"
              autoFocus
              placeholder="Search company, ticker, niche or country"
              value={query}
              onChange={event => setQuery(event.target.value)}
              aria-label="Search the dataset"
            />
            <span className="gate-count">{visible.length} of {companies.length}</span>
          </div>

          <div className="gate-companies" ref={gridRef} role="listbox" aria-label="Companies in the dataset">
            {status === 'loading' && Array.from({ length: 12 }, (_, index) => <div key={index} className="skeleton gate-company-skeleton" />)}
            {status === 'ready' && visible.length === 0 && <p className="gate-empty">No company in the panel matches “{query}”. Import your own CSV instead.</p>}
            {visible.map(company => {
              const active = chosen?.company_id === company.company_id;
              return (
                <button
                  key={company.company_id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`gate-company ${active ? 'active' : ''}`}
                  onClick={() => { setChosen(company); setImportOpen(false); }}
                  onDoubleClick={() => launch(company)}
                >
                  <span className="gate-company-ticker">{cleanTicker(company.ticker) || company.ticker}</span>
                  <span className="gate-company-body">
                    <strong>{company.company_name}</strong>
                    <small>{company.niche || 'unspecified niche'}</small>
                  </span>
                  {active && <CheckCircle2 size={16} className="gate-company-check" />}
                </button>
              );
            })}
          </div>

          <div className="gate-import">
            <button type="button" className="gate-import-toggle" onClick={() => setImportOpen(value => !value)}>
              <Upload size={14} /> {importOpen ? 'Hide the import panel' : 'Import your own CSV instead'}
            </button>
            {importOpen && (
              <div
                className={`gate-drop ${dragOver ? 'over' : ''}`}
                onDragOver={event => { event.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={event => { event.preventDefault(); setDragOver(false); importCsv(event.dataTransfer.files?.[0] || null); }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Company data CSV"
                  onChange={event => { const file = event.target.files?.[0] || null; setImportFile(file); if (file) importCsv(file); }}
                />
                <div className="gate-drop-copy">
                  <strong>{importFile ? importFile.name : 'Drop a CSV here, or choose a file'}</strong>
                  <small>Date column plus two numeric series is enough. Up to 50 MB. Importing launches the same transition.</small>
                </div>
                <button type="button" className="bubble-btn" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? 'Importing...' : 'Choose file'}
                </button>
                <a className="gate-template" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="crestfall_company_template.csv">
                  <Download size={13} /> template
                </a>
              </div>
            )}
            {importMessage && <p className="gate-import-message" role="status">{importMessage}</p>}
          </div>

          <p className="gate-hint"><kbd>Enter</kbd> launches {chosen ? <b>{chosen.company_name}</b> : 'the selected company'} · everything is pre-computed behind the loader</p>
        </section>
      </div>
    </div>
  );
}
