@echo off
REM ---------------------------------------------------------------------------
REM Crestfall - run it always-on, right now.
REM Opens one visible window that guards the engine (port 8000) and the
REM Cloudflare tunnel, restarting either the moment it dies, and prints the
REM public link as soon as it appears.
REM
REM Leaving this window open = keeping the guard. Closing it stops the guard
REM only; the app itself keeps running until stop-crestfall.ps1.
REM To have this happen by itself at every logon, run deploy\install-crestfall-startup.ps1 once.
REM ---------------------------------------------------------------------------
setlocal
title Crestfall keeper

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\crestfall-keepalive.ps1"

echo.
echo Keeper stopped.
pause
