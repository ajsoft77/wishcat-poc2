#!/usr/bin/env python3
"""dist/ 정적 서버. 사용법: serve.py <port>

기본 http.server 와 같지만 HTML 은 매번 새로 확인하게 한다.
(빌드를 갱신해도 브라우저가 예전 화면을 보여 주는 일을 막는다.
 JS/CSS/이미지는 파일 이름에 해시가 붙으므로 오래 캐시해도 안전하다.)
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIST = Path(__file__).resolve().parent.parent / "dist"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split("?", 1)[0]
        if path.endswith("/") or path.endswith(".html"):
            self.send_header("Cache-Control", "no-cache")
        elif path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1])
    ThreadingHTTPServer(("0.0.0.0", port), partial(Handler, directory=str(DIST))).serve_forever()
