# Crestfall

**Rise and fall, read from the record.** Crestfall forecasts a company's next phase from its own
dated history — where it is going, when it most likely peaks, and when it is most likely to fall —
and lets you condition that path on real events and decisions instead of invented assumptions.

---

## What is in this repo

```
.
├── README.md                        ← you are here
├── .gitignore
└── scenario_intelligence_engine/
    ├── main.py                      FastAPI engine (also serves the built app)
    ├── requirements.txt             3 packages, that is all
    ├── setup-crestfall.bat          one-time local setup
    ├── start-crestfall.bat          run + auto-restart (prints your LAN link)
    ├── server.py                    legacy single-file demo server (not used by the app)
    ├── algorithm/                   the forecasting engine, pure Python
    │   ├── forecast_model.py        walk-forward model selection + scenario overlay
    │   ├── simulator.py             monthly simulation of the company
    │   ├── schemas.py               pydantic domain models
    │   ├── calibration.py           calibration against known history
    │   ├── decision_engine.py       decision-evidence tiers
    │   ├── event_profiles.py        event/decision analogs
    │   ├── shock_primitives.py      demand/supply/cost/... elasticities by niche
    │   ├── permutation_matrix.py    scenario permutation presets
    │   └── train_and_process_all_49.py
    ├── frontend/                    React 19 + Vite app (no chart library)
    │   ├── src/App.jsx              welcome gate → intro transition → 5 workspaces
    │   ├── src/components/          ScenarioLab, WelcomeGate, IntroTransition, ui
    │   ├── src/data/festivals.js    world festival & shopping calendar
    │   ├── src/index.css            "Aurora Ink" design system (dark + light)
    │   └── vercel.json              SPA rewrites for Vercel
    ├── data/
    │   ├── sample_database.json     company registry metadata
    │   └── scenario_catalog_cache.json  cached cross-company event evidence
    ├── new_data/                    ⚠ 49 CSVs, ~2 GB — NOT in git (see below)
    ├── web/                         legacy static demo UI (not used by the app)
    ├── tests/                       run_tests.py, test_algorithm.py, test_scenarios.py
    └── docs/                        project plan, data requirements, pitch deck
```

## How it works

**Backend** — FastAPI, ~15 endpoints under `/api`. On startup it loads the company registry, binds
each company to its own source CSV, and caches the monthly series per file. It picks a forecast
model by **walk-forward validation**, derives phase / peak year / crash probability from the fitted
path, and applies scenario conditions only where dated evidence exists.

**Engine** — pure Python standard library (`csv`, `math`, `statistics`, `threading`). No pandas, no
numpy, no sklearn. That is why `requirements.txt` is three lines.

**Frontend** — React 19 + Vite. Charts are hand-built SVG (paths, gradients, glow filters) so they
stay sharp at any window size. Colours are CSS variables, so the dark/light toggle re-skins the
whole app. Flow: `WelcomeGate` → `IntroTransition` → `Dashboard`.

**Honesty model** — every scenario effect is a *historical association* from dated records, not a
causal estimate. A condition only moves the path when at least two comparable dated cases exist;
otherwise the forecast stays at baseline and the UI says so.

## The data files (important)

`new_data/` holds 49 CSVs (~2 GB) and is deliberately **not** committed — no repo should carry that,
and GitHub would choke. Without it the API still starts (`/api/health`, `/api/companies` work), but
every history/forecast endpoint returns "no source series".

To run it anywhere other than this machine, copy `new_data/` across out of band (zip + drive, or a
release asset), or point the frontend at an engine host that already has it.

## Run it locally

```bash
# 1. one-time: Python env
cd scenario_intelligence_engine
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt

# 2. one-time: build the frontend (needs Node 20.19+ / 22.12+)
cd frontend && npm install && npm run build

# 3. run  (or just double-click start-crestfall.bat)
cd .. && python main.py
```

Open **http://localhost:8000** — the engine serves the built app *and* the API on one port.
On your Wi-Fi: `http://<your-LAN-IP>:8000`.

Dev mode with hot reload: `npm run dev` in `frontend/` (port 5173) plus `set CRESTFALL_RELOAD=1`
before `python main.py`. Auto-reload is off by default because watching a 2 GB folder can restart
the server mid-demo and drop every warm cache.

## Hosting on Vercel

Vercel can host the **frontend**. It cannot host this **engine** — the API is a long-lived Python
process that reads ~2 GB of CSVs, and a single forecast takes 5–40 s of CPU, which does not fit
serverless functions. So the split is:

| Piece | Where |
|---|---|
| React app | Vercel |
| Python engine | a persistent host: your PC + a tunnel, or Render / Fly.io / a small VPS |

**Vercel project settings**

- Framework preset: **Vite**
- Root Directory: **`scenario_intelligence_engine/frontend`**
- Build command: `npm run build` · Output directory: `dist`
- Environment variable: `VITE_API_BASE = https://<your-engine-host>/api`  ← required

`vercel.json` in that folder already handles SPA rewrites. Without `VITE_API_BASE` the app calls
`/api` on its own origin, which on Vercel is a 404 — the app will load but every panel will be empty.

**Cheapest way to get a shareable link today**

```bash
# on the machine that has the data
start-crestfall.bat                       # serves :8000
cloudflared tunnel --url http://localhost:8000   # prints a public https URL
```

Put that tunnel URL in `VITE_API_BASE`, redeploy Vercel, and the Vercel site talks to your engine.
Keep the laptop awake (Plug in → Sleep = Never) or the link dies.

**Cleaner permanent option:** deploy the engine to Render/Fly (disk ≥ 2 GB, RAM ≥ 1 GB), set
`VITE_API_BASE` to it, and Vercel + the engine are both always up.

## Tests

```bash
cd scenario_intelligence_engine
python tests/run_tests.py
```

## Notes

- `web/` and `server.py` are the earlier static prototype, kept for reference. The React app does
  not use them.
- Historical filenames still say "RoCast"; the product is now **Crestfall**.
