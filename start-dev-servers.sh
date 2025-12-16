#!/bin/bash

echo "🚀 Starting Church Konet Development Environment"
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

# Check if express and cors are installed
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/cors" ]; then
    echo "📦 Installing Express and CORS..."
    npm install express cors
    echo "✅ Express and CORS installed"
fi

echo ""
echo "🔧 Starting Mock API Server (Port 3001)..."
echo "    Run this in a separate terminal: node api-mock.js"
echo ""
echo "🌐 Starting Vite Development Server (Port 5173)..."
echo "    Frontend will be available at: http://localhost:5173"
echo ""

# Start both servers
node api-mock.js &
VITE_PID=$!

echo "✅ Mock API Server started in background"
echo "✅ Vite Development Server starting..."
echo ""
echo "📋 To test SMS functionality:"
echo "1. Open test-sms-frontend.html in your browser"
echo "2. Use the test interface to check balance and send SMS"
echo "3. Check console logs for detailed debugging information"
echo ""
echo "🛑 To stop servers: Press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $VITE_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for Vite to start
sleep 3

echo "🎉 Development environment is ready!"
echo "Mock API: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Keep this terminal running and open test-sms-frontend.html to test SMS functionality"

# Keep script running
wait