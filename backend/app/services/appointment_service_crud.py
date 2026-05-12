from __future__ import annotations

from sqlalchemy.exc import DBAPIError

from app.core.exceptions import AppError, NotFoundError
from app.services.appointment_dev_store import DEV_APPOINTMENTS_STORE


class AppointmentServiceCrudMixin:
    async def create(
        self, payload: dict, user_id: int, correlation_id: str, origin_client_id: str | None = None
    ) -> dict:
        try:
            async with self.repository.session.begin():
                appointment_id = await self.repository.create_appointment(
                    payload, user_id, correlation_id
                )
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.create(payload, user_id)
            else:
                raise self._map_db_error(exc) from exc
        await self._broadcast_change(
            "CREATE", data["Id"], data["Status"], correlation_id, origin_client_id
        )
        return data

    async def update(
        self,
        appointment_id: int,
        payload: dict,
        user_id: int,
        correlation_id: str,
        origin_client_id: str | None = None,
    ) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.update_appointment(
                    appointment_id, payload, user_id, correlation_id
                )
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.update(appointment_id, payload)
            else:
                raise self._map_db_error(exc) from exc
        await self._broadcast_change(
            "UPDATE", data["Id"], data["Status"], correlation_id, origin_client_id
        )
        return data

    async def delete(
        self,
        appointment_id: int,
        user_id: int,
        correlation_id: str,
        origin_client_id: str | None = None,
    ) -> None:
        try:
            async with self.repository.session.begin():
                await self.repository.delete_appointment(appointment_id, user_id, correlation_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                DEV_APPOINTMENTS_STORE.delete(appointment_id)
            else:
                raise self._map_db_error(exc) from exc
        await self._broadcast_change(
            "DELETE", appointment_id, None, correlation_id, origin_client_id
        )

    def _validate_operator_ids(self, payload: dict) -> list[int]:
        operator_ids = payload["seniorIds"] + payload.get("juniorIds", [])
        if len(operator_ids) != len(set(operator_ids)):
            raise AppError("Operadores repetidos", error_code="VALIDATION_ERROR", status_code=400)
        return operator_ids
