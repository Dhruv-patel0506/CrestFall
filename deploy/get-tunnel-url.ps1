<#
 ---------------------------------------------------------------------------
 Print (and copy) the live public link.  -Open also loads it in the browser.
 ---------------------------------------------------------------------------
#>
[CmdletBinding()]
param([switch] $Open)

$UrlFile = Join-Path $PSScriptRoot 'tunnel-url.txt'

if (-not (Test-Path $UrlFile)) {
    Write-Host 'No link saved yet - the keeper writes it ~10-30 s after the tunnel connects.'
    Write-Host "Watch the log:  Get-Content ""$(Join-Path $PSScriptRoot 'logs\keepalive.log')"" -Tail 20"
    exit 1
}

$url = (Get-Content $UrlFile -First 1).Trim()
Write-Host "Crestfall public link:  $url"

try { Set-Clipboard -Value $url; Write-Host '(copied to clipboard)' } catch { }

# Prove it is actually answering, rather than trusting a stale file.
try {
    $r = Invoke-WebRequest -Uri ($url.TrimEnd('/') + '/api/health') -UseBasicParsing -TimeoutSec 40
    Write-Host "status: $($r.StatusCode) - $($r.Content)"
} catch {
    Write-Host "status: NOT REACHABLE ($($_.Exception.Message)) - the keeper recycles the tunnel within ~10 min"
}

if ($Open) { Start-Process $url }
