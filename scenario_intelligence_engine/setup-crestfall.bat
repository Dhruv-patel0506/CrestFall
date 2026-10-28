@echo off
REM ---------------------------------------------------------------------------
REM Crestfall - one-time setup
REM Creates an isolated Python environment and installs the engine's three
REM dependencies. Run this once. Safe to re-run.
REM ---------------------------------------------------------------------------
setlocal
cd /d "%~dp0"

echo.
echo  Crestfall - first-time setup
echo  ----------------------------
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo  [X] Python was not found on PATH. Install Python 3.11 or newer from
  echo      https://www.python.org/downloads/ and tick "Add python.exe to PATH".
  pause
  exit /b 1
)

if not exist ".venv" (
  echo  [1/3] Creating a virtual environment...
  python -m venv .venv
)

echo  [2/3] Installing dependencies...
call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip --quiet
pip install -r requirements.txt

echo  [3/3] Checking the built frontend...
if not exist "frontend\dist\index.html" (
  echo.
  echo  [!] frontend\dist is missing. Build it once with:
  echo        cd frontend ^&^& npm install ^&^& npm run build
  echo      (needs Node.js 20.19+ or 22.12+)
) else (
  echo       frontend\dist found.
)

echo.
echo  Setup complete. Start the app with start-crestfall.bat
echo  Then open  http://localhost:8000
echo.
pause
endlocal
