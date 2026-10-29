@echo off
REM ---------------------------------------------------------------------------
REM Kept for muscle memory: this used to open two bare cmd windows (engine and
REM cloudflared) and leave you to notice when either one died. It now just
REM hands over to the keeper, which restarts both and records the public link.
REM ---------------------------------------------------------------------------
echo Starting Crestfall under the keeper (engine + tunnel, self-healing)...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\crestfall-keepalive.ps1"
echo.
echo Keeper stopped.
pause
