from __future__ import annotations

from typing import Any

from sqlalchemy.exc import DBAPIError

from app.core.exceptions import AppError
from app.services.appointment_service_common import ERROR_METADATA
from app.websocket.manager import ws_manager


class AppointmentServiceHelpersMixin:
    def _map_db_error(self, exc: DBAPIError) -> AppError:
        message = str(exc.orig) if exc.orig else str(exc)
        for code, (friendly_message, status_code) in ERROR_METADATA.items():
            if code in message:
                details: dict[str, Any] = {}
                if "|" in message:
                    suffix = message.split("|", 1)[1].strip()
                    if suffix:
                        details["rule"] = suffix
                return AppError(
                    message=friendly_message,
                    error_code=code,
                    status_code=status_code,
                    details=details,
                )
        return AppError(message="Error de negocio", error_code="BUSINESS_ERROR", status_code=422)

    def _is_db_unavailable(self, exc: DBAPIError) -> bool:
        text = str(exc.orig) if exc.orig else str(exc)
        patterns = [
            "08001",
            "OperationalError",
            "Client unable to establish connection",
            "server is not found or not accessible",
            "Connection refused",
            "Invalid connection string attribute",
            "SSL Provider",
            "No hay credenciales disponibles",
        ]
        return any(pattern.lower() in text.lower() for pattern in patterns)

    async def _broadcast_change(
        self,
        action: str,
        appointment_id: int,
        status: str | None,
        correlation_id: str,
        origin_client_id: str | None = None,
    ) -> None:
        payload: dict[str, Any] = {
            "action": action,
            "appointmentId": appointment_id,
            "correlationId": correlation_id,
        }
        if origin_client_id:
            payload["originClientId"] = origin_client_id
        if status is not None:
            payload["status"] = status
        await ws_manager.broadcast("appointment-changed", payload)
