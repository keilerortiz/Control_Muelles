import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text
from starlette.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.session import engine
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_context import RequestContextMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    yield
    await engine.dispose()

app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    debug=settings.app_debug,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(LoggingMiddleware)
if settings.security_headers_enabled:
    app.add_middleware(SecurityHeadersMiddleware)
if settings.rate_limit_per_minute > 0:
    app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.rate_limit_per_minute)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=settings.gzip_minimum_size)
app.add_middleware(ErrorHandlerMiddleware)

app.include_router(api_router)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(content={"status": "UP"})


@app.get("/ready")
async def ready() -> JSONResponse:
    try:

        async def check_database() -> None:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))

        await asyncio.wait_for(check_database(), timeout=settings.db_health_timeout_seconds)
    except Exception:
        logger.exception("Unexpected error while checking database readiness")
        return JSONResponse(
            status_code=503,
            content={"status": "DOWN", "database": "DISCONNECTED"},
        )
    return JSONResponse(content={"status": "UP", "database": "CONNECTED"})


@app.websocket("/ws/dashboard-update")
async def dashboard_socket(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        logger.exception("Unexpected error in dashboard WebSocket")
        ws_manager.disconnect(websocket)
