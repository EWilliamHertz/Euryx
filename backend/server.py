"""
Euryx backend = thin reverse proxy.

The kubernetes ingress routes external `/api/*` traffic to this service on
port 8001. The Euryx app actually lives in Next.js (port 3000) and defines
its API routes under `src/app/api/...`. We forward `/api/*` requests to the
Next.js custom server so the user's original Next.js API route structure
keeps working through the external preview URL.
"""
from __future__ import annotations

import os
import logging
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

NEXT_TARGET = os.environ.get("EURYX_NEXT_URL", "http://127.0.0.1:3000")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
log = logging.getLogger("euryx.proxy")

app = FastAPI(title="Euryx Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reusable async client
_client: httpx.AsyncClient | None = None

@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(base_url=NEXT_TARGET, timeout=30.0, follow_redirects=False)
    log.info("Euryx proxy -> %s", NEXT_TARGET)

@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length",
}

async def _proxy(request: Request, path: str) -> Response:
    assert _client is not None
    url = f"/api/{path}"
    body = await request.body()
    headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length"}
    }
    try:
        upstream = await _client.request(
            request.method,
            url,
            params=request.query_params,
            content=body if body else None,
            headers=headers,
        )
    except httpx.RequestError as e:
        log.error("Upstream error for %s %s: %s", request.method, url, e)
        return Response(content=b'{"error":"upstream_unreachable"}', status_code=502, media_type="application/json")

    resp_headers = {k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP}
    return Response(content=upstream.content, status_code=upstream.status_code, headers=resp_headers, media_type=upstream.headers.get("content-type"))


@app.get("/api/__proxy_health")
async def proxy_health() -> dict[str, Any]:
    return {"ok": True, "target": NEXT_TARGET}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path: str) -> Response:
    return await _proxy(request, path)
