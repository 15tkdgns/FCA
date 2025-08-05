#!/usr/bin/env python3
"""
정적 웹 서버 테스트
"""
import http.server
import socketserver
import os

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server(port=8080):
    os.chdir('/root/FCA/static_web')
    
    with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
        print(f"🌐 Static web server running at http://localhost:{port}")
        print("📊 Access your FCA Dashboard in the browser")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    start_server()