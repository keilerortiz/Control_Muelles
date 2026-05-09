import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import AppError
from app.core.responses import error_response

logger = structlog.get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except AppError as exc:
            logger.warning("app_error", error_code=exc.error_code, message=exc.message)
            return error_response(
                message=exc.message,
                error_code=exc.error_code,
                correlation_id=request.state.request_id,
                status_code=exc.status_code,
                data=exc.details,
            )
        except Exception as exc:
            logger.exception(
                "unhandled_error",
                exception_type=type(exc).__name__,
                exception_message=str(exc),
            )
            return error_response(
                message="Error interno",
                error_code="SERVER_ERROR",
                correlation_id=request.state.request_id,
                status_code=500,
            )
