# Keeping Crestfall online — the honest version

Crestfall is not a static site. A request can mean "read 45 MB of intraday rows, fit four models by
walk-forward validation, resample 256 paths" — 5 to 40 seconds of CPU. So the question is never
"can we host it", it is **"which machine stays awake to do the maths?"**

That is also why Vercel / Netlify / GitHub Pages cannot run this project. They host files and short
serverless functions; they have no persistent process, no 2 GB of disk, and a request timeout far
below what a forecast needs. They are fine for the React app alone — useless for the engine.

Every site you admire being "up all the time" pays with **money or electricity**. Pick one.

---

## Option 1 — a small Linux VPS (recommended, ~€4–6 / month)

A single always-on box that runs the engine *and* serves the built app, exactly like
`python main.py` does on your laptop today.

| Host | Shape | Notes |
|---|---|---|
| **Hetzner CX22 / CPX21** | 2 vCPU, 4 GB RAM, 40 GB disk, ~€4.5 | Cheapest solid option. Needs ≥ 5 GB disk for the CSVs. |
| **DigitalOcean / Lightsail** | 2 vCPU, 4 GB, 80 GB, ~$6–12 | Easiest dashboards, good docs. |
| **Contabo** | more disk/RAM for less | Fine for a demo, weaker SLA. |

### Steps

1. **Create the server** — Ubuntu 24.04, 2 vCPU / 4 GB RAM minimum. Add your SSH key.
2. **Bootstrap it** (as root, once):
   ```bash
   ssh root@<server-ip>
   bash bootstrap-server.sh
   ```
3. **Push everything from your PC** (builds the frontend locally, copies code + the 2 GB of CSVs,
   installs dependencies, starts the service):
   ```powershell
   cd d:\Rocast\deploy
   .\push-to-server.ps1 -Server <server-ip> -User root
   ```
   Use `-UseWslRsync` for the 2 GB copy if you have WSL — it is resumable and only sends changes on
   later re-deploys. Re-running the script after any code change is normal and fast (`-SkipData`).
4. **Open it on the IP** — `http://<server-ip>` — pick a company, switch tabs, upload a CSV.
5. **Add a domain + HTTPS** (this is what makes it resume-worthy):
   - Point an `A` record for `crestfall.yourdomain.com` at the server IP.
   - `.\push-to-server.ps1 -Server <ip> -Domain crestfall.yourdomain.com -SkipData`
   - Caddy fetches and renews the certificate itself. Your link is now `https://crestfall.yourdomain.com`.

### What makes it "stay up"

- `deploy/crestfall.service` has `Restart=always` and `WantedBy=multi-user.target` → it comes back
  after a crash and boots with the machine.
- `--workers 2` in the unit lets two judges compute at once instead of queueing behind one process.
- Check on it any time:
  ```bash
  ssh <server> 'systemctl status crestfall'
  ssh <server> 'journalctl -u crestfall -f'      # live logs
  ssh <server> 'curl -s localhost:8000/api/health'
  ```

### Things to know before you share the link

- **The peer-comparison call is the slow one** (10–40 s, it forecasts every peer in the niche). With
  two workers and several visitors at once, requests queue. If the hackathon expects 20+ simultaneous
  judges, use 4 workers and a 4 vCPU box, or accept a few seconds of wait.
- **Anyone can upload a CSV**, and uploads are written to `scenario_intelligence_engine/data/uploads/`
  and stay there. On a public box that is a disk-growth and privacy consideration. Either clear it
  between sessions or add an upload limit — say the word and I'll add both.
- **Back up the box** once it's live: the CSVs are reproducible from your PC, but uploaded companies
  are not. A nightly `tar` of `data/` to object storage is 5 lines of cron if you want it.

---

## Option 2 — free, forever, and genuinely yours: Oracle Cloud Always Free

Oracle's free tier is the only "free" that does not sleep: an **ARM Ampere VM with up to 4 cores,
24 GB RAM and 200 GB block storage**, free indefinitely. That comfortably fits the 2 GB of CSVs and
the CPU bursts, and the same `bootstrap-server.sh` + `push-to-server.ps1` flow applies.

Cost: ₹0. Friction: card-based signup verification, ARM images (Python runs fine on it), and the free
capacity in your chosen region can be short. If money matters more than 20 minutes of signup, this is
the one.

---

## Option 3 — zero cost, zero infra: your laptop + the keeper

For a demo where you control the moment, one command installs a watchdog that owns both
halves and never lets either one slip:

```powershell
cd d:\Rocast\deploy
.\install-crestfall-startup.ps1     # once: autostart at logon + no idle sleep on AC
```

That drops a shortcut in your Startup folder, so `crestfall-keepalive.ps1` runs every time
Windows starts. It launches `python main.py` and `cloudflared`, probes `/api/health` every
20 s, restarts whichever one died, and writes the live public link to
`deploy\tunnel-url.txt` (also onto the clipboard whenever it changes).

```powershell
deploy\get-tunnel-url.ps1                    # print + copy the link, with a real probe
deploy\get-tunnel-url.ps1 -Open              # ...and open it
deploy\stop-crestfall.ps1                    # stop keeper + engine + tunnel
deploy\install-crestfall-startup.ps1 -Remove # undo the autostart
```

Two details worth knowing before you trust it:

- Health failures must stack up (6 in a row) before the engine is restarted, because a
  peer-comparison legitimately occupies the single worker for 40 s. A slow server is not a
  dead one, and killing it mid-forecast would break the demo you are watching.
- The keeper **adopts** a live engine and tunnel when it restarts, so a link you already
  pasted into a chat stays valid. Only `-RestartAll`, or a tunnel that must be recycled,
  mints a new one.

Free, live compute, no precomputation — and it dies when the lid closes on battery, the
Wi-Fi drops, or the venue network blocks outbound tunnels. **Do not put this URL on a CV.**
A named Cloudflare or Tailscale funnel makes it stable-ish, but your machine is still the
server.

---

## What I deliberately did not do

No precomputed JSON, no static snapshot, no canned answers. Every number on screen is produced by
`main.py` + `algorithm/` at the moment you ask for it, on whatever machine is serving — including for
a CSV a judge uploads that has never been seen before. That is the property you asked to protect, so
the deployment keeps the real engine as the only source of truth.
