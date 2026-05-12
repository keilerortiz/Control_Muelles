from __future__ import annotations

from sqlalchemy.exc import DBAPIError

from app.core.exceptions import NotFoundError
from app.services.appointment_dev_store import DEV_APPOINTMENTS_STORE


class AppointmentServiceReadsMixin:
    async def dashboard_summary(self, date_from=None, date_to=None) -> dict:
        try:
            return await self.repository.get_dashboard_summary(date_from=date_from, date_to=date_to)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.dashboard_summary(date_from=date_from, date_to=date_to)
            raise

    async def list_appointments(
        self,
        skip: int,
        take: int,
        search: str | None,
        status: str | None,
        date_from=None,
        date_to=None,
    ) -> dict:
        try:
            items, total = await self.repository.list_appointments_page(
                skip=skip,
                take=take,
                search=search,
                status=status,
                date_from=date_from,
                date_to=date_to,
            )
            return {"items": items, "total": total, "skip": skip, "take": take}
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.list_items(
                    skip=skip,
                    take=take,
                    search=search,
                    status=status,
                    date_from=date_from,
                    date_to=date_to,
                )
            raise

    async def detail(self, appointment_id: int) -> dict:
        try:
            appointment = await self.repository.get_appointment(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                appointment = DEV_APPOINTMENTS_STORE.detail(appointment_id)
            else:
                raise
        if not appointment:
            raise NotFoundError("Cita no encontrada")
        return appointment

    async def status_log(self, appointment_id: int) -> list[dict]:
        try:
            return await self.repository.get_status_log(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.status_log(appointment_id)
            raise

    async def candidates(self, appointment_id: int) -> dict:
        try:
            return await self.repository.get_candidates(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.candidates(appointment_id)
            raise
