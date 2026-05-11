from __future__ import annotations

from datetime import datetime

from sqlalchemy.exc import DBAPIError

from app.services.appointment_dev_store import DEV_APPOINTMENTS_STORE


class AppointmentServiceActionsMixin:
    async def checkin(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("CHECKIN", appointment_id, correlation_id, lambda: self.repository.checkin(appointment_id, payload, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.checkin(appointment_id, payload, user_id))

    async def assign(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        operator_ids = self._validate_operator_ids(payload)
        return await self._run_state_change("ASSIGN", appointment_id, correlation_id, lambda: self.repository.assign(appointment_id, payload["dockId"], operator_ids, payload["candidatesVersion"], user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.assign(appointment_id, payload["dockId"], payload["candidatesVersion"], user_id))

    async def reassign(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        operator_ids = self._validate_operator_ids(payload)
        return await self._run_state_change("REASSIGN", appointment_id, correlation_id, lambda: self.repository.reassign(appointment_id, payload["dockId"], operator_ids, payload["candidatesVersion"], user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.reassign(appointment_id, payload["dockId"], payload["candidatesVersion"], user_id))

    async def start_process(self, appointment_id: int, document_delivery_at: datetime, process_start_at: datetime, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("START_PROCESS", appointment_id, correlation_id, lambda: self.repository.start_process(appointment_id, document_delivery_at, process_start_at, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.start_process(appointment_id, document_delivery_at, process_start_at, user_id))

    async def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("TO_SIGN", appointment_id, correlation_id, lambda: self.repository.to_sign(appointment_id, process_end_at, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.to_sign(appointment_id, process_end_at, user_id))

    async def finalize(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("FINALIZE", appointment_id, correlation_id, lambda: self.repository.finalize(appointment_id, payload, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.finalize(appointment_id, payload, user_id))

    async def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("CHECKOUT", appointment_id, correlation_id, lambda: self.repository.checkout(appointment_id, checkout_at, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.checkout(appointment_id, checkout_at, user_id))

    async def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int, correlation_id: str) -> dict:
        return await self._run_state_change("CANCEL", appointment_id, correlation_id, lambda: self.repository.cancel(appointment_id, cancellation_reason, user_id, correlation_id), lambda: DEV_APPOINTMENTS_STORE.cancel(appointment_id, cancellation_reason, user_id))

    async def _run_state_change(self, action: str, appointment_id: int, correlation_id: str, repository_call, fallback_call) -> dict:
        try:
            async with self.repository.session.begin():
                await repository_call()
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = fallback_call()
            else:
                raise self._map_db_error(exc) from exc
        await self._broadcast_change(action, data["Id"], data["Status"], correlation_id)
        return data
