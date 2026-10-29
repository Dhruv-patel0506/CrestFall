<#
 ---------------------------------------------------------------------------
 Crestfall keeper - one process that keeps the whole app publicly reachable.

 What it does, in a loop, forever:
   * runs the FastAPI engine (`python main.py`) on 127.0.0.1:8000
   * runs a Cloudflare quick tunnel in front of it
   * restarts either one the moment it dies
   * writes the live public link to  deploy\tunnel-url.txt   (and copies it to
     the clipboard whenever it changes, so you always have it to paste)
   * holds a "system awake" request so the laptop does not idle-sleep while the
     keeper runs; the request is released automatically when the keeper exits

 Close this process to stop guarding (the engine and tunnel keep running).
 To stop everything, run  deploy\stop-crestfall.ps1

 Usage:
   powershell -NoProfile -ExecutionPolicy Bypass -File crestfall-keepalive.ps1
   -RestartAll     kill and relaunch engine/tunnel instead of adopting the live
                   ones (adoption is what keeps a shared link unchanged when
                   only the keeper itself is restarted)
   -IdleScreenOk   weaker keep-awake: allow the screen to sleep. On this Modern
                   Standby device the display request is what keeps processes
                   running, so only use this if a lit screen bothers you
   -NoClipboard    do not touch the clipboard when a new URL appears
 ---------------------------------------------------------------------------
#>
[CmdletBinding()]
param(
    [int]    $Port = 8000,
    [int]    $CycleSeconds = 20,
    [switch] $RestartAll,
    [switch] $IdleScreenOk,
    [switch] $NoClipboard
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------- paths ----
$RepoRoot    = Split-Path -Parent $PSScriptRoot
$EngineDir   = Join-Path $RepoRoot 'scenario_intelligence_engine'
$LogDir      = Join-Path $PSScriptRoot 'logs'
$KeeperLog   = Join-Path $LogDir 'keepalive.log'
$EngineLog   = Join-Path $LogDir 'engine.log'
$TunnelLog   = Join-Path $LogDir 'tunnel.log'
$UrlFile     = Join-Path $PSScriptRoot 'tunnel-url.txt'
$Cloudflared = Join-Path $RepoRoot 'cloudflared.exe'

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# ------------------------------------------------------------ logging ----
function Write-Log([string]$Message) {
    $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    try { Add-Content -Path $KeeperLog -Value $line -Encoding UTF8 } catch { }
    try { Write-Host $line } catch { }
}

function Rotate-Log([string]$Path, [int]$MaxKB = 2048) {
    try {
        if ((Test-Path $Path) -and ((Get-Item $Path).Length / 1KB) -gt $MaxKB) {
            Remove-Item $Path -Force -ErrorAction SilentlyContinue
        }
    } catch { }
}

# --------------------------------------------------- one keeper at a time ----
$createdNew = $false
try {
    $Mutex = New-Object System.Threading.Mutex($true, 'Local\CrestfallKeepAlive', [ref]$createdNew)
    if (-not $createdNew) { Write-Log 'A keeper is already running in this session - this copy exits.'; exit 0 }
} catch {
    Write-Log "mutex check unavailable ($($_.Exception.Message)) - continuing anyway"
}

# --------------------------------------------------- keep the OS awake ----
try {
    Add-Type -Namespace Crestfall -Name Power -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
} catch { }

function Set-KeepAwake {
    # PowerShell reads a hex literal with the high bit set as a NEGATIVE Int32,
    # which cannot marshal into the API's UInt32 parameter - hence Convert with
    # an explicit base.
    #
    # This device sleeps as S0 Low Power Idle (no S3), where plan timeouts alone
    # do not hold it out of idle. ES_DISPLAY_REQUIRED is the request that keeps
    # user-mode processes running there, so it is tried first: an engine that is
    # frozen in modern standby answers nothing and the tunnel goes dead quietly.
    # -IdleScreenOk lets the screen sleep, accepting a weaker guarantee.
    $candidates = @('80000043', '80000003', '80000041', '80000001')
    if ($IdleScreenOk) { $candidates = @('80000041', '80000001') }
    try {
        foreach ($hex in $candidates) {
            $flags = [System.Convert]::ToUInt32($hex, 16)
            $rc = [Crestfall.Power]::SetThreadExecutionState($flags)
            if ($rc -ne 0) {
                $kind = if ($hex -eq '80000043' -or $hex -eq '80000003') { 'system + display (screen stays lit)' }
                        elseif ($hex -eq '80000041') { 'system + away mode' }
                        else { 'system only' }
                Write-Log ('keep-awake held  0x' + $hex + '  ' + $kind)
                return
            }
        }
        Write-Log '[!] Windows refused every keep-awake request - the laptop CAN idle-sleep and take the link with it'
    } catch {
        Write-Log ('could not request keep-awake (' + $_.Exception.Message + ')')
    }
}
Set-KeepAwake

# ----------------------------------------------------------- the engine ----
function Get-EnginePython {
    $venv = Join-Path $EngineDir '.venv\Scripts\python.exe'
    if (Test-Path $venv) {
        try {
            & $venv -c 'import fastapi, uvicorn' 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { return $venv }
        } catch { }
    }
    $sys = (Get-Command python -ErrorAction SilentlyContinue)
    if ($sys) { return $sys.Source }
    return $null
}

function Get-EngineProcesses {
    $found = @()
    try {
        $owners = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
                    Select-Object -ExpandProperty OwningProcess)
        foreach ($oid in $owners) {
            if ($oid -and $oid -ne 0) {
                $proc = Get-Process -Id $oid -ErrorAction SilentlyContinue
                if ($proc) { $found += $proc }
            }
        }
    } catch { }
    try {
        $rows = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -match 'main\.py' }
        foreach ($row in $rows) {
            $proc = Get-Process -Id $row.ProcessId -ErrorAction SilentlyContinue
            if ($proc) { $found += $proc }
        }
    } catch { }

    $seen = @{}
    $unique = @()
    foreach ($proc in $found) {
        if (-not $seen.ContainsKey($proc.Id)) { $seen[$proc.Id] = $true; $unique += $proc }
    }
    return ,$unique
}

function Start-Engine {
    $py = Get-EnginePython
    if (-not $py) { Write-Log '[X] No usable Python found - run scenario_intelligence_engine\setup-crestfall.bat first.'; return $null }
    if (-not (Test-Path (Join-Path $EngineDir 'frontend\dist\index.html'))) {
        Write-Log '[!] frontend\dist is missing - the API will answer but the app will not load. Build it: cd frontend; npm run build'
    }
    Rotate-Log $EngineLog 4096
    Remove-Item $EngineLog -Force -ErrorAction SilentlyContinue
    Remove-Item "$EngineLog.err" -Force -ErrorAction SilentlyContinue
    $proc = Start-Process -FilePath $py -ArgumentList @('main.py') -WorkingDirectory $EngineDir `
                          -WindowStyle Hidden -PassThru `
                          -RedirectStandardOutput $EngineLog -RedirectStandardError "$EngineLog.err"
    Write-Log ('engine started   pid={0}   via {1}' -f $proc.Id, $py)
    return $proc
}

function Test-EngineHealth([int]$TimeoutSec = 30) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec $TimeoutSec
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Stop-AllEngines {
    foreach ($proc in (Get-EngineProcesses)) {
        try { $proc.Kill(); $proc.WaitForExit(10000) | Out-Null } catch { }
    }
}

function Get-ExitCodeSafe($Proc) {
    # A process killed by someone else can refuse to hand over its exit code;
    # never let that break a log line.
    try {
        if ($Proc -and $Proc.HasExited) {
            $code = $Proc.ExitCode
            if ($null -eq $code) { return 'unknown' }
            return [string]$code
        }
    } catch { return 'unknown' }
    return 'still running'
}

# ---------------------------------------------------------- the tunnel ----
function Get-TunnelProcesses {
    $rows = Get-CimInstance Win32_Process -Filter "Name='cloudflared.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match "tunnel\s+--url" -or $_.CommandLine -match "localhost:$Port" }
    $out = @()
    foreach ($row in $rows) {
        $proc = Get-Process -Id $row.ProcessId -ErrorAction SilentlyContinue
        if ($proc) { $out += $proc }
    }
    return ,$out
}

function Read-TunnelUrl {
    # cloudflared logs to stderr, and the quick-tunnel URL sits inside a
    # box-drawing banner. Scan line by line (a -join over two Get-Content
    # results silently loses data when one file is empty) and keep the last
    # match so a recycled tunnel's URL wins over a stale one.
    $found = $null
    foreach ($path in @($TunnelLog, "$TunnelLog.err")) {
        if (-not (Test-Path -LiteralPath $path)) { continue }
        $lines = @()
        try { $lines = @(Get-Content -LiteralPath $path -Tail 300 -ErrorAction Stop) } catch { continue }
        foreach ($line in $lines) {
            $m = [regex]::Match([string]$line, 'https://[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.trycloudflare\.com')
            if ($m.Success) { $found = $m.Value }
        }
    }
    return $found
}

function Start-Tunnel {
    if (-not (Test-Path $Cloudflared)) { Write-Log "[X] $Cloudflared not found - the public link cannot start."; return $null }
    Remove-Item $TunnelLog -Force -ErrorAction SilentlyContinue
    Remove-Item "$TunnelLog.err" -Force -ErrorAction SilentlyContinue
    $proc = Start-Process -FilePath $Cloudflared `
                          -ArgumentList @('tunnel', '--url', "http://localhost:$Port", '--no-autoupdate') `
                          -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru `
                          -RedirectStandardOutput $TunnelLog -RedirectStandardError "$TunnelLog.err"
    Write-Log ('tunnel started   pid={0}' -f $proc.Id)
    return $proc
}

# A quick tunnel prints its URL a few seconds after connecting.
function Wait-TunnelUrl($Proc, [int]$Seconds = 75) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $deadline) {
        try { if ($Proc -and $Proc.HasExited) { return $null } } catch { return $null }
        $url = Read-TunnelUrl
        if ($url) { return $url }
        Start-Sleep -Seconds 2
    }
    return $null
}

function Publish-Url([string]$Url, [string]$Why) {
    try { Set-Content -Path $UrlFile -Value $Url -Encoding ASCII } catch { }
    Write-Log ('PUBLIC LINK ({0})  {1}' -f $Why, $Url)
    Write-Log ('  also saved to {0}' -f $UrlFile)
    if (-not $NoClipboard) { try { Set-Clipboard -Value $Url } catch { } }
}

# ------------------------------------------------------------- startup ----
Write-Log '=============================================================='
Write-Log ('keeper starting   pid={0}   port={1}   cycle={2}s' -f $PID, $Port, $CycleSeconds)

$engine = $null
$tunnel = $null

if ($RestartAll) {
    Write-Log 'clean slate requested (-RestartAll): stopping anything already running.'
    foreach ($proc in (Get-EngineProcesses)) { Write-Log ('  stopping engine pid={0}' -f $proc.Id); try { $proc.Kill() } catch { } }
    foreach ($proc in (Get-TunnelProcesses)) { Write-Log ('  stopping tunnel pid={0}' -f $proc.Id); try { $proc.Kill() } catch { } }
}
else {
    # Adopt first: a keeper restart should not throw away a link you already sent
    # to someone. Anything unhealthy is left unadopted and started fresh below.
    Write-Log 'adopting anything already healthy (-RestartAll forces fresh ones).'
    if (Test-EngineHealth -TimeoutSec 20) {
        $engine = (Get-EngineProcesses | Select-Object -First 1)
        if ($engine) { Write-Log ('  adopted existing engine   pid={0}' -f $engine.Id) }
    }
    $existingTunnel = (Get-TunnelProcesses | Select-Object -First 1)
    if ($existingTunnel) {
        $tunnel = $existingTunnel
        Write-Log ('  adopted existing tunnel   pid={0}' -f $tunnel.Id)
        $adoptedUrl = Read-TunnelUrl
        if ($adoptedUrl) { Publish-Url $adoptedUrl 'adopted tunnel' }
        else { Write-Log '  this tunnel was started outside the keeper, so its URL is only in its own console window' }
    }
}

if (-not $engine) { $engine = Start-Engine }
if (-not $tunnel) {
    $tunnel = Start-Tunnel
    $url = Wait-TunnelUrl $tunnel 75
    if ($url) { Publish-Url $url 'new tunnel' } else { Write-Log '[!] tunnel gave no URL yet - the loop will keep looking' }
}

$lastUrl = $null
if (Test-Path $UrlFile) { $lastUrl = ((Get-Content $UrlFile -First 1) -as [string]) }

# The first pass indexes ~2 GB of CSVs; allow generous time before declaring failure.
$healthy = $false
for ($i = 0; $i -lt 24; $i++) {
    if (Test-EngineHealth -TimeoutSec 30) { $healthy = $true; break }
    Start-Sleep -Seconds 5
}
if ($healthy) { Write-Log 'engine answered /api/health - serving' } else { Write-Log '[!] engine still silent after ~13 min - guarding anyway' }

# ---------------------------------------------------------------- loop ----
# A single-worker engine can queue a health request behind a 40 s forecast, so
# failures must stack up before anything gets restarted.
$engineFails = 0
$publicFails = 0
$loop = 0

while ($true) {
    Start-Sleep -Seconds $CycleSeconds
    $loop++
    Rotate-Log $KeeperLog 4096

    # --- engine ---------------------------------------------------------
    # Health first, process state second: `python main.py` runs uvicorn through a
    # parent process and the real server is its child, so "our handle exited"
    # means nothing if the port still answers. Conversely a wedged worker whose
    # parent lives is caught by stacked health failures.
    if (Test-EngineHealth -TimeoutSec 45) {
        $engineFails = 0
    }
    else {
        $engineFails++
        $procGone = $true
        if ($engine) { try { $procGone = $engine.HasExited } catch { $procGone = $true } }

        # 6 slow/failed checks is minutes of real downtime, so a legitimately
        # busy 40 s forecast never gets killed mid-calculation.
        if ($procGone) {
            Write-Log ('[!] engine process exited (code ' + (Get-ExitCodeSafe $engine) + ') with failed health - restarting')
            Stop-AllEngines
            $engine = Start-Engine
            $engineFails = 0
            $publicFails = 0
        }
        elseif ($engineFails -ge 6) {
            Write-Log ('[!] health failed {0} checks in a row - restarting engine' -f $engineFails)
            Stop-AllEngines
            $engine = Start-Engine
            $engineFails = 0
        }
    }

    # --- tunnel ---------------------------------------------------------
    $tunnelGone = $false
    if ($tunnel) { try { $tunnelGone = $tunnel.HasExited } catch { $tunnelGone = $true } }
    if (-not $tunnel -or $tunnelGone) {
        if (-not $tunnel) { Write-Log '[!] no tunnel process to guard - starting one' }
        else { Write-Log ('[!] tunnel exited (code {0}) - restarting' -f (Get-ExitCodeSafe $tunnel)) }
        $tunnel = Start-Tunnel
        $url = Wait-TunnelUrl $tunnel 75
        if ($url -and $url -ne $lastUrl) { Publish-Url $url 'tunnel restart'; $lastUrl = $url }
        elseif ($url) { $lastUrl = $url }
        $publicFails = 0
    }

    # Roughly every 10 minutes, prove the public path works end to end.
    if (($loop % 30) -eq 0) {
        # Power plan drift check: someone (or a corporate policy refresh) can put
        # "Sleep after" back on a timer. The execution request still holds, but
        # say it out loud rather than letting the link die mysteriously later.
        try {
            $planText = (powercfg /q SCHEME_CURRENT SUB_SLEEP STANDBYIDLE 2>&1 | Out-String)
            if ($planText -match 'Current AC Power Setting Index:\s*(0x[0-9a-fA-F]+)') {
                if ($matches[1] -ne '0x00000000') {
                    Write-Log ('[!] power plan changed: sleep-after on AC is now ' + $matches[1] + ' - run deploy\set-no-sleep.ps1')
                }
            }
        } catch { }

        if (-not $lastUrl) {
            $found = Read-TunnelUrl
            if ($found) { Publish-Url $found 'recovered URL'; $lastUrl = $found }
        }
        elseif ($engineFails -eq 0) {
            try {
                $r = Invoke-WebRequest -Uri ($lastUrl.TrimEnd('/') + '/api/health') -UseBasicParsing -TimeoutSec 45
                if ($r.StatusCode -ne 200) { throw 'non-200' }
                $publicFails = 0
            }
            catch {
                $publicFails++
                Write-Log ('[!] public probe failed (attempt {0}): {1}' -f $publicFails, $_.Exception.Message)
                if ($publicFails -ge 3) {
                    Write-Log '    tunnel looks wedged while the process still lives - recycling it'
                    try { foreach ($p in (Get-TunnelProcesses)) { $p.Kill() } } catch { }
                    $tunnel = Start-Tunnel
                    $url = Wait-TunnelUrl $tunnel 75
                    if ($url) { Publish-Url $url 'wedged-tunnel restart'; $lastUrl = $url }
                    $publicFails = 0
                }
            }
        }
    }
}
