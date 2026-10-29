# Verification probe: evidence quality, universal playbook, and the CSV guard.
$ErrorActionPreference = 'Continue'
$b = '{"span":"12M","toggles":{},"rate_shock_bps":0}'

foreach ($cid in @("AAPL", "OPENAI_ROCAST_DATASET")) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  try {
    $r = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/company/$cid/recommendations" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 900
    "=== $cid ($([int]$sw.Elapsed.TotalSeconds)s) status=$($r.evidence_status)"
    "    recs=$($r.recommendations.Count) standing=$($r.standing_state_labels.Count) sector=$($r.general_playbook.sector.key) do=$($r.action_plan.do.Count) avoid=$($r.action_plan.avoid.Count) env=$($r.action_plan.environment_checks.Count)"
    foreach ($x in $r.recommendations | Select-Object -First 5) {
      "    - " + $x.decision + " | excess=" + $x.with_decision_growth + "% | n=" + $x.matched_cases_count + " | cov=" + $x.months_coverage_pct + "% | above_avg=" + $x.above_average_share + "%"
    }
    "    PLAYBOOK DO: " + (($r.action_plan.do | Where-Object { $_.basis -like '*playbook*' } | ForEach-Object { $_.action }) -join ' / ')
    "    PLAYBOOK AVOID: " + (($r.action_plan.avoid | Where-Object { $_.basis -like '*playbook*' } | ForEach-Object { $_.action }) -join ' / ')
    "    ENV: " + ($r.action_plan.environment_checks -join ' || ')
  } catch { "$cid ERROR: $($_.Exception.Message)" }
}

# A teaching institute: no peer file exists for it anywhere in the panel.
$csv = @"
date,close,revenue_usd_m,gross_margin_pct,units_sold
2023-01-31,100,420,38,1200
2023-02-28,101,415,37,1180
2023-03-31,103,430,39,1240
2023-04-30,102,425,38,1210
2023-05-31,105,440,40,1270
2023-06-30,104,435,39,1250
2023-07-31,106,445,41,1290
2023-08-31,108,460,42,1330
2023-09-30,107,455,41,1310
2023-10-31,110,470,43,1360
2023-11-30,112,485,44,1400
2023-12-31,111,480,43,1380
2024-01-31,113,490,44,1420
2024-02-29,112,485,43,1400
2024-03-31,115,500,45,1450
2024-04-30,114,495,44,1430
2024-05-31,117,510,46,1470
2024-06-30,116,505,45,1450
2024-07-31,119,520,47,1500
2024-08-31,121,535,48,1540
2024-09-30,120,530,47,1520
2024-10-31,123,545,49,1570
2024-11-30,125,560,50,1610
2024-12-31,124,555,49,1590
"@
try {
  $u = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/companies/upload" -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ company_name = "Northbridge Institute of Applied Studies"; niche = "Education & Skills Training Institute"; main_country = "India"; csv_text = $csv }) -TimeoutSec 300
  "=== uploaded institute: " + $u.company_id
  $r2 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/company/$($u.company_id)/recommendations" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 600
  "    status=$($r2.evidence_status) recs=$($r2.recommendations.Count) sector=$($r2.general_playbook.sector.key) ($($r2.general_playbook.sector.label)) do=$($r2.action_plan.do.Count) avoid=$($r2.action_plan.avoid.Count)"
  "    top moves: " + (($r2.general_playbook.moves | Select-Object -First 6 | ForEach-Object { $_.name + " [" + $_.verdict + "]" }) -join ' / ')
} catch { "institute upload ERROR: $($_.Exception.Message)" }

# CSV-only guard: a JSON payload must be refused.
try {
  Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/companies/upload" -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ company_name = "Bad Format Co"; csv_text = '{"date":"2024-01-31","close":100}' }) -TimeoutSec 60
  "GUARD FAILED: JSON was accepted"
} catch { "guard ok -> " + $_.ErrorDetails.Message }
