#!/usr/bin/env python3
"""
FCA Static Dashboard Server
==========================

Simple HTTP server for testing the static dashboard.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Add caching headers for static files
        if self.path.endswith(('.js', '.css', '.json', '.png', '.jpg', '.gif')):
            self.send_header('Cache-Control', 'public, max-age=3600')  # 1 hour
            
        # Add compression hint
        if self.path.endswith(('.js', '.css', '.json', '.html')):
            self.send_header('Content-Encoding', 'identity')  # Note: SimpleHTTPRequestHandler doesn't support gzip
        
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.date_time_string()}] {format % args}")

def start_server(port=8080, open_browser=True):
    """Start the static dashboard server"""
    
    # Change to dashboard directory
    dashboard_dir = Path(__file__).parent
    os.chdir(dashboard_dir)
    
    print(f"🚀 Starting FCA Static Dashboard Server...")
    print(f"📁 Serving from: {dashboard_dir}")
    print(f"🌐 Server URL: http://localhost:{port}")
    print("=" * 50)
    
    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully on port {port}")
            
            if open_browser:
                print("🌍 Opening browser...")
                webbrowser.open(f'http://localhost:{port}')
            
            print("\n📊 Dashboard URLs:")
            print(f"   Main Dashboard: http://localhost:{port}/")
            print(f"   Data Files:     http://localhost:{port}/data/")
            print("\n⌨️  Press Ctrl+C to stop the server")
            print("=" * 50)
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use")
            print(f"💡 Try a different port: python serve.py --port {port+1}")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='FCA Static Dashboard Server')
    parser.add_argument('--port', '-p', type=int, default=8080, 
                       help='Port to serve on (default: 8080)')
    parser.add_argument('--no-browser', action='store_true',
                       help='Do not open browser automatically')
    
    args = parser.parse_args()
    
    start_server(port=args.port, open_browser=not args.no_browser)