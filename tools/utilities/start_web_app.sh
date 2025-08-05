#!/bin/bash

# FCA Web Application Startup Script

echo "🚀 Starting FCA Web Application..."

# Navigate to web app directory
cd /root/FCA/web_app

# Activate virtual environment
source ../venv/bin/activate

# Check if required packages are installed
echo "📦 Checking dependencies..."
python -c "import flask, plotly; print('✅ All dependencies available')" || {
    echo "❌ Missing dependencies. Installing..."
    pip install Flask plotly
}

# Start the web application
echo "🌐 Starting web server..."
echo "📊 Dashboard will be available at:"
echo "   - Local: http://localhost:5000"
echo "   - Network: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the application
python app.py