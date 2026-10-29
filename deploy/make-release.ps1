<#
.SYNOPSIS
  Builds the downloadable Crestfall release packages.

.DESCRIPTION
  Two artefacts, both with FIXED names so the landing page can link
  releases/latest/download/<name>.zip forever:

    Crestfall-windows.zip          ~420 MB  the engine, the built app and all 49
                                             company files. One download, opens on
                                             a full panel, works offline forever.

    Crestfall-windows-lite.zip     ~4 MB    the same engine with no company data.
                                             The visitor imports their own CSV
                                             through "Add data". This is the build
                                             to hand a company that will not put
                                             someone else's data on its laptops.

  Nothing here is precomputed output. The zip carries the same source CSVs the
  local engine reads; every forecast, scenario and recommendation is still
  calculated on the visitor's machine when they click.

.PARAMETER CoreOnly
  Build only the 4 MB bring-your-own-data package.

.PARAMETER FullOnly
  Build only the 420 MB package (default).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File deploy\make-release.ps1
  powershell -ExecutionPolicy Bypass -File deploy\make-release.ps1 -CoreOnly
#>
param(
  [switch]$CoreOnly,
  [switch]$FullOnly,
  [string]$Version = (Get-Date -Format 'yyyy.MM.dd'),
  [string]$OutDir = "$PSScriptRoot\..\release"
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

if ($CoreOnly -and $FullOnly) { Write-Host "  [X] pick -CoreOnly or -FullOnly, not both"; exit 1 }
$BuildFull = -not $CoreOnly
$BuildLite = -not $FullOnly

$Project = (Resolve-Path "$PSScriptRoot\..\scenario_intelligence_engine").Path
$Release = (New-Item -ItemType Directory -Force -Path $OutDir).FullName

Write-Host ""
Write-Host "  Crestfall release builder  v$Version" -ForegroundColor Cyan
Write-Host "  project : $Project"
Write-Host "  output  : $Release"
Write-Host ""

# ------------------------------------------------------------------- staging
# One stage folder is built, then zipped twice with or without new_data.
$Staging = Join-Path $env:TEMP "crestfall-stage-$Version"
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
$Root = New-Item -ItemType Directory -Force -Path (Join-Path $Staging "Crestfall")

function Write-Step([string]$text) { Write-Host "  $text" -ForegroundColor DarkCyan }

Write-Step "[1/5] engine, API and the built app"

# Anything the app needs at run time, and nothing it does not.
$Items = @(
  @{ Path = "main.py";             Kind = "File" }
  @{ Path = "requirements.txt";    Kind = "File" }
  @{ Path = "Setup-Crestfall.bat"; Kind = "File"; Source = "setup-crestfall.bat" }
  @{ Path = "Start-Crestfall.bat"; Kind = "File"; Source = "start-crestfall.bat" }
  @{ Path = "algorithm";           Kind = "Dir" }
  @{ Path = "data";                Kind = "Dir"; Exclude = @("uploads") }
  @{ Path = "frontend\dist";       Kind = "Dir" }
)

foreach ($item in $Items) {
  $sourceName = if ($item.Source) { $item.Source } else { $item.Path }
  $source = Join-Path $Project $sourceName
  if (-not (Test-Path $source)) {
    Write-Host "  [X] missing $sourceName - build the frontend first (npm run build inside .\frontend)" -ForegroundColor Red
    exit 1
  }
  $target = Join-Path $Root.FullName $item.Path
  if ($item.Kind -eq "File") {
    $null = New-Item -ItemType Directory -Force -Path (Split-Path $target)
    Copy-Item $source $target
  } else {
    Copy-Item $source $target -Recurse
    foreach ($skip in $item.Exclude) {
      $junk = Join-Path $target $skip
      if (Test-Path $junk) { Remove-Item $junk -Recurse -Force }
    }
  }
}

# The app writes imported CSVs here, so the folder has to exist.
$null = New-Item -ItemType Directory -Force -Path (Join-Path $Root.FullName "data\uploads")
$Version | Set-Content -Path (Join-Path $Root.FullName "version.txt") -Encoding ascii

Write-Step "[2/5] company panel (49 files, only for the full package)"
if ($BuildFull) {
  $null = New-Item -ItemType Directory -Force -Path (Join-Path $Root.FullName "new_data")
  Copy-Item (Join-Path $Project "new_data\*.csv") (Join-Path $Root.FullName "new_data") -Force
} else {
  # The registry inside data\sample_database.json lists all 49 companies. On a
  # machine without their CSVs that would show 49 names that fail when clicked,
  # so the lite build ships an empty registry and opens straight on the import
  # screen instead.
  $liteRegistry = [ordered]@{
    companies = @()
    metadata  = @{
      note  = "Bring your own data: click Add data in Crestfall and drop in a company CSV."
      built = $Version
    }
  }
  ($liteRegistry | ConvertTo-Json -Depth 4) | Set-Content -Path (Join-Path $Root.FullName "data\sample_database.json") -Encoding utf8
}

# ------------------------------------------------------------------- README
@'
Crestfall - the whole engine, on your machine
=============================================

What you need
  Windows 10 or 11
  Python 3.11 or newer - https://www.python.org/downloads (tick "Add python.exe to PATH")
  A few hundred MB of disk, and 8 GB of RAM is comfortable for the 49-company panel

Install, about a minute
  1. Right-click the zip -> Extract All -> into a folder called Crestfall.
     If Windows says "protected your PC": More info -> Run anyway. The launchers
     are not code-signed yet; they only create a Python venv and start uvicorn.
  2. Double-click Setup-Crestfall.bat (once).
  3. Double-click Start-Crestfall.bat, then open  http://localhost:8000

  To show it to someone on the same Wi-Fi, Start-Crestfall.bat prints this
  machine's LAN address - hand them that link instead.

Two builds
  Crestfall-windows.zip          every forecast on 49 companies, offline
  Crestfall-windows-lite.zip     no company data; click "Add data" and import
                                 your own CSV. Same engine, same maths.

Your data stays yours
  No account, no cloud, no telemetry, nothing sent anywhere. The engine reads the
  CSVs in .\new_data and .\data\uploads and computes on this machine.

Notes
  Port in use?   set CRESTFALL_PORT=8090   then run Start-Crestfall.bat
  First request after a start can take a minute: the shared evidence catalog is
  rebuilt from the CSVs (measured 62 s for all 49 companies) and then cached.
  A forecast takes 5-20 s on a laptop because it re-runs walk-forward validation
  over the whole series each time. That is the model, not a bug.
'@ | Set-Content -Path (Join-Path $Root.FullName "READ ME FIRST.txt") -Encoding ascii

# ------------------------------------------------------------------- zipping
function Compress-Release([string]$assetName, [string]$label) {
  $zip = Join-Path $Release $assetName
  if (Test-Path $zip) { Remove-Item $zip -Force }
  [IO.Compression.ZipFile]::CreateFromDirectory($Staging, $zip, 'Optimal', $false)
  $mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
  Write-Host "  [ok] $label ..... $mb MB -> $assetName" -ForegroundColor Green
  return $zip
}

Write-Step "[3/5] zipping"
if ($BuildFull) { $null = Compress-Release "Crestfall-windows.zip" "full package  " }
if ($BuildLite) { $null = Compress-Release "Crestfall-windows-lite.zip" "lite package  " }

Remove-Item $Staging -Recurse -Force

Write-Host ""
Write-Host "  Next, on github.com/Dhruv-patel0506/CrestFall:" -ForegroundColor Cyan
Write-Host "    1. Code -> Releases -> Create a new release (tag v$Version)"
Write-Host "    2. Drag the zip(s) in as assets. Do not rename them: the landing"
Write-Host "       page links releases/latest/download/Crestfall-windows.zip"
Write-Host "    3. Publish the .\site folder with GitHub Pages (the workflow in"
Write-Host "       .github\workflows\pages.yml does it on every push)"
Write-Host ""
