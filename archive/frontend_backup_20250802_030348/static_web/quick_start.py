#!/usr/bin/env python3
"""
FCA Static Web Quick Start
=========================
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def find_free_port(start_port=8080):
    """Find a free port starting from start_port"""
    import socket
    for port in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return port
            except OSError:
                continue
    return None

def start_server():
    # Change to static_web directory
    static_web_dir = Path(__file__).parent
    os.chdir(static_web_dir)
    
    # Find free port
    port = find_free_port(8080)
    if not port:
        print("❌ No free ports available")
        sys.exit(1)
    
    print("🌐 FCA Static Web Dashboard")
    print("=" * 50)
    print(f"📁 Directory: {static_web_dir}")
    print(f"🔗 URL: http://localhost:{port}")
    print("=" * 50)
    print("✅ Server starting...")
    print("🚀 Open your browser and navigate to the URL above")
    print("⏹️  Press Ctrl+C to stop the server")
    print()
    
    try:
        with socketserver.TCPServer(("", port), CORSHTTPRequestHandler) as httpd:
            print(f"🟢 Server running on http://localhost:{port}")
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{port}')
                print("🌍 Browser opened automatically")
            except Exception:
                print("ℹ️  Please open your browser manually")
            
            print("\n" + "=" * 50)
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    start_server()