#!/usr/bin/env python3
import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


ROLE = os.environ["ROLE"]
MODE = os.environ.get("MODE", "patched")
TOKEN = os.environ.get("ESTATE_TOKEN", "unset")
CROWN_ID = os.environ.get("CROWN_JEWEL_ID", "unset")
CROWN_FLAG = os.environ.get("CROWN_JEWEL_FLAG", "unset")
MARKER = os.environ.get("EVIDENCE_MARKER", "unset")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        if parsed.path == "/health":
            return self.reply(200, {"role": ROLE, "status": "ok", "marker": MARKER})
        if ROLE == "admin" and parsed.path == "/token":
            return self.reply(200, {"service_token": TOKEN, "scope": "synthetic-record-read"})
        if ROLE == "records" and parsed.path == "/record":
            supplied = self.headers.get("X-Estate-Token")
            if MODE == "vulnerable":
                supplied = supplied or query.get("token", [""])[0]
            record_id = query.get("id", [""])[0]
            if supplied != TOKEN:
                return self.reply(403, {"error": "token required"})
            if MODE == "patched" and record_id != "PUBLIC-DEMO":
                return self.reply(403, {"error": "record outside service allowlist"})
            if record_id == CROWN_ID:
                return self.reply(200, {"record_id": CROWN_ID, "synthetic_flag": CROWN_FLAG})
            return self.reply(404, {"error": "record not found"})
        if ROLE == "frontdoor" and parsed.path == "/fetch":
            target = query.get("url", [""])[0]
            parsed_target = urlparse(target)
            if MODE == "patched" and (parsed_target.scheme, parsed_target.hostname, parsed_target.path) != ("http", "records", "/health"):
                return self.reply(403, {"error": "destination not allowed"})
            try:
                with urllib.request.urlopen(target, timeout=3) as response:
                    return self.reply(response.status, {"upstream": response.read(8192).decode(errors="replace")})
            except (ValueError, urllib.error.URLError) as error:
                return self.reply(400, {"error": str(error)})
        return self.reply(404, {"error": "not found"})

    def reply(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(json.dumps({"role": ROLE, "client": self.client_address[0], "request": format % args}), flush=True)


ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
