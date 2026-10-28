# RoCast Frontend Structure (for the frontend developer)

Draft, 25 October 2026. Backend owner: you and your partner. Frontend owner: your friend. This doc defines every page, panel, toggle, chart, and endpoint, so the frontend does not guess.

## 1. Principles

1. The frontend shows results. It never computes a forecast, a probability, or a peak year.
2. Every number displayed carries its source: model version, seed, data date, and provenance label.
3. Toggles live only on the page they belong to (section 4). They are never grouped on one shared panel.
4. Five pages, not more. Each page is detailed rather than split into extra pages.
5. Every permutation of toggles produces its own output: a key, a chart, and a table.

## 2. Visual style

Window frame: each page sits inside a window that looks like an open macOS window, with a title bar and three round buttons at top left (red, yellow, green). The title bar shows the page name. The window sits on a white page background.

Background: white (#FFFFFF). No dark mode in this version.

Style: bright and playful by default. Use bubbles for toggles and rounded cards. A professional style is an optional switch, to be decided with the team.

Palette (brighter, colourful):

- Blue #2563EB: history line
- Teal #14B8A6: forecast band
- Green #22C55E: peak markers
- Red #EF4444: trough markers
- Orange #F97316: what-if lines
- Purple #8B5CF6: scenario regions
- Yellow #FACC15: festival regions
- Pink #EC4899: decision pins
- Grey #9CA3AF: status quo and competitor lines

Gradients (blue to teal, orange to pink) are allowed on buttons, headers, and bubbles only, never on chart lines.

Accessibility: never use colour alone. Pair colour with shape or line style. Keep text at 14 px or larger. Minimum contrast 4.5:1 for text.

## 3. Animation (only these)

1. Graph draw-in: the history line draws from left to right in about 1 second on first load of a chart.
2. Graph restructure: when a toggle or span changes, the old line morphs to the new one in about 0.5 seconds.
3. Forecast band fades in after the forecast line draws.

No other animation. No looping. The rest of the window does not animate. Respect the reduced-motion setting, which skips all three.

## 4. Pages and toggles

Page 1: Company Profile. Shows every detail about the company: identity, niche, country, currency, fiscal year end, key financials (latest values and change), the decision history list, the data quality notes, and the provenance labels. Toggles: span selector only.

Page 2: Strengths and Weaknesses. Pros and cons against niche peers, with the rank per metric (margin, growth, cash runway, debt level, stability). Each item links to the decision or event that most influenced it. Toggles: peer group selector (niche or country).

Page 3: Historical Trends. The graph of the database for this company. Shows the actual history with its smoothed trend, peaks and troughs, recovery starts, festival regions, event regions, and decision pins. Each peak is labelled with its year and level. Toggles (overlay switches): festivals, special events (9/11, 2008, COVID-19, and others), decisions, phase bands, and a switch between monthly and yearly view.

Page 4: Future Forecast and Scenarios. The core prediction page. Shows the forecast for the chosen span with the growth range and the phase probabilities for each month. Also shows the crash timing (probability of a downfall for each year, with the most likely year) and the peak timing (probability of the peak for each year, with the most likely year). The path panel shows each driver's contribution as a waterfall per month, with the weight of each driver. Toggles grouped on this page: calendar (festivals per country), scenario primitives (demand, supply, credit, rates, sentiment, calendar, geopolitical, pandemic), special events, macro factors (rates, inflation, unemployment, consumer sentiment), and the permutation runner (choose up to three toggles from any group and run every on and off combination).

Page 5: Competitors and Decisions. Compares this company with peers in its niche on one chart at a time (indexed growth, phase strips). Also lists the company's own past decisions and the peer decisions, each with an estimated what-if path for this company. Shows which decisions are estimated to help growth or protect against a crash. Toggles: each decision (on or off, for this company only), and the peer selector.

## 5. Charts (2 or 3 per page, 2 or 3 series each)

Page 3: (a) Trend and peaks: history, smoothed trend, peak and trough markers. (b) Regions: festival and event regions in colour, decision pins. (c) Yearly summary bars with the peak year highlighted.

Page 4: (a) Forecast: history solid, forecast dotted, band shaded. (b) Crash and peak timing: probability bars by year, most likely year marked. (c) Path and weights: waterfall of driver contributions.

Page 5: (a) Peer comparison: indexed lines, status quo grey. (b) What-if: base line against the chosen decision line, orange. (c) Decision ranking: bars showing estimated effect on growth.

Series on one chart: no more than three.

## 6. Data the frontend reads (endpoints)

- GET /companies: id, name, niche, country.
- GET /company/{id}/profile: identity, financial summary, decision list, provenance.
- GET /company/{id}/strengths?peer\_group=: metrics and ranks.
- GET /company/{id}/history?view=monthly or yearly: values, phases, turning points, regions, pins.
- POST /company/{id}/forecast: span, toggles. Returns growth low, mid, high per month, phase probabilities, drivers per month, path weights.
- POST /company/{id}/timing: span, toggles. Returns crash probability by year, peak probability by year, most likely years, and the factors that move them earlier or later.
- POST /company/{id}/permutations: base toggles, chosen toggles (max three), span. Returns one result per combination, each with a key, a summary, and a link to its chart data.
- GET /niche/{id}/comparison?companies=: indexed series and phase strips.
- GET /company/{id}/decisions: own and peer decisions, each with its estimated what-if path.
- GET /sources/{key}: model version, seed, data date, provenance.

Every response includes a 'key' field identifying the toggle set, span, and version.

## 7. Crash and peak timing display

- Crash timing: a bar per year, from the start year to the end year of the span. Bar height is the probability of a downfall that year. The most likely year has a red marker. Show the range (earliest and latest year with at least 10% probability).
- Peak timing: the same layout, in green. Show the most likely peak year and the factors that would bring it earlier or later.
- Always label: 'Estimate based on past patterns, not a prediction of a certain date.'

## 8. Permutation runner

- The user chooses up to three toggles.
- The runner builds every on and off combination, and shows a results list.
- Each row shows the combination, the most likely peak year, the crash probability, and the growth at the end of the span.
- Clicking a row opens its chart set.
- Show a progress bar. Cache results by key. Never run the same key twice.

## 9. States and messages

Loading: a skeleton shape in the window. Empty data: say which table is missing. Error: show the endpoint name and a retry button. Augmented or calibrated data: show a visible label on every chart that uses it.

## 10. Disclaimer

Every page footer: forecasts are estimates from past data and the conditions you select. They are not financial advice. Competitor and peer lines are status quo unless you set a what-if. Counterfactual paths are estimates, not facts.

## 11. Acceptance checklist

- Five pages, each in a macOS-style window, white background.
- Each toggle appears only on its own page.
- Each chart has no more than three series and two or three charts per page.
- Only the three animations in section 3 are present.
- Every number shows its source on hover or in the sources panel.
- Permutation runner returns one result per combination with its key.
- Reduced-motion setting works.

## 12. Revision 2 additions

This section adds the decision chains, the baseline view, the single-factor sensitivity, the span profile, the analogs, and the recommendations. The five pages in sections 4 to 8 stay as they are. The additions fit inside them.

### 12.1 Baseline view (all toggles off)

When every toggle is off, the page shows the company's general trend from its own history. The history is a bold dark line. The forecast is a dotted line with the teal band. This is the first view the user sees on each page. Every change in toggles is shown against this baseline.

### 12.2 Single-factor sensitivity

On page 4, the user can turn on one toggle at a time. A tornado chart ranks every toggle by its effect on the end-of-span growth, positive effects to the right, negative to the left. Each bar shows the effect size and its range. Pairs and triples are handled by the permutation runner in section 8.

### 12.3 Decision chains

A decision can start a chain. Each step affects the next. Example chain: an AI investment leads to debt financing and layoffs, which free budget, which raises AI spending. From there the chain branches:

- Branch A: token costs rise faster than expected, the budget shrinks, margins weaken, and the company degrades.
- Branch B: AI is used more efficiently, which lifts margins and profit, and changes how the business is structured.

Display: a chain diagram with nodes (decisions and outcomes) and arrows. Each node shows its month, its effect size, and its range. Branch A is red, Branch B is green, and the baseline path is grey. Chains appear on page 4 (forecast) and page 5 (decisions). The user can expand a node to see its evidence.

### 12.4 Span profile

The user picks any span, for example January to June. The page shows a profile card for the end of the span: predicted growth, phase, rise or fall direction, crash probability, peak timing, and the main drivers. The profile is shown on pages 1 and 4. Page 1 shows the profile for the current state. Page 4 shows it for the chosen span.

### 12.5 Past analogs

When a festival, event, or decision is toggled on, a card lists the past occasions in the company's history when it happened. For each occasion: the date, the change in the company's data in the following months, and whether the company's structure or workflow improved or weakened. Each card is labelled with its source rows. Analogs for other companies appear in the peer section on page 5.

### 12.6 Recommendations (last section of page 5)

The final section on page 5 is Recommendations. Each recommendation is a card with one of three tiers:

- Likely to help (green, up arrow): the decision is associated with better outcomes in similar past cases.
- Likely to hurt (red, down arrow): the decision is associated with worse outcomes, including falls and crashes.
- Uncertain (grey, question mark): too few similar cases, or results disagree.

Each card shows: the decision, the estimated growth range over the chosen span, a small chart comparing 'with this decision' and 'without it', the number of similar cases used, and the evidence list (which companies and years). A final card shows the 'do nothing' path: the trend if no new decision is taken.

Every recommendation carries this line: 'Estimate from past cases. Not financial advice.'

### 12.7 Summary card on every page

Each page starts with a summary card: current phase, direction (rise, flat, or fall), next peak year (most likely), crash risk level, and the number of toggles on. The summary updates with each toggle change.

### 12.8 New components

- Chain diagram (nodes, arrows, branches).
- Tornado chart (single-factor sensitivity).
- Profile card (span end state).
- Analog card (past occasions).
- Recommendation card (three tiers, mini-chart, evidence list).
- Summary card (every page).

### 12.9 Additional endpoints

- GET /company/{id}/chains?scenario=: chain nodes, branches, effect sizes, ranges.
- POST /company/{id}/sensitivity: span, toggles. Returns one effect per toggle, with baseline.
- POST /company/{id}/profile: span, toggles. Returns the end-of-span profile.
- GET /company/{id}/analogs?item=: past occasions and their outcomes for a festival, event, or decision.
- POST /company/{id}/recommendations: span, toggles. Returns ranked recommendations with tier, range, evidence, and the do-nothing path.

Every response includes the baseline, the key, and the model version.

### 12.10 Rules for the frontend

1. Toggles stay on their own page. The recommendation section never has toggles of its own. It uses the toggles set on page 4 and page 5.
2. The baseline is always visible next to any changed view.
3. Chains, analogs, and recommendations are estimates from history and peers. Label them that way every time.
4. No recommendation is shown without its evidence list.

### 12.11 Backend notes (for the backend owner)

Non-toggle factors also feed the model: festival history for the company, and the outcomes of past decisions and their chains. Toggles change only the conditions set on the page. The backend must return chain and analog data even when no toggle is on, so the baseline view can show them.
