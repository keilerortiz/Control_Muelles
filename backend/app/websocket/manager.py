import json

from fastapi import WebSocket


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
        dead: list[WebSocket] = []
        for connection in self.connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead.append(connection)
        for connection in dead:
            self.disconnect(connection)


ws_manager = ConnectionManager()
