#!/usr/bin/env python3
"""
Development server for The First Seven Years.
Rebuilds the site and starts a local HTTP server pointing to ./site.
"""
import os
import subprocess
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler
import socketserver
from pathlib import Path

PORT = 8477
ROOT = Path(__file__).parent.resolve()
SITE_DIR = ROOT / "site"

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def main():
    # 1. Rebuild site
    print("==> Building site...")
    build_script = ROOT / "build.py"
    res = subprocess.run([sys.executable, str(build_script)])
    if res.returncode != 0:
        print("Build failed.")
        sys.exit(res.returncode)

    # 2. Serve ./site
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(SITE_DIR), **kwargs)

    url = f"http://localhost:{PORT}"
    print(f"\n==> Serving '{SITE_DIR}' at: {url}")
    print("==> Press Ctrl+C to stop the server.\n")

    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        with ReusableTCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    main()
