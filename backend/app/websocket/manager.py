import asyncio
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, channel: str, payload: dict) -> None:
        if not self.connections:
            return
        message = json.dumps({"channel": channel, "payload": payload}, default=str)

        async def send(connection: WebSocket) -> WebSocket | None:
            try:
                await asyncio.wait_for(connection.send_text(message), timeout=5)
                return None
            except Exception:
                logger.warning("WebSocket send failed; connection will be removed", exc_info=True)
                return connection

        results = await asyncio.gather(
            *(send(connection) for connection in list(self.connections)),
            return_exceptions=True,
        )
        dead: list[WebSocket] = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning("Error sending WebSocket message: %s", result, exc_info=True)
                continue
            if result is not None:
                dead.append(result)
        for connection in dead:
            self.disconnect(connection)


ws_manager = ConnectionManager()
