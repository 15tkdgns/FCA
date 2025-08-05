#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

class ModularHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        mimetype, encoding = super().guess_type(path)
        if path.endswith('.js'):
            return 'application/javascript', encoding
        elif path.endswith('.css'):
            return 'text/css', encoding
        return mimetype, encoding
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/index-modular.html'
        return super().do_GET()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    os.chdir('/root/FCA/static_dashboard')
    
    with socketserver.TCPServer(("", port), ModularHTTPRequestHandler) as httpd:
        print(f"Serving modular dashboard at http://localhost:{port}")
        httpd.serve_forever()
