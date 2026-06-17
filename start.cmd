@echo off
REM One-click launcher for the Founder Control Tower.
REM Double-click this file to start the dashboard and open it in your browser.
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies (first run only)...
  call npm install
)

echo.
echo Starting Founder Control Tower on http://localhost:3000
echo Close this window to stop the dashboard.
echo.

REM Open the browser a few seconds after the server starts.
start "" cmd /c "timeout /t 4 >nul & start "" http://localhost:3000"

call npm run dev
