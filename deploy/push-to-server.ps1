<#
.SYNOPSIS
    Deploy (or re-deploy) Crestfall to the Linux server that keeps it online.

.DESCRIPTION
    Runs from your Windows machine. Builds the frontend locally, copies code +
    the built app + the ~2 GB of source CSVs to the server, installs Python
    dependencies, wires up the systemd service and Caddy, and restarts.

    Safe to re-run: it only sends what changed when rsync is available.

.EXAMPLE
    .\push-to-server.ps1 -Server 203.0.113.10 -Domain crestfall.yourdomain.com
    .\push-to-server.ps1 -Server 203.0.113.10 -SkipData          # code only, fast
    .\push-to-server.ps1 -Server 203.0.113.10 -UseWslRsync       # resumable 2 GB copy
#>
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$User = "root",
    [string]$Domain = "",          # leave empty to test on http://<Server> first
    [string]$SshKey = "$env:USERPROFILE\.ssh\id_rsa",
    [switch]$SkipData,            # skip the 2 GB new_data copy (already on the box)
    [switch]$SkipBuild,           # reuse the existing frontend/dist
    [switch]$UseWslRsync          # use rsync through WSL for resumable transfers
)

$ErrorActionPreference = "Stop"
$Repo     = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Engine   = Join-Path $Repo "scenario_intelligence_engine"
$Remote   = "$User@$Server"
$AppDir   = "/opt/crestfall"
$Staging  = Join-Path $env:TEMP "crestfall-deploy"

function Invoke-Remote([string]$Command) {
    Write-Host "  \$ $Command" -ForegroundColor DarkGray
    ssh -i "$SshKey" -o StrictHostKeyChecking=accept-new $Remote $Command
    if ($LASTEXITCODE -ne 0) { throw "Remote command failed: $Command" }
}

Write-Host "`nCrestfall deploy -> $Remote" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1. Build the frontend here (the server does not need Node installed)
# ---------------------------------------------------------------------------
if (-not $SkipBuild) {
    Write-Host "`n[1/6] Building the React app" -ForegroundColor Yellow
    Push-Location (Join-Path $Engine "frontend")
    if (-not (Test-Path ".\node_modules")) { npm.cmd install }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Frontend build failed" }
    Pop-Location
}

# ---------------------------------------------------------------------------
# 2. Stage a clean copy of the app (no node_modules, no .git, no venv)
# ---------------------------------------------------------------------------
Write-Host "`n[2/6] Staging the app folder" -ForegroundColor Yellow
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
$Stage = Join-Path $Staging "scenario_intelligence_engine"
New-Item -ItemType Directory -Force -Path $Stage | Out-Null
foreach ($item in @("main.py", "requirements.txt", "algorithm", "data", "tests", "frontend")) {
    Copy-Item -Recurse -Force (Join-Path $Engine $item) (Join-Path $Stage $item)
}
# Drop things the server never needs
foreach ($junk in @("node_modules", ".vite", ".backup", "scripts")) {
    Get-ChildItem $Stage -Recurse -Directory -Force -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq $junk } | Remove-Item -Recurse -Force
}
Remove-Item -Recurse -Force (Join-Path $Stage "data\uploads") -ErrorAction SilentlyContinue

$CodeSize = (Get-ChildItem $Stage -Recurse -File | Measure-Object Length -Sum).Sum / 1MB
Write-Host ("       {0:N1} MB of code + built app" -f $CodeSize)

# ---------------------------------------------------------------------------
# 3. Copy to the server
# ---------------------------------------------------------------------------
Write-Host "`n[3/6] Copying to the server" -ForegroundColor Yellow
Invoke-Remote "mkdir -p $AppDir"

if ($UseWslRsync) {
    # Resumable and delta-only: best for the 2 GB dataset and for re-deploys.
    wsl -e rsync -avz --partial --progress -e "ssh -i '$($SshKey -replace '\\','/')'" `
        "/mnt/$(($Stage -replace '^.', '').ToLower())/$(Split-Path $Stage -Leaf)/" `
        "$Remote$AppDir/scenario_intelligence_engine/"
} else {
    scp -i "$SshKey" -r -q $Stage $Remote :"$(Split-Path $AppDir -Qualifier)$AppDir/"
    if ($LASTEXITCODE -ne 0) { throw "scp failed" }
}

if (-not $SkipData) {
    Write-Host "       copying new_data (~2 GB, this takes a while)..." -ForegroundColor Yellow
    $DataDir = Join-Path $Engine "new_data"
    if ($UseWslRsync) {
        wsl -e rsync -avz --partial --progress -e "ssh -i '$($SshKey -replace '\\','/')'" `
            "/mnt/$(($DataDir -replace '^.', '').ToLower())/" `
            "$Remote$AppDir/scenario_intelligence_engine/new_data/"
    } else {
        scp -i "$SshKey" -r -q $DataDir $Remote :"$AppDir/scenario_intelligence_engine/new_data"
        if ($LASTEXITCODE -ne 0) { throw "scp of new_data failed" }
    }
}

# ---------------------------------------------------------------------------
# 4. Python dependencies
# ---------------------------------------------------------------------------
Write-Host "`n[4/6] Installing Python dependencies" -ForegroundColor Yellow
Invoke-Remote "chown -R crestfall:crestfall $AppDir"
Invoke-Remote "$AppDir/.venv/bin/pip install --quiet --upgrade pip"
Invoke-Remote "$AppDir/.venv/bin/pip install --quiet -r $AppDir/scenario_intelligence_engine/requirements.txt"

# ---------------------------------------------------------------------------
# 5. Service + proxy
# ---------------------------------------------------------------------------
Write-Host "`n[5/6] Installing the systemd service" -ForegroundColor Yellow
scp -i "$SshKey" -q (Join-Path $PSScriptRoot "crestfall.service") $Remote :"/etc/systemd/system/crestfall.service"
Invoke-Remote "systemctl daemon-reload && systemctl enable --now crestfall && systemctl restart crestfall"

if ($Domain) {
    Write-Host "       configuring Caddy for $Domain" -ForegroundColor Yellow
    $Caddy = Get-Content (Join-Path $PSScriptRoot "Caddyfile") -Raw
    $Caddy = $Caddy -replace "crestfall\.example\.com", $Domain
    $TmpCaddy = Join-Path $env:TEMP "Caddyfile.deployed"
    Set-Content -Path $TmpCaddy -Value $Caddy -Encoding ascii
    scp -i "$SshKey" -q $TmpCaddy $Remote :"/etc/caddy/Caddyfile"
    Invoke-Remote "systemctl reload caddy || systemctl restart caddy"
}

# ---------------------------------------------------------------------------
# 6. Prove it is live
# ---------------------------------------------------------------------------
Write-Host "`n[6/6] Health check" -ForegroundColor Yellow
Start-Sleep -Seconds 6
Invoke-Remote "systemctl is-active crestfall; curl -s -o /dev/null -w 'app: %{http_code}\n' http://127.0.0.1:8000/; curl -s http://127.0.0.1:8000/api/health"

$Target = if ($Domain) { "https://$Domain" } else { "http://$Server" }
Write-Host "`nDone.  Public link: $Target" -ForegroundColor Green
Write-Host "     Logs:  ssh $Remote 'journalctl -u crestfall -f'" -ForegroundColor DarkGray
