<#
 ---------------------------------------------------------------------------
 Make this laptop refuse to sleep while Crestfall is supposed to be serving.

 What it tries, on the active plan:
   * Sleep after              (AC)  -> Never
   * Hibernate after          (AC)  -> Never
   * Unattended sleep timeout       -> 0   (hidden; otherwise Windows sleeps a
                                           locked/idle machine ~15 min even when
                                           the plan says Never)
   * Lid close action         (AC, and DC unless -KeepBatterySleep) -> Do Nothing

 Verified on this machine (2026-10-29): it is a Modern Standby / S0 Low Power
 Idle device - `powercfg /a` shows no S3 - so two things follow, and neither is
 a script bug:

   * the lid and unattended-timeout setting INSTANCES do not exist in the
     Balanced plan (firmware decides lid behaviour), so they can be *revealed*
     but often cannot be *set*. The script reports exactly which happened.
   * what actually holds an S0 machine awake is an execution request, not the
     plan timeouts. crestfall-keepalive.ps1 holds one for as long as it runs,
     including ES_DISPLAY_REQUIRED, which is the request S0 idle will not
     override. That is the real guarantee; this script is the belt.

 Needs administrator rights, so it self-elevates with one UAC prompt. Output
 goes to logs\no-sleep.log as well as the screen, because the elevated run
 opens its own window.

   powershell -NoProfile -ExecutionPolicy Bypass -File set-no-sleep.ps1
   ... -KeepBatterySleep    lid close on battery still sleeps (bag-safe)
 ---------------------------------------------------------------------------
#>
[CmdletBinding()]
param([switch] $KeepBatterySleep)

$ErrorActionPreference = 'Continue'

$LogDir = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$LogFile = Join-Path $LogDir 'no-sleep.log'

function Note([string]$Text) {
    $line = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Text
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

function Run-PowerCfg([string[]]$ArgList) {
    # Returns the raw text powercfg printed (empty string when it accepted the
    # change quietly), with stderr folded in so failures are visible here.
    $out = & powercfg @ArgList 2>&1 | Out-String
    return $out.Trim()
}

# --- elevate if we are not admin, then re-run straight here ------------------
$isAdmin = ([Security.Principal.WindowsPrincipal] `
           [Security.Principal.WindowsIdentity]::GetCurrent()
          ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Note 'not elevated - relaunching with a UAC prompt (click Yes)'
    $extra = if ($KeepBatterySleep) { ' -KeepBatterySleep' } else { '' }
    try {
        Start-Process powershell.exe -Verb RunAs -ArgumentList (
            '-NoProfile -ExecutionPolicy Bypass -File "{0}"{1}' -f $PSCommandPath, $extra)
        exit 0
    } catch {
        Note ('could not elevate: ' + $_.Exception.Message)
        exit 1
    }
}

Note '=== running elevated ==='

# GUIDs, not aliases: this plan's group is 4f971e89-...-a8de-9e59040e7347 and a
# wrong-but-plausible group GUID fails with a confusing "does not exist".
$GrpSleep  = '238c9fa8-0aad-41ed-83f4-97d245f9a048'   # SUB_SLEEP
$GrpButton = '4f971e89-eebd-4455-a8de-9e59040e7347'   # SUB_BUTTONS (Power buttons and lid)
$SetLid        = '5ca83367-6e45-459f-a27a-476b950d66fe'
$SetUnattended = '7bc4a2f9-8bd9-4453-ade3-5a0e76e188f5'

# --- reveal the two hidden settings ------------------------------------------
foreach ($pair in @(@($GrpButton, $SetLid), @($GrpSleep, $SetUnattended))) {
    $r = Run-PowerCfg @('-attributes', $pair[0], $pair[1], '-ATTRIB_HIDE')
    if ($r) { Note ('reveal ' + $pair[1].Substring(0,8) + ' -> ' + $r) } else { Note ('revealed ' + $pair[1].Substring(0,8)) }
}

# --- apply -------------------------------------------------------------------
function Set-Value([string]$Verb, [string]$Group, [string]$Setting, [string]$Value, [string]$Label) {
    $r = Run-PowerCfg @("/$Verb", 'SCHEME_CURRENT', $Group, $Setting, $Value)
    if (-not $r) { Note ('ok       ' + $Label); return $true }
    # An instance that does not exist in the plan yet can sometimes be created
    # by a second attempt after the reveal; try once more before giving up.
    $r2 = Run-PowerCfg @("/$Verb", 'SCHEME_CURRENT', $Group, $Setting, $Value)
    if (-not $r2) { Note ('ok       ' + $Label + '  (second attempt)'); return $true }
    $first = ($r -split "`n")[0]
    $note = 'cannot set'
    if ($r2 -match 'does not exist') { $note = 'setting not present in this plan (firmware-owned)' }
    elseif ($r2 -match 'not within the range|malformed') { $note = 'value rejected (the plan does not accept it)' }
    Note ("skipped  $Label  ->  $note  |  $first")
    return $false
}

Set-Value 'setacvalueindex' $GrpSleep  'STANDBYIDLE'              '0' 'sleep after, on AC              -> Never'        | Out-Null
Set-Value 'setacvalueindex' $GrpSleep  'HIBERNATEIDLE'            '0' 'hibernate after, on AC          -> Never'        | Out-Null
Set-Value 'setacvalueindex' $GrpButton $SetLid                    '0' 'lid close, on AC                -> Do Nothing'   | Out-Null
if (-not $KeepBatterySleep) {
    Set-Value 'setdcvalueindex' $GrpButton $SetLid                '0' 'lid close, on battery           -> Do Nothing'   | Out-Null
}
# Unattended sleep timeout: some builds reject 0 and accept 1 (effectively never,
# because it only counts down after an unattended wake).
if (-not (Set-Value 'setacvalueindex' $GrpSleep $SetUnattended '0' 'unattended sleep timeout, AC     -> 0')) {
    Set-Value 'setacvalueindex' $GrpSleep $SetUnattended '1' 'unattended sleep timeout, AC     -> 1' | Out-Null
}

Run-PowerCfg @('/setactive', 'SCHEME_CURRENT') | Out-Null
Note 'active plan reloaded'

# --- read back what the machine now believes ---------------------------------
Note '--- verified from the plan ---'
function Read-Back([string]$Group, [string]$Setting, [string]$Label) {
    $text = Run-PowerCfg @('/q', 'SCHEME_CURRENT', $Group, $Setting)
    $ac = 'absent from plan'; $dc = 'absent from plan'
    if ($text -match 'Current AC Power Setting Index:\s*(0x[0-9a-fA-F]+)') { $ac = $matches[1] }
    if ($text -match 'Current DC Power Setting Index:\s*(0x[0-9a-fA-F]+)') { $dc = $matches[1] }
    Note ('  {0,-28} AC={1}  DC={2}' -f $Label, $ac, $dc)
}

Read-Back $GrpSleep  'STANDBYIDLE'   'Sleep after'
Read-Back $GrpSleep  'HIBERNATEIDLE' 'Hibernate after'
Read-Back $GrpButton $SetLid         'Lid close action'
Read-Back $GrpSleep  $SetUnattended  'Unattended sleep timeout'

$states = Run-PowerCfg @('/a')
if ($states -match 'S0 Low Power Idle') {
    Note ''
    Note 'this device sleeps as S0 Low Power Idle, so the lid and unattended settings are'
    Note 'owned by firmware. What keeps it serving is the keeper execution request'
    Note '(crestfall-keepalive.ps1), which holds the machine out of idle while it runs.'
}
Note ''
Note 'bag warning: lid close = Do Nothing on battery means a closed lid in a bag keeps'
Note 'running and will get hot. Re-run with -KeepBatterySleep to skip that line.'
Note 'restore normal lid behaviour:  powercfg /setacvalueindex SCHEME_CURRENT ' + $GrpButton + ' ' + $SetLid + ' 1'

Write-Host ''
Write-Host 'Done - results are in deploy\logs\no-sleep.log. Press any key to close.' -NoNewline
try { $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') } catch { Start-Sleep -Seconds 8 }
