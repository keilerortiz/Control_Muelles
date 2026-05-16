import traceback

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.responses import error_response

logger = structlog.get_logger(__name__)


def _safe_log(level: str, event: str, **kwargs) -> None:
    """Log without crashing — structlog can fail on Windows with broken stdout."""
    try:
        getattr(logger, level)(event, **kwargs)
    except BaseException:
        pass


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except AppError as exc:
            if exc.status_code >= 500:
                _safe_log("error", "app_error", error_code=exc.error_code, message=exc.message)
            elif exc.status_code in (401, 403, 404):
                _safe_log("debug", "app_error", error_code=exc.error_code, message=exc.message)
            else:
                _safe_log("warning", "app_error", error_code=exc.error_code, message=exc.message)
            return error_response(
                message=exc.message,
                error_code=exc.error_code,
                correlation_id=request.state.request_id,
                status_code=exc.status_code,
                data=exc.details,
            )
        except Exception as exc:
            tb = traceback.format_exc()
            _safe_log(
                "error",
                "unhandled_error",
                exception_type=type(exc).__name__,
                exception_message=str(exc),
            )
            return error_response(
                message=f"Error interno: {type(exc).__name__}: {exc}",
                error_code="SERVER_ERROR",
                correlation_id=request.state.request_id,
                status_code=500,
                data={"traceback": tb} if settings.app_env == "development" else None,
            )
