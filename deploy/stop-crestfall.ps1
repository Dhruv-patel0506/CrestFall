<#
 ---------------------------------------------------------------------------
 Stop Crestfall completely: the keeper watchdog, the engine on :8000 and the
 Cloudflare tunnel. Safe to run twice.

   -KeeperOnly   stop guarding but leave the app live
 ---------------------------------------------------------------------------
#>
[CmdletBinding()]
param([switch] $KeeperOnly)

$ErrorActionPreference = 'Continue'

function Stop-ByCommandLine([string]$Pattern, [string]$Label) {
    $rows = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match $Pattern }
    if (-not $rows) { Write-Host "  $Label : not running"; return }
    foreach ($row in $rows) {
        Write-Host ("  {0} : stopping pid={1}" -f $Label, $row.ProcessId)
        Stop-Process -Id $row.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`nStopping Crestfall`n"

# The keeper is matched on its own script name so we never kill an unrelated
# PowerShell window.
Stop-ByCommandLine 'crestfall-keepalive\.ps1' 'keeper'

if (-not $KeeperOnly) {
    Stop-ByCommandLine 'cloudflared\.exe'           'tunnel'
    Stop-ByCommandLine 'python(\.exe)?\s+.*main\.py' 'engine'
}

Write-Host ''
