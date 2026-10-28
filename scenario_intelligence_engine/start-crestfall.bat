@echo off
REM ---------------------------------------------------------------------------
REM Crestfall - start (and keep running)
REM Serves the API and the built app on port 8000. If the process ever exits,
REM it restarts after 3 seconds, so the link stays live while you present.
REM Close this window to stop the app.
REM ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"

set "PORT=8000"

if exist ".venv\Scripts\python.exe" (
  set "PY=.venv\Scripts\python.exe"
) else (
  set "PY=python"
  echo  [!] No .venv found - using system Python. Run setup-crestfall.bat once
  echo      if the app fails to start.
)

if not exist "frontend\dist\index.html" (
  echo  [X] frontend\dist is missing. Build it first:
  echo        cd frontend ^&^& npm install ^&^& npm run build
  pause
  exit /b 1
)

echo.
echo  Crestfall is starting on port %PORT%
echo    This machine:   http://localhost:%PORT%
echo.
echo  Shareable link on your Wi-Fi / LAN (same network only):
netsh interface ip show addresses 2>nul | findstr /i "IP Address" | findstr /v "127.0.0.1"
echo.
echo  Leave this window open. Press Ctrl+C to stop.
echo.

:loop
"%PY%" main.py
echo.
echo  [!] The server exited (%errorlevel%). Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
