from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_context import RequestContextMiddleware
from app.websocket.manager import ws_manager

configure_logging()

app = FastAPI(title=settings.app_name, debug=settings.app_debug)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(ErrorHandlerMiddleware)

app.include_router(api_router)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse(content={"status": "UP", "database": "CONNECTED"})


@app.websocket("/ws/dashboard-update")
async def dashboard_socket(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        ws_manager.disconnect(websocket)
