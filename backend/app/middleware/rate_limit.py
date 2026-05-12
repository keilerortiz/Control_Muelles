from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60.0
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.last_cleanup = time.monotonic()

    async def dispatch(self, request: Request, call_next):
        if self.requests_per_minute <= 0 or self._is_exempt(request):
            return await call_next(request)

        now = time.monotonic()
        if now - self.last_cleanup > self.window_seconds:
            self._cleanup(now)

        key = self._client_key(request)
        timestamps = self.requests[key]
        self._trim_window(timestamps, now)

        if len(timestamps) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "message": "Demasiadas solicitudes",
                    "data": None,
                    "error": {"code": "RATE_LIMIT_EXCEEDED", "details": {}},
                    "correlationId": getattr(request.state, "request_id", None),
                },
                headers={"Retry-After": "60"},
            )

        timestamps.append(now)
        return await call_next(request)

    def _is_exempt(self, request: Request) -> bool:
        return request.method == "OPTIONS" or request.url.path in {"/health", "/ready"}

    def _client_key(self, request: Request) -> str:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",", 1)[0].strip()
        return request.client.host if request.client else "unknown"

    def _trim_window(self, timestamps: deque[float], now: float) -> None:
        while timestamps and now - timestamps[0] > self.window_seconds:
            timestamps.popleft()

    def _cleanup(self, now: float) -> None:
        for key in list(self.requests):
            self._trim_window(self.requests[key], now)
            if not self.requests[key]:
                self.requests.pop(key, None)
        self.last_cleanup = now
