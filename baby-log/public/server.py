#!/usr/bin/env python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.parse

PORT = 8899

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.startswith('/proxy/'):
            target_path = self.path[7:]
            target_url = f'https://open.feishu.cn/{target_path}'
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            req = urllib.request.Request(
                target_url,
                data=body,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': self.headers.get('Authorization', '')
                },
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                    self.send_response(resp.status)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data)
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(e.read())
        else:
            super().do_POST()
    
    def do_OPTIONS(self):
        if self.path.startswith('/proxy/'):
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            self.end_headers()
        else:
            super().do_OPTIONS()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    HTTPServer(('0.0.0.0', PORT), ProxyHandler).serve_forever()
