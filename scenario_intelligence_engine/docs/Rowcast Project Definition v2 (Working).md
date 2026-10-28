# Rowcast: Project Definition v2 (Working Name)

Draft v2, 24 October 2026. Supersedes v1 (Tabula LTM). Working name Rowcast is provisional until a name check is done.

## 1. Project identity

Name: Rowcast (provisional). Engine: Trajectory Core. Model family: LTM, Large Tabular Model.

Positioning: Rowcast is a tabular model that predicts the next rows of a company's data. It learns from how companies behaved during past events, uses retrieval over similar past episodes, and turns its forecasts into phase diagnosis, competitive analytics, and recommendations. It works directly on CSV tables and explains every output.

What we claim: event-conditioned prediction of the next table rows, with evidence from leave-one-event-out testing. What we do not claim: that tabular foundation models do not exist. TabPFN already performs in-context prediction on tables. Our differences are event and scenario conditioning, retrieval over episodes, joint constrained prediction, and the diagnosis and recommendation layer.

Name check still needed: search for conflicts with existing products, trademarks, domains, and repositories before the pitch.

## 2. Core idea

The LTM predicts the future in tabular form: the next rows of a company's table under a chosen scenario. Everything else (phases, diagnosis, recommendations, dashboards) is built on that prediction. We do not add separate modules and train them one at a time. The system is one pipeline that produces a predicted table and then reads its meaning.

An LTM here has three properties:

1. It takes tables in their native form (CSV rows and columns, no JSON conversion).
2. It conditions predictions on events and scenarios, expressed as primitive vectors.
3. It outputs multiple linked targets: numeric forecasts with uncertainty, phase labels, attributions, constraint-consistent tables, and recommended actions.

## 3. Core features (in the system, not add-ons)

| # | Feature | Role |
| --- | --- | --- |
| F1 | Event-conditioned forecasting with retrieval | First feature. Predicts the next rows, conditioned on events and on retrieved similar past episodes. |
| F2 | Synthetic episode generation | Core feature. Simulates companies under random primitive combinations to extend the training set. |
| F3 | Joint multi-target prediction with constraints | Core feature. Predicts sales, margin, cash, and inventory together, and enforces identities (for example, cash change equals operating cash flow plus financing flow). |
| F4 | Factor attribution | Part of the definition. Splits each forecast change into contributions from primitives and factors. |
| F5 | Leave-one-event-out evaluation | Core evidence. Tests transfer to an unseen event and supports the hybrid claim. |
| F6 | Hybrid scenario composer | Combines a factor selection (for example, a festival calendar) with an event scenario (for example, COVID's demand and supply components) and records the provenance of each primitive. |
| F7 | Multi-task phase heads | Market phase, business phase, and distress labels, produced from the same representation as the forecasts. |
| F8 | Own RAG pipeline | Retrieval over episodes, dated news, and event documents to supply context to the forecaster and the language layer. |

## 4. Dashboard features (shown per company and in the master view)

Each company in the training set gets its own professional dashboard. A master view combines all companies. These features are outputs of the core engine, not separate models.

- Dataset explorer: browse the panel and inspect the CSV-backed tables.
- Company trend line and general market trend line.
- Market phase, business phase, and distress score with main drivers.
- Next-period prediction and month-by-month timeline under a chosen scenario.
- Event-conditioned analogs: similar past episodes and what followed.
- Factor attribution charts.
- Peer comparison and competitive position, for two companies in one niche.
- Focus-area diagnosis: which segments or cost lines drag or lift the company.
- Lever recommender: protect, grow, or pivot, with reasoning.
- News timeline overlay, mapped to primitives.
- Constraint check: shows whether predicted tables satisfy the identities in F3.
- Pros and cons: strengths and weaknesses from attribution and peer comparison.
- Market scenarios panel: live phase, market trend line, active news events.
- Upcoming data panel: next-period forecast with growth or loss risk.
- Uncertainty and disclaimer on every output.
- Voice input and output (stretch).

Master dashboard: three sections (personal pros and cons, current market scenarios, upcoming data with growth or loss risk) plus a recommendation panel.

## 5. Architecture

- Ingestion: reads CSV directly with DuckDB or pandas, infers column roles, maps to a canonical schema. The original CSV is never rewritten. The schema map is a small config file.
- Event library: versioned table of events with onset date, end date, and primitive magnitudes.
- Tabular core: LightGBM with quantile loss for multi-target forecasting, with a constraint layer for F3. TabPFN for small tables. A zero-shot baseline for comparison.
- Episode generator (F2): samples primitive combinations and produces synthetic company panels for training.
- Trajectory core: phase heads, changepoints (ruptures), distress score, optional HMM.
- Retrieval (F8): embeddings over episodes, news, and documents, served from a local vector index.
- Scenario composer (F6) and attribution (F4).
- Language layer: a local Ollama model parses scenario requests and writes plain-language explanations. It never produces numbers.
- Delivery: FastAPI backend, Streamlit dashboard for the hackathon.

## 6. Models and hardware

Hardware:

- Laptop A: RTX 3050 with 6 GB VRAM, 32 GB RAM.
- Laptop B: 16 GB RAM.

Local language model: a 7B to 8B model run through Ollama, such as Qwen or Llama 3.1 8B. Use quantized builds (4-bit) to fit the 6 GB GPU. Exact model names must be confirmed with ollama list on each laptop before setup.

Cloud model (optional): a larger model reported to be available through Ollama cloud. Its name, access terms, rate limits, and stability must be confirmed before the plan depends on it.

Training split: the 70/30 split is applied by time. Train on the earliest 70% of each company's history and test on the most recent 30%. A random split would leak future information. Keep the event test separate (see section 8).

Training responsibilities by hardware:

- Tabular models (LightGBM, TabPFN) train on CPU. Both laptops can run parallel sweeps.
- The RTX 3050 handles local inference and any small adapter training. Full fine-tuning of a 7B or 8B model is not realistic on 6 GB.
- Large cloud model, if available: used to generate labelled scenario narratives and explanations for distillation into the local model. It does not replace the tabular engine as the source of numbers.

The LLM is not trained on the CSV tables. Tables are learned by the tabular models, which read the columns directly. The language model handles retrieval, scenario parsing, and explanation.

## 7. Events and primitives

Primitives: demand shock, supply shock, credit and liquidity shock, rate shock, sentiment and volatility shock, calendar shock (festivals, holidays, seasonality), geopolitical shock, pandemic and health shock.

Each event carries a magnitude from 0 to 1 per primitive, an onset date, and a half-life. Magnitudes are assigned from a written rubric fixed before modeling, so labels are not tuned to results.

| Event | Dates | Dominant primitives |
| --- | --- | --- |
| Dot-com bust | March 2000 to October 2002 | Sentiment, credit, tech demand |
| 9/11 attacks | 11 September 2001 | Sentiment, geopolitical, travel and supply demand |
| Global financial crisis | September 2008 to March 2009 peak stress | Credit and liquidity, demand, sentiment |
| European debt crisis | 2010 to 2012 | Sentiment, credit |
| US debt downgrade | August 2011 | Sentiment |
| Taper tantrum | May to June 2013 | Rate, sentiment |
| China devaluation and selloff | August 2015 onward | Sentiment, demand |
| Q4 2018 selloff | Late 2018 | Rate, sentiment |
| COVID-19 crash and recovery | 19 February to 23 March 2020, recovery through 2021 | Pandemic, demand, supply, sentiment |
| 2022 rate hikes | 2022 | Rate shock, sentiment |
| Silicon Valley Bank failure | March 2023 | Credit and liquidity |

Naming note: the 2008 to 2010 period is usually called the Global Financial Crisis or Great Recession. The Great Depression was 1929 to 1939. Use the accepted name in slides and the README.

Calendar events (Diwali, Christmas, Black Friday, major e-commerce sale seasons) enter as calendar shocks.

## 8. Evaluation

Two separate tests, both reported:

1. Time split (70/30): forecast accuracy on the most recent 30% of each company's history. Metrics: WAPE, MAPE where the denominator is safe, pinball loss for quantiles, and interval coverage.
2. Leave-one-event-out (F5): train on all events except one, test on the held-out event, and compare against seasonal-naive and against a model without event primitives. Event conditioning must beat the no-event model on held-out events, or the event claim is not supported.

Also reported:

- Phase: macro F1 per class and lead time on detected peaks and crashes.
- Distress: recall on the distress class, with its base rate.
- Hybrid scenarios (F6): tested on held-out combinations, not only single events.
- Constraint satisfaction (F3): share of predicted tables that satisfy each identity.
- Recommendations: reported as correlational. No causal claim without an experiment.

## 9. Data plan

Companies (panel, deliberately varied):

- Nike (NKE), Microsoft (MSFT), JPMorgan Chase (JPM): quarterly financials from SEC EDGAR XBRL (free, official). Daily prices from yfinance, an unofficial wrapper. Check terms and document use.
- Flipkart: privately held, with no published standalone financials. Proposed: use a public e-commerce peer from EDGAR (Amazon) as a labelled stand-in, or an anonymized dataset labelled as proxy. Say on stage that Flipkart is a proxy.

Macro: FRED series (CPI, federal funds rate, unemployment, consumer sentiment). Sales: public retail data (Kaggle Store Sales or M5) to test the engine on daily data first. News: dated headlines from GDELT or a free-tier API. Store metadata and links only, not full article text.

Frequency: EDGAR quarterly, prices daily, macro monthly. Resample to monthly as the common frequency. Keep native frequency in metadata.

The panel is small by design: four companies, macro series, and event windows.

## 10. Guardrails

- Every forecast and recommendation carries a disclaimer: it is based on past events, past patterns may not repeat, and intervals are shown. Nothing is financial advice.
- The language model never produces numbers. Numbers come from the core engines.
- Check the license of every dataset and news source.
- Keep all API keys (Claude, Wispr, Ollama cloud) as environment variables on each laptop. Never place them in this doc, in code, or in a repository.

## 11. Five-day plan

| Day | Build | Done when |
| --- | --- | --- |
| 1 | Lock name and scope. Write primitive rubric. Build event library (10 events). Pull data. Schema inference. Seasonal-naive baseline. | Clean monthly panel and baseline error on the time split |
| 2 | Tabular core (LightGBM quantile, multi-target), constraint layer (F3), phase heads (F7), episode generator (F2) | Beats baseline on time split; constraints satisfied |
| 3 | Retrieval (F8), event-conditioned forecasting (F1), attribution (F4), hybrid composer (F6), leave-one-event-out (F5) | Held-out event results reported; one hybrid scenario runs |
| 4 | Dashboards (per company and master), FastAPI, Ollama layer, Docker | One command starts the app; a scenario returns a predicted table |
| 5 | Freeze. Full demo run. README, slides, backup recording, rehearsal. | Presentation ready with fallback recording |

Cut order if time runs short: voice output, then news overlay, then lever optimizer, then peer comparison, then HMM. Keep F1, F3, F5, the time split, and one hybrid scenario.

## 12. Technical components (TCs)

Ownership: both partners, you and Ridham, own every component. Task distribution will be decided later. Ownership will be filtered by contribution at the end of the hackathon.

| Component | Owner |
| --- | --- |
| Ingestion and schema mapping | You and Ridham |
| Event library and primitive rubric | You and Ridham |
| Data collection and cleaning | You and Ridham |
| Episode generator (F2) | You and Ridham |
| Tabular core and constraint layer (F1, F3) | You and Ridham |
| Phase heads and distress score (F7) | You and Ridham |
| Attribution and hybrid composer (F4, F6) | You and Ridham |
| Retrieval and RAG pipeline (F8) | You and Ridham |
| Evaluation, including leave-one-event-out (F5) | You and Ridham |
| Language layer (Ollama) | You and Ridham |
| Voice input and output | You and Ridham |
| Backend (FastAPI) | You and Ridham |
| Dashboards and frontend | You and Ridham |
| Video and presentation | You and Ridham |
| Documentation and README | You and Ridham |

## 13. Open decisions

- Final project name after a name check. Rowcast is provisional.
- Approval of the primitive rubric.
- Flipkart proxy choice.
- Exact Ollama model names on each laptop.
- Whether the cloud model is available and stable.
- Voice input source: Wispr Flow or built-in speech-to-text.
- Demo format: live demo, recorded backup, or slides only.

## 14. Next doc (planned)

A second doc will define formatting and full architecture: folder structure, interfaces between modules, data contracts, and naming conventions. Begins after this doc is approved.

## 15. Revision 3: decisions and architecture

This section supersedes conflicting items above.

Name: Tabrax (chosen for this draft). A name check is still needed before the pitch.

Train/test split: shuffle by episode, not by row. An episode is one company's time window around one event or calendar period. Assign episodes to train (70%) or test (30%) using a fixed random seed. Rows inside each episode keep their time order. Reason: shuffling individual rows lets the model see future values while predicting past ones, which inflates results. Repeat with several seeds (for example 5) and report the mean and spread. Keep one strict time-ordered test as a sanity check. Leave-one-event-out remains the event-transfer test.

Main dataset: the team's dataset of roughly one million rows is the primary training table. It stays as CSV, queried in place with DuckDB. No JSON conversion. Any derived Parquet cache is optional, for speed only, and is rebuilt from the CSV. Rows without a timestamp or entity ID cannot be conditioned and are excluded. The schema must be audited on Day 1.

How outputs change with inputs: the model predicts next-period values from four inputs: (a) the company's recent history, (b) a scenario vector of primitive magnitudes, (c) factor flags such as festival, season, and rate level, and (d) retrieved analog episodes. Changing any input changes the prediction. This conditioning is done by the tabular model, which is trained on these inputs. The language model is not needed for it.

Model stages:

- Stage 1 (CPU, first): LightGBM quantile regression with the conditioning features. This ships the demo.
- Stage 2 (GPU, only if Stage 1 is stable): a small neural tabular model, such as a transformer over rows with scenario tokens, trained on episodes. This is the route to a true LTM.
- Language layer: Qwen 2.5 7B through Ollama, used without training. It parses scenario text into a primitive vector, checked against a schema, and writes explanations. An optional LoRA fine-tune for parsing quality is a later task.

Compute:

- Tabular training runs on CPU. An A100 is not needed for Stage 1.
- Local Qwen 2.5 7B runs quantized (Q4) on the RTX 3050, with layers offloaded to the 32 GB RAM laptop. It is slower but usable for demos.
- Heavy jobs (Stage 2, LoRA) need an A100 80 GB. Options to check for current pricing and quotas: Google Colab (A100 requires a paid plan; the free tier gives T4 only), Kaggle (free GPU quota), Lightning AI, hourly rental on RunPod or Vast.ai, and cloud credits from student programs or hackathon sponsors.
- Ollama cloud, 200B model: used from the terminal, for explanation quality or distillation. Confirm the exact model name, access, and limits with the ollama CLI before the plan depends on it. It does not produce the numeric forecasts.

RAG pipeline: sources are the event library, dated news metadata, episode summaries, and the primitive rubric. Embeddings come from nomic-embed-text via Ollama. The vector store is local (FAISS or Chroma). LangChain orchestrates retrieval and tool calls. Pin LangChain versions in requirements.txt, because its APIs change often.

Voice: Wispr Flow turns speech into text inside an input field. It does not speak answers back. Voice output needs a separate text-to-speech engine, such as Piper locally, and is planned as its own component.

API keys: the Claude key, the Wispr key, and any Ollama cloud key are stored as environment variables. They never go in docs, code, or repositories.

Architecture flow: CSV (about 1M rows) -> DuckDB ingest and schema map -> episode builder (seeded split) -> feature builder (history, scenario, factor flags, retrieved analogs) -> tabular core (LightGBM now, LTM neural later) -> constraint layer -> phase heads -> attribution -> outputs (predicted table, intervals, phase, recommendation). Side path: Qwen via Ollama parses scenario text into a primitive vector and writes explanations. The RAG pipeline supplies retrieved analogs and context to the features and the explanations. FastAPI serves per-company dashboards and the master view.

Open items: the dataset's source, columns, time span, and company count; the exact Ollama model names; confirmation of the cloud model; the GPU budget and provider.

## 16. General information: how forecasting works (revision 4)

This section adds the missing general definitions. It is written in plain language on purpose.

Panel: all companies together in one table, with a company\_id column. Each company's rows stay tagged with its own ID. Training uses all companies, but every result is reported per company.

Period: one month. Quarterly and annual reports are spread across months with a flag column saying which months came from a quarterly report.

Window: a block of past months used as input. Default length is 12 months.

Horizon: how many months ahead the model predicts. Default is 6 months. A user request such as June to December is a 7-month horizon.

Episode: one company's window plus the scenario and the calendar for the forecast months. Episodes are the units that get shuffled into training and test sets, using a fixed seed. Months inside an episode keep their order.

Why we do not compare every row with every other row: with a million rows, pairwise comparison means about a trillion pairs, and a pair tells you little about a trend. Instead, each training example summarizes a past window (its growth, averages, and margins) and is paired with the months that followed. The model learns the mapping from a window to the next months. Patterns across many windows show whether a company is growing, stagnant, or declining.

Growth: the percentage change from the previous period. Month-over-month growth is noisy for seasonal businesses, so year-over-year growth is also computed and used as a target for seasonal companies.

Phases: the nine labels (growing, developing, peak, higher peak, lower peak, crashing, severe crashing, crashed, bankrupt) are computed by rules from growth and from the drop below the running peak. The rules' thresholds are fixed before training and recorded in the rubric file. Phases are used both as targets and as outputs.

Market definition: a company metadata table with one row per company. It holds niche (for example banking, brokerage, e-commerce, consumer, hardware), main market country, currency, and fiscal year end. Niche and country become input features and grouping keys.

Country calendars: India, United States, United Kingdom, China, and Australia each have their own festival and sales-season calendar. Examples: India (Diwali, Eid, Navratri, Christmas), US (Black Friday, Cyber Monday, back-to-school), UK (Boxing Day, Black Friday), China (Double 11, Spring Festival), Australia (end-of-financial-year sales in June). Each month gets a festival count and flags for its major events, per country.

Macro series per country: interest rates, inflation, unemployment, and consumer sentiment from each country's official source.

Scenario: a list of primitive magnitudes, one set per forecast month. Historical events (9/11, the 2008 financial crisis, COVID-19, and others) supply the primitive values used in training. The user's scenario supplies them at prediction time.

Missing data rules: drop fully empty rows and columns. Fill gaps only within a company's own history. Never fill the target. Keep a 'was missing' flag for every filled value.

Compute: the tabular engine (LightGBM) runs on CPU. A GPU is not required for this stage. A later neural model may benefit from one.

Hugging Face options: Chronos-Bolt (a pretrained time-series model that runs on CPU in its small sizes), TabPFN (a pretrained tabular model, suited to small tables and reliable up to its row limit), and open language models for the RAG and explanation layer. Use them as baselines and helpers. The core forecaster stays under our control so we can explain it.

## 17. Glossary

- Growth: percentage change from the previous period.
- Drawdown: percentage drop from the highest level so far.
- Running peak: the highest level reached so far in a company's history.
- Horizon: number of months predicted ahead.
- Window: number of past months used as input.
- Episode: one company's window, its scenario, and its calendar, used as one training or test unit.
- Primitive: one of the basic shock types (demand, supply, credit, rate, sentiment, calendar, geopolitical, pandemic).
- Conditioning: giving the model scenario and calendar inputs so that its output changes with them.

## 18. Feature registry

Every feature in RoCast is listed here with its purpose and what it predicts. A feature that is switched off in the dashboard does not reach the model. Features marked (new) were added in revision 7.

Modeling and evaluation

| Feature | Purpose | Predicts or shows |
| --- | --- | --- |
| F1 Event-conditioned forecasting with retrieval | Forecasts from history, event inputs, and similar past episodes | Growth and levels for the next months |
| F2 Synthetic episode generation | Adds simulated companies under random event combinations to training | Coverage of rare events |
| F3 Joint multi-target prediction with constraints | Predicts revenue, costs, margin, and cash together and checks their identities | Consistent tables |
| F4 Factor attribution | Splits each forecast into shares by input | Why a month moved |
| F5 Leave-one-event-out evaluation | Tests the model on an event it never saw in training | Evidence of event transfer |
| F6 Hybrid scenario composer | Combines a factor with an event scenario and records where each part came from | Combined what-if outcomes |
| F7 Multi-task phase heads | Predicts phase probabilities alongside growth | Probabilities for the nine phases |
| F8 Own RAG pipeline | Retrieves documents for context and explanation | Explanations only, never numbers |

Data and rules

| Feature | Purpose | Predicts or shows |
| --- | --- | --- |
| CSV ingestion and schema mapping | Reads raw CSV files and maps columns to canonical names | Clean monthly panel |
| Missing-data flags | Records which values were filled | Data quality report |
| Company metadata | Stores niche, country, currency, and fiscal year end | Comparison groups |
| Country calendars | Per-month festival flags and festival counts for each country | Festival effects |
| Macro series | Rates, inflation, unemployment, and sentiment by country | Macro effects |
| Event library | Named events (9/11, 2008 financial crisis, COVID-19, others) with primitive magnitudes | Special scenarios |
| Phase rules | Labels each month as growing through bankrupt | Phase targets |
| Decision proxies | Debt issued, capital spending, acquisitions, buybacks, price changes, headcount, guidance cuts | Decision effects |

Statistics

| Feature | Purpose | Predicts or shows |
| --- | --- | --- |
| Baselines (naive, seasonal, exponential smoothing) | Benchmarks the model must beat | Accuracy comparison |
| Quantile growth ranges | Low, most likely, and high growth | Forecast range |
| Conformal calibration | Adjusts ranges to reach the target coverage | Reliable intervals |
| Shapley attribution (SHAP) | Splits each forecast change by input | Driver shares |
| Toggle test | Switches an input off and measures the change | What-if effect |
| Changepoint detection | Finds turning points in a series | Peaks and troughs |

Dashboard

| Feature | Purpose | Predicts or shows |
| --- | --- | --- |
| Pros and cons panel | Strengths and weaknesses against niche peers | Ranking per metric |
| Forecast and phase panel | Span forecast with phase probabilities | Answers on crash and peak |
| Decisions and toggles panel | On and off switch for every input | Re-runs the forecast |
| Competitor comparison panel | Companies in one niche on one chart | Relative growth |
| Trend chart panel (new) | Actual curve, smoothed trend, turning points, and forecast band | Peak and trough history |
| Comparison chart panel (new) | Indexed growth and phase strips for peers | Side-by-side view |
| Combination explorer (new) | Stores and displays the output of each toggle combination | Scenario comparison |
| Sources and explanation panel | Drivers, retrieved context, model version, seed, and data date | Audit trail |
| Span selector | Chooses a month or year range | Forecast window |
| Voice input and output (stretch) | Speech in and out | Spoken answers |
| Disclaimer panel | States the limits on every output | Responsible use |
| News timeline overlay (stretch) | Maps dated news to events on the chart | Event markers |
| Lever recommender (stretch) | Ranks actions as protect, grow, or pivot | Recommendations |
| Focus-area diagnosis (stretch) | Ranks segments or cost lines by drag or lift | Focus areas |
| Competitive position score (stretch) | Scores a company against peers | Competitiveness |

## 19. Project thesis

RoCast is a combined project in data analytics and data science.

Data science: the system forecasts a company's future from its own history and from the conditions we set. It learns from past periods, events, festivals, decisions, and their chains of effects. It produces growth ranges, phase probabilities, crash and peak timing with probabilities by year, and estimates for alternative decisions. Forecasts are produced by statistical and machine learning models, trained on CPU with fixed seeds and block-based validation.

Data analytics: the dashboard lets a company see its history, its current position, and its possible futures, and interact with the toggles. It shows what each condition and decision would do, alone and in combination. The baseline view, with all toggles off, shows the company's general trend from its own history.

Core principle: one decision can start a chain of effects. For example, an AI investment can lead to debt financing and layoffs, which free budget, which raises AI spending. The chain can then branch. Token costs can rise faster than expected and weaken margins, or the company can use AI more efficiently and gain margin and a changed structure. The system models these chains from the company's own decision records and from peer cases, and reports every link as an estimate.

Festival and history memory: when a festival, event, or decision occurred before in the company's history, the system records what followed. Those past occurrences act as analogs for the forecast and for the dashboard's analog cards.

Recommendations: from the history of decisions across the niche, the system estimates which decisions were associated with better or worse outcomes in similar cases, and shows the 'do nothing' path. Recommendations are estimates from past cases, not financial advice.

Limit: these are associations learned from data. They are not proof of cause. Every output carries its source, model version, and data date.
