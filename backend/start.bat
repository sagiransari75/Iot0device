@echo off
title IotSimX — IoT Simulator
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║       IotSimX — IoT Simulator            ║
echo  ║  Raspberry Pi Sensor Simulation Platform ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found. Download from: https://nodejs.org/
  pause
  exit /b 1
)

echo  [1/3] Installing backend dependencies...
call npm install --silent
if %errorlevel% neq 0 (
  echo  [ERROR] Backend npm install failed.
  pause & exit /b 1
)

echo  [2/3] Installing frontend dependencies...
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
  echo  [ERROR] Frontend npm install failed.
  pause & exit /b 1
)
cd ..

echo  [3/3] Starting servers...
echo.
echo  Backend  → http://localhost:4000
echo  Frontend → http://localhost:3000
echo  Demo login: demo@iotsimx.dev / demo1234
echo.
echo  Press Ctrl+C to stop both servers.
echo.

:: Start backend in background
start "IotSimX Backend" cmd /k "node server.js"

:: Wait 2 seconds then start frontend
timeout /t 2 /nobreak >nul
cd frontend
start "IotSimX Frontend" cmd /k "npm run dev"
cd ..

echo  Both servers are starting...
echo  Open http://localhost:3000 in your browser.
echo.
pause
