#!/usr/bin/env python3
import ipaddress
import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


MODE = os.environ.get("NETFORGE_MODE", "patched")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            return self.reply(200, {"status": "ok"})
        if parsed.path != "/diagnose":
            return self.reply(404, {"error": "not found"})
        host = parse_qs(parsed.query).get("host", [""])[0]
        try:
            if MODE == "vulnerable":
                result = subprocess.run(f"getent hosts {host}", shell=True, capture_output=True, text=True, timeout=4)
            else:
                safe_host = str(ipaddress.ip_address(host))
                result = subprocess.run(["getent", "hosts", safe_host], shell=False, capture_output=True, text=True, timeout=4)
            self.reply(200, {"returncode": result.returncode, "stdout": result.stdout[-2000:], "stderr": result.stderr[-1000:]})
        except (ValueError, subprocess.TimeoutExpired) as error:
            self.reply(400, {"error": str(error)})

    def log_message(self, format, *args):
        print(json.dumps({"client": self.client_address[0], "message": format % args}))

    def reply(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
