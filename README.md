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
    │   └── vercel.json              SPA rewrites + /api proxy to the EC2 engine
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

## Live deployment (Vercel + AWS EC2)

Vercel hosts the **frontend** only. The API is a long-lived Python process that reads ~2 GB of CSVs
and a forecast takes 5–40 s of CPU, which does not fit serverless functions, so the engine runs on
an always-on AWS EC2 instance.

| Piece | Where |
|---|---|
| React app | Vercel project `crestfall-frontend` → https://crestfall-frontend.vercel.app |
| Python engine | AWS EC2 `t3.micro` (free tier), Docker container `crestfall-backend`, Elastic IP `13.55.43.139`, port 8000 |

**How they connect.** A browser refuses to let an HTTPS page call a plain-HTTP API (mixed content),
so the app calls its own origin `/api` (`frontend/.env.production`: `VITE_API_BASE=/api`) and
`frontend/vercel.json` rewrites `/api/*` to `http://13.55.43.139:8000/api/*`. No CORS or
certificate setup is needed on the engine.

**Redeploy the frontend**

```bash
cd scenario_intelligence_engine/frontend
vercel --prod --yes
```

**Update the engine on EC2** (the 49 CSVs sit in `/opt/CrestFall/scenario_intelligence_engine/new_data`
on the server, bind-mounted into the container, never in git)

```bash
scp -i <key.pem> scenario_intelligence_engine/main.py ubuntu@13.55.43.139:/tmp/main_new.py
ssh -i <key.pem> ubuntu@13.55.43.139 "cd /opt/CrestFall/scenario_intelligence_engine && sudo cp /tmp/main_new.py main.py && sudo docker compose up -d --build"
```

**Why it stays up without anyone watching**

- `restart: unless-stopped` plus Docker enabled at boot: the container returns after a crash or reboot.
- A Python-based Docker healthcheck, and `deploy/ec2-watchdog.sh` (cron, every minute) restarts the
  container if `/api/health` stops answering.
- The Elastic IP stays with the instance through a stop/start, so `vercel.json` never has to change.

**Memory.** The instance has about 1 GB of RAM, so the engine streams each 45 MB CSV instead of
holding every row in memory (loading them whole used ~700 MB per file and got the process killed).
After any restart the first peer comparison can take up to ~100 s while the monthly cache warms in
the background (~8 min); afterwards it answers in seconds.

Other hosting options (VPS, laptop + tunnel) are written up in `deploy/README.md`.

## Tests

```bash
cd scenario_intelligence_engine
python tests/run_tests.py
```

## Notes

- `web/` and `server.py` are the earlier static prototype, kept for reference. The React app does
  not use them.
- Historical filenames still say "RoCast"; the product is now **Crestfall**.
