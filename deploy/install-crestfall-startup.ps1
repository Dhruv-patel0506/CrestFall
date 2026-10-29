<#
 ---------------------------------------------------------------------------
 One-time setup: make the Crestfall keeper start itself.

   * drops a shortcut into your per-user Startup folder  ->  the keeper runs
     silently every time you log in (i.e. every time the laptop turns on), no
     admin prompt, and it is the same thing you can double-click manually
   * by default also stops the laptop from idle-sleeping / hibernating on AC
     power and makes "close the lid (plugged in)" do nothing, because a
     sleeping machine is a dead link

 Run once:
   powershell -NoProfile -ExecutionPolicy Bypass -File install-crestfall-startup.ps1
   ... -SkipPower        leave your power plan exactly as it is
   ... -Remove           undo: delete the startup shortcut (and restore power)
 ---------------------------------------------------------------------------
#>
[CmdletBinding()]
param(
    [switch] $SkipPower,
    [switch] $Remove
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$Vbs        = Join-Path $PSScriptRoot 'keepalive-hidden.vbs'
$StartupDir = [Environment]::GetFolderPath('Startup')
$Lnk        = Join-Path $StartupDir 'Crestfall Keeper.lnk'

# lid-close behaviour: the setting exists but OEM plans often hide it, so it is
# attempted rather than assumed. Idle sleep is covered anyway by the keeper's
# own keep-awake request.
$NoSleepScript = Join-Path $PSScriptRoot 'set-no-sleep.ps1'

function Remove-StartupShortcut {
    if (Test-Path $Lnk) {
        Remove-Item $Lnk -Force
        Write-Host "  removed  $Lnk"
    } else {
        Write-Host '  no startup shortcut was present.'
    }
}

if ($Remove) {
    Write-Host "`nReverting Crestfall autostart`n"
    Remove-StartupShortcut
    Write-Host '  power settings were left under your control; to restore sleep:'
    Write-Host '    powercfg /change standby-timeout-ac 20'
    Write-Host '    powercfg /change hibernate-timeout-ac 0   (0 = your plan default)'
    Write-Host ''
    exit 0
}

Write-Host "`nCrestfall keeper - autostart setup`n"

if (-not (Test-Path $Vbs)) { throw "Expected $Vbs to exist." }

# --- 1. startup shortcut -----------------------------------------------------
$shell    = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($Lnk)
$shortcut.TargetPath       = "$env:windir\System32\wscript.exe"
$shortcut.Arguments        = """$Vbs"""
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.Description      = 'Crestfall keeper - engine + Cloudflare tunnel, self-healing'
$shortcut.Save()
Write-Host "  [1/3] startup shortcut  ->  $Lnk"

# --- 2. keep it awake on AC --------------------------------------------------
if ($SkipPower) {
    Write-Host '  [2/3] power plan untouched (-SkipPower). The link dies if the laptop sleeps.'
} else {
    # Powercfg's lid and unattended-sleep settings are hidden (and on a Modern
    # Standby device, absent from the plan) - that work belongs in its own
    # elevated script rather than half-done here.
    if (Test-Path $NoSleepScript) {
        Write-Host '  [2/3] opening the no-sleep setup (one UAC prompt; it reports what'
        Write-Host '        this power plan allows and logs to deploy\logs\no-sleep.log)'
        Start-Process powershell.exe -Verb RunAs -ArgumentList (
            '-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $NoSleepScript)
    } else {
        powercfg /change standby-timeout-ac 0 | Out-Null
        powercfg /change hibernate-timeout-ac 0 | Out-Null
        Write-Host '  [2/3] set-no-sleep.ps1 missing - applied sleep/hibernate = Never only'
    }
}

# --- 3. start it right now ---------------------------------------------------
Start-Process -FilePath "$env:windir\System32\wscript.exe" -ArgumentList """$Vbs""" -WindowStyle Hidden
Write-Host '  [3/3] keeper launched for this session'

Write-Host @"

Next: the public link appears in about 10-30 seconds.

    get the link      powershell -File "$RepoRoot\deploy\get-tunnel-url.ps1"
    link also saved   $RepoRoot\deploy\tunnel-url.txt
    logs              $RepoRoot\deploy\logs\keepalive.log
    stop everything   powershell -File "$RepoRoot\deploy\stop-crestfall.ps1"

Two things still kill a laptop-hosted link: a Windows update reboot that lands on
the lock screen (no logon, no startup folder) and a Wi-Fi network that blocks
outbound tunnels. Closing the lid is the third, and on a Modern Standby device the
firmware usually owns that choice. For a link you put on a CV, use the VPS route in
deploy\README.md.
"@
