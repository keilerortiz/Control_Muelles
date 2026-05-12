import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = structlog.get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        started_at = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        if (
            not settings.log_health_checks
            and request.url.path in {"/health", "/ready"}
            and response.status_code < 500
        ):
            return response
        if duration_ms < settings.request_log_min_duration_ms and response.status_code < 400:
            return response
        logger.info(
            "http_request",
            endpoint=request.url.path,
            method=request.method,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        return response
