@echo off
echo Starting Crestfall Backend + Cloudflare Tunnel...
echo.

echo [1/2] Starting Python backend on port 8000...
cd scenario_intelligence_engine
start "Crestfall Backend" cmd /k ".venv\Scripts\python main.py"
echo Backend started in new window.
echo.

echo [2/2] Starting Cloudflare Tunnel...
cd ..
start "Cloudflare Tunnel" cmd /k ".\cloudflared.exe tunnel --url http://localhost:8000"
echo Tunnel started in new window.
echo.

echo ========================================
echo Both services are running!
echo ========================================
echo Backend: http://localhost:8000
echo Tunnel URL: (check the Cloudflare Tunnel window)
echo Frontend: https://frontend-red-eta-80.vercel.app
echo Dataset Import Limit: 150MB
echo.
echo Keep both windows open for the app to work.
echo Close both windows to stop.
echo ========================================
pause
