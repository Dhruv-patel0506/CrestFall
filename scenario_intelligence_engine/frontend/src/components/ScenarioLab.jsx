import React, { useMemo, useState } from 'react';
import {
  Globe, Building2, Users, CalendarDays, SlidersHorizontal, Search, Check, X,
  Sparkles, Trash2, ChevronDown, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

/* ===========================================================================
   ScenarioLab
   Replaces endless checkbox lists with five umbrella categories.
   Pick a category tile  ->  only that family of options opens up,
   searchable, sorted by evidence strength, paginated, with a live
   "selected conditions" rail so nothing is hidden behind a scrollbar.
   =========================================================================== */

const PAGE_SIZE = 18;

const categoryTheme = {
  events:   { accent: 'var(--violet)', gradient: 'linear-gradient(120deg,#A78BFA,#5EA2FF)', glow: 'var(--violet-tint)' },
  own:      { accent: 'var(--accent)', gradient: 'var(--grad-brand)',                        glow: 'var(--accent-tint)' },
  peers:    { accent: 'var(--pink)',   gradient: 'linear-gradient(120deg,#FF6BC7,#FF9F5A)',  glow: 'var(--pink-tint)' },
  calendar: { accent: 'var(--gold)',   gradient: 'linear-gradient(120deg,#FFD461,#FF9F5A)',  glow: 'var(--gold-tint)' },
  shocks:   { accent: 'var(--teal)',   gradient: 'linear-gradient(120deg,#2DE1C2,#34E39A)',  glow: 'var(--teal-tint)' },
};

const signed = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

export default function ScenarioLab({
  catalog,
  toggles = {},
  onToggle,
  primitives = {},
  onPrimitiveChange,
  rateShockBps = 0,
  onRateShockChange,
  userCalendarInputs = [],
  calendarEventName,
  onCalendarEventNameChange,
  calendarEventMonth,
  onCalendarEventMonthChange,
  onAddCalendar,
  onClearAll,
  activeCount = 0,
  busy = false,
}) {
  const [openCategory, setOpenCategory] = useState('events');
  const [searchByCategory, setSearchByCategory] = useState({});
  const [sortBy, setSortBy] = useState('impact');
  const [visible, setVisible] = useState({});

  const normalize = (item, kind, keyOverride, displayOverride) => ({
    key: keyOverride ?? item.label,
    label: displayOverride ?? item.label,
    search: `${item.label} ${item.category || ''} ${item.description || ''}`.toLowerCase(),
    category: item.category || '',
    description: item.description || '',
    observations: item.observations ?? 0,
    companies: item.companies?.length ?? 1,
    effect: item.estimated_effect_pct ?? null,
    kind,
  });

  const categories = useMemo(() => {
    if (!catalog) return [];
    const events = (catalog.events || []).map(item => normalize(item, 'event'));
    const own = (catalog.company_decisions || []).map(item => normalize(item, 'own_decision'));
    const peers = (catalog.peer_decisions || []).map(item => normalize(item, 'peer_decision'));
    const calendar = [
      ...(catalog.calendar_months || []).map(item => normalize(
        item,
        'calendar',
        `Calendar month: ${item.label}`,
        `${item.label}  ·  calendar proxy`,
      )),
      ...userCalendarInputs.map(item => normalize(item, 'custom_calendar', item.label, `${item.label}  ·  your entry`)),
    ];
    const shocks = (catalog.external_conditions || []).map(item => ({
      key: item.key, label: item.label, source: item.source_column,
    }));
    return [
      { id: 'events', title: 'Major World Events', blurb: 'Dated global shocks and market events seen across the company panel.', icon: Globe, options: events, hint: 'Each option carries its own dated evidence.' },
      { id: 'own', title: 'Our Strategic Decisions', blurb: 'Announcements and actions this company already took.', icon: Building2, options: own, hint: 'Evidence comes from this company file.' },
      { id: 'peers', title: 'Peer & Competitor Moves', blurb: 'Decisions observed at similar companies in the same niche or country.', icon: Users, options: peers, hint: 'Use to ask what a rival move would do.' },
      { id: 'calendar', title: 'Seasonality & Festive Windows', blurb: 'Calendar-month effects measured from this company, plus your own festival entry.', icon: CalendarDays, options: calendar, hint: 'Month proxies, not festival-causal estimates.' },
      { id: 'shocks', title: 'Macro & External Shocks', blurb: 'Demand, supply, cost, competition, regulation, technology, macro and health conditions.', icon: SlidersHorizontal, options: [], sliderOptions: shocks, hint: 'Switch a condition on, then set its magnitude.' },
    ];
  }, [catalog, userCalendarInputs]);

  const isActive = key => Boolean(toggles[key]);

  const statsByCategory = useMemo(() => Object.fromEntries(categories.map(category => {
    if (category.id === 'shocks') {
      const on = (category.sliderOptions || []).filter(item => isActive(`primitive:${item.key}`));
      const magnitude = on.reduce((sum, item) => sum + Number(primitives[item.key] ?? 0), 0);
      return [category.id, { total: (category.sliderOptions || []).length, active: on.length, net: magnitude, magnitude: true }];
    }
    const on = category.options.filter(item => isActive(item.key));
    const net = on.reduce((sum, item) => sum + (item.effect ?? 0), 0);
    return [category.id, { total: category.options.length, active: on.length, net }];
  })), [categories, toggles, primitives]);

  const openMeta = categories.find(item => item.id === openCategory);
  const search = searchByCategory[openCategory] || '';

  const visibleOptions = useMemo(() => {
    if (!openMeta || openMeta.id === 'shocks') return [];
    const filtered = openMeta.options.filter(item => item.search.includes(search.trim().toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'cases') return b.observations - a.observations || Math.abs(b.effect ?? 0) - Math.abs(a.effect ?? 0);
      if (sortBy === 'name') return a.label.localeCompare(b.label);
      const gap = Math.abs(b.effect ?? -1) - Math.abs(a.effect ?? -1);
      return gap || b.observations - a.observations;
    });
    const limit = visible[openMeta.id] || PAGE_SIZE;
    return { list: sorted.slice(0, limit), remaining: Math.max(0, sorted.length - limit), total: sorted.length };
  }, [openMeta, search, sortBy, visible]);

  const selectedChips = useMemo(() => {
    const chips = [];
    categories.forEach(category => {
      if (category.id === 'shocks') {
        (category.sliderOptions || []).forEach(item => {
          if (isActive(`primitive:${item.key}`)) {
            chips.push({ key: `primitive:${item.key}`, label: `${item.label} shock ${Number(primitives[item.key] ?? 0).toFixed(2)}`, theme: 'shocks' });
          }
        });
        return;
      }
      category.options.forEach(item => {
        if (isActive(item.key)) {
          chips.push({
            key: item.key,
            label: item.label.replace('  ·  calendar proxy', '').replace('  ·  your entry', ''),
            effect: item.effect,
            theme: category.id,
          });
        }
      });
    });
    if (Number(rateShockBps) !== 0) chips.push({ key: '__rate__', label: `Rate change ${rateShockBps} bps`, theme: 'shocks' });
    return chips;
  }, [categories, toggles, primitives, rateShockBps]);

  const netEffect = selectedChips.reduce((sum, chip) => sum + (chip.effect ?? 0), 0);

  const selectTopImpact = category => {
    const pool = category.options
      .filter(item => item.effect != null && !isActive(item.key))
      .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect))
      .slice(0, 6);
    pool.forEach(item => onToggle(item.key));
  };

  const clearCategory = category => {
    if (category.id === 'shocks') {
      (category.sliderOptions || []).forEach(item => { if (isActive(`primitive:${item.key}`)) onToggle(`primitive:${item.key}`); });
      return;
    }
    category.options.forEach(item => { if (isActive(item.key)) onToggle(item.key); });
  };

  if (!catalog) {
    return (
      <div className="skeleton" style={{ padding: 22, minHeight: 148 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{busy ? 'Preparing scenario evidence from the supplied files...' : 'Scenario options load on demand.'}</div>
      </div>
    );
  }

  return (
    <div className="scenario-lab">
      <div>
        {/* ---------------------------------------------------------------- */}
        {/* Umbrella categories                                             */}
        {/* ---------------------------------------------------------------- */}
        <div className="lab-categories">
          {categories.map(category => {
            const theme = categoryTheme[category.id];
            const stat = statsByCategory[category.id] || { total: 0, active: 0, net: 0 };
            const Icon = category.icon;
            const open = openCategory === category.id;
            const emptyCategory = stat.total === 0;
            return (
              <button
                key={category.id}
                type="button"
                className={`lab-tile ${open ? 'open' : ''} ${emptyCategory ? 'empty' : ''}`}
                onClick={() => !emptyCategory && setOpenCategory(open ? null : category.id)}
                style={{ '--tile-accent': theme.accent, '--tile-accent-soft': theme.glow, '--tile-gradient': theme.gradient, opacity: emptyCategory ? 0.6 : 1, cursor: emptyCategory ? 'not-allowed' : 'pointer' }}
                aria-expanded={open}
                title={emptyCategory ? 'No dated evidence for this family in the supplied files yet' : undefined}
              >
                <div className="lab-tile-top">
                  <span className="lab-tile-icon" style={{ background: theme.gradient }}><Icon size={17} /></span>
                  <span className="lab-tile-count">{stat.total} option{stat.total === 1 ? '' : 's'}</span>
                </div>
                <div className="lab-tile-title">{category.title}</div>
                <div className="lab-tile-desc">{category.blurb}</div>
                <div className="lab-tile-foot">
                  {stat.active > 0 && <span className="lab-tile-on" style={{ background: theme.gradient }}>{stat.active} ON</span>}
                  {stat.active > 0 && !stat.magnitude && (
                    <span className="lab-tile-impact" style={{ color: stat.net >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                      net {signed(stat.net)}
                    </span>
                  )}
                  {stat.active > 0 && stat.magnitude && (
                    <span className="lab-tile-impact" style={{ color: stat.net >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                      net delta {stat.net.toFixed(2)}
                    </span>
                  )}
                  <span className="lab-tile-impact">{emptyCategory ? 'no dated evidence' : open ? 'click to close' : 'click to open'}</span>
                  {!emptyCategory && <ChevronDown size={14} style={{ color: 'var(--text-dim)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease', marginLeft: 'auto' }} />}
                </div>
              </button>
            );
          })}
        </div>

        {statsByCategory.own?.total === 0 && (
          <p className="lab-note">
            <Info size={12} />
            <span><b>Our Strategic Decisions</b> is empty for this company. Its file writes the same generic decision wording on every row, so there are no distinct dated decisions to group. A condition appears here only when at least two distinguishable dated cases exist - nothing is invented. Companies whose files carry real decision text do populate this umbrella.</span>
          </p>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Drill-down panel for the opened category                         */}
        {/* ---------------------------------------------------------------- */}
        {openMeta && (
          <section
            className="lab-panel"
            style={{ '--tile-accent': categoryTheme[openMeta.id].accent, '--tile-accent-soft': categoryTheme[openMeta.id].glow }}
          >
            <div className="lab-panel-head">
              <div className="lab-panel-title">
                <span className="lab-tile-icon" style={{ background: categoryTheme[openMeta.id].gradient, width: 28, height: 28, borderRadius: 9 }}>
                  {React.createElement(openMeta.icon, { size: 15 })}
                </span>
                <div>
                  <div>{openMeta.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 500 }}>{openMeta.hint}</div>
                </div>
              </div>

              {openMeta.id !== 'shocks' && (
                <div className="lab-panel-tools">
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 9, top: 9, color: 'var(--text-dim)' }} />
                    <input
                      className="field-input"
                      style={{ paddingLeft: 28, minWidth: 190 }}
                      placeholder="Search this family"
                      value={search}
                      onChange={event => setSearchByCategory(previous => ({ ...previous, [openMeta.id]: event.target.value }))}
                      aria-label={`Search ${openMeta.title}`}
                    />
                  </div>
                  <select className="field-select" value={sortBy} onChange={event => setSortBy(event.target.value)} aria-label="Sort scenario options">
                    <option value="impact">Sort: strongest evidence</option>
                    <option value="cases">Sort: most dated cases</option>
                    <option value="name">Sort: A to Z</option>
                  </select>
                  <button type="button" className="bubble-btn" onClick={() => selectTopImpact(openMeta)}><Sparkles size={13} /> Auto-pick top 6</button>
                  {statsByCategory[openMeta.id]?.active > 0 && (
                    <button type="button" className="bubble-btn" onClick={() => clearCategory(openMeta)}><Trash2 size={13} /> Clear</button>
                  )}
                </div>
              )}
            </div>

            {/* Seasonality  ->  custom festival entry */}
            {openMeta.id === 'calendar' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12, padding: 12, border: '1px dashed var(--line-strong)', borderRadius: 12 }}>
                <input
                  className="field-input"
                  style={{ minWidth: 220, flex: '1 1 220px' }}
                  placeholder="Name a festival or sale window, e.g. Diwali"
                  value={calendarEventName}
                  onChange={event => onCalendarEventNameChange(event.target.value)}
                  aria-label="Festival or event name"
                />
                <select className="field-select" value={calendarEventMonth} onChange={event => onCalendarEventMonthChange(event.target.value)} aria-label="Festival month">
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>{new Date(2000, index, 1).toLocaleString('en', { month: 'long' })}</option>
                  ))}
                </select>
                <button type="button" className="span-pill active" onClick={onAddCalendar}>Add window</button>
                <small style={{ color: 'var(--text-dim)', fontSize: 11 }}>Effect is measured from this company's own calendar-month returns.</small>
              </div>
            )}

            {/* Shocks  ->  sliders instead of checkboxes */}
            {openMeta.id === 'shocks' ? (
              <>
                <div className="lab-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))', maxHeight: 'none', overflow: 'visible' }}>
                  {(openMeta.sliderOptions || []).map(item => {
                    const key = `primitive:${item.key}`;
                    const on = Boolean(toggles[key]);
                    const value = Number(primitives[item.key] ?? 0);
                    return (
                      <div key={item.key} className={`lab-option ${on ? 'on' : ''}`} style={{ flexDirection: 'column', gap: 8 }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', cursor: 'pointer' }}>
                          <input type="checkbox" checked={on} onChange={() => onToggle(key)} />
                          <strong style={{ fontSize: 12.5 }}>{item.label}</strong>
                          <span className="num" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: value >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                            {value > 0 ? '+' : ''}{value.toFixed(2)}
                          </span>
                        </label>
                        <input
                          type="range" min="-1" max="1" step="0.05" value={value}
                          onChange={event => onPrimitiveChange(item.key, Number(event.target.value))}
                          disabled={!on}
                          aria-label={`${item.label} magnitude`}
                          style={{ opacity: on ? 1 : 0.4 }}
                        />
                        <small style={{ color: 'var(--text-dim)', fontSize: 10.5, fontFamily: 'var(--font-num)' }}>{item.source}</small>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <span className="field-label">Interest-rate shock</span>
                  {[-50, -25, 0, 25, 50].map(step => (
                    <button
                      key={step} type="button"
                      className={`span-pill ${Number(rateShockBps) === step ? 'active' : ''}`}
                      onClick={() => onRateShockChange(step)}
                    >
                      {step > 0 ? '+' : ''}{step} bps
                    </button>
                  ))}
                  <input
                    className="field-input" type="number" step="25" value={rateShockBps}
                    onChange={event => onRateShockChange(event.target.value)}
                    style={{ width: 96 }} aria-label="Rate shock in basis points"
                  />
                  <small style={{ color: 'var(--text-dim)', fontSize: 11 }}>Applied only when the company's model validates rate sensitivity.</small>
                </div>
              </>
            ) : visibleOptions.list.length ? (
              <>
                <div
                  className="lab-grid"
                  /* Small families show in full; only long lists get their own scroll */
                  style={visibleOptions.total <= PAGE_SIZE ? { maxHeight: 'none', overflow: 'visible' } : undefined}
                >
                  {visibleOptions.list.map(item => {
                    const on = isActive(item.key);
                    const tone = item.effect == null ? 'none' : item.effect >= 0 ? 'pos' : 'neg';
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`lab-option ${on ? 'on' : ''}`}
                        onClick={() => onToggle(item.key)}
                        title={item.description || item.category}
                        aria-pressed={on}
                      >
                        <span className="lab-check">{on && <Check size={13} strokeWidth={3} />}</span>
                        <span className="lab-option-body">
                          <span className="lab-option-label">{item.label}</span>
                          <span className="lab-option-meta">
                            <span className={`lab-impact ${tone}`}>
                              {item.effect == null ? 'no estimate' : signed(item.effect)}
                            </span>
                            <span>{item.observations} cases</span>
                            <span>{item.companies} co.</span>
                            {item.category && <span style={{ color: 'var(--text-dim)' }}>{item.category}</span>}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {visibleOptions.remaining > 0 && (
                  <div className="lab-more">
                    <button
                      type="button" className="bubble-btn"
                      onClick={() => setVisible(previous => ({ ...previous, [openMeta.id]: (previous[openMeta.id] || PAGE_SIZE) + PAGE_SIZE }))}
                    >
                      Show {Math.min(PAGE_SIZE, visibleOptions.remaining)} more
                      <span style={{ color: 'var(--text-dim)', fontWeight: 600, marginLeft: 6 }}>
                        {visibleOptions.list.length} of {visibleOptions.total} shown
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="lab-empty">No evidence in the supplied files matches “{search}”. Try a shorter word, or clear the search.</div>
            )}
          </section>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Live selection rail                                                  */}
      {/* ------------------------------------------------------------------- */}
      <aside className="lab-rail">
        <div className="lab-rail-head">
          <span className="lab-rail-title">Active conditions</span>
          {selectedChips.length > 0 && (
            <button type="button" className="bubble-btn" style={{ padding: '4px 9px', fontSize: 11 }} onClick={onClearAll}>
              <X size={12} /> Reset
            </button>
          )}
        </div>

        {selectedChips.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, padding: '6px 2px' }}>
            <Info size={14} style={{ color: 'var(--accent)', marginRight: 6, verticalAlign: -2 }} />
            Nothing selected — the forecast uses the company's own observed baseline. Open a category on the left to condition the path.
          </div>
        ) : (
          <div className="lab-rail-list">
            {selectedChips.map(chip => (
              <div key={chip.key} className="lab-chip">
                <span className="dot" style={{ background: categoryTheme[chip.theme]?.accent || 'var(--accent)' }} />
                <span title={chip.label}>{chip.label}</span>
                {chip.effect != null && (
                  <em className="num" style={{ fontStyle: 'normal', fontSize: 10.5, color: chip.effect >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                    {chip.effect > 0 ? '+' : ''}{chip.effect.toFixed(1)}
                  </em>
                )}
                {chip.key !== '__rate__' && (
                  <button type="button" onClick={() => onToggle(chip.key)} aria-label={`Remove ${chip.label}`}><X size={11} /></button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="lab-rail-sum">
          <span className="lab-rail-title">Sum of selected associations</span>
          <b style={{ color: netEffect >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
            {selectedChips.length ? `${netEffect > 0 ? '+' : ''}${netEffect.toFixed(2)}%` : '—'}
          </b>
        </div>
        <div className="lab-rail-note">
          A raw tally of the historical associations attached to the conditions you switched on. The engine re-weights it against dated evidence and overlapping cases, so the projected path normally moves by less than this figure - and not at all when no comparable case exists.
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-dim)' }}>
          {activeCount > 0
            ? <><ArrowUpRight size={13} /> {activeCount} input{activeCount === 1 ? '' : 's'} feeding the model</>
            : <><ArrowDownRight size={13} /> baseline path</>}
        </div>
      </aside>
    </div>
  );
}
