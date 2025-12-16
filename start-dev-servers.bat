@echo off
echo 🚀 Starting Church Konet Development Environment
echo ==================================================

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    echo ✅ Dependencies installed
)

:: Check if express and cors are installed
if not exist "node_modules\express" (
    echo 📦 Installing Express and CORS...
    npm install express cors
    echo ✅ Express and CORS installed
)

echo.
echo 🔧 Starting Mock API Server (Port 3001)...
echo    Run this in a separate terminal: node api-mock.js
echo.
echo 🌐 Starting Vite Development Server (Port 5173)...
echo    Frontend will be available at: http://localhost:5173
echo.

:: Start mock API server in background
start "Mock API Server" cmd /k node api-mock.js

:: Wait a moment for mock server to start
timeout /t 3 /nobreak >nul

echo ✅ Mock API Server started in background
echo ✅ Vite Development Server starting...
echo.
echo 📋 To test SMS functionality:
echo 1. Open test-sms-frontend.html in your browser
echo 2. Use the test interface to check balance and send SMS
echo 3. Check console logs for detailed debugging information
echo.
echo 🛑 To stop servers: Close the terminal windows
echo.

:: Start Vite development server
npm run dev

echo.
echo 🛑 Stopping servers...
echo.