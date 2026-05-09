import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from structlog.contextvars import bind_contextvars, clear_contextvars


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        clear_contextvars()
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        bind_contextvars(request_id=request_id, path=request.url.path, method=request.method)
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
