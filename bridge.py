import http.server
import socketserver
import json
import os

PORT = 8080

class KiCadDaemonBridge(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Enable CORS for the local Next.js frontend
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
            filename = payload.get('filename')
            content = payload.get('content')

            if not filename or not content:
                response = {"status": "error", "message": "Missing filename or content"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return

            # Prevent directory traversal
            safe_filename = os.path.basename(filename)
            
            with open(safe_filename, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"[VibePCB Sync] Wrote design file to local disk: {safe_filename}")
            
            response = {"status": "success", "file": safe_filename}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"[VibePCB Sync Error] Failed to write file: {str(e)}")
            response = {"status": "error", "message": str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == "__main__":
    # Create handler and start server
    handler = KiCadDaemonBridge
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"=========================================================")
        print(f" VibePCB KiCad Daemon Bridge running on port {PORT}")
        print(f" Listening for layout updates from local web browser...")
        print(f"=========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down bridge server...")
            httpd.server_close()
