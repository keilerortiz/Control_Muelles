from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.exc import DBAPIError

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError
from app.repositories.appointment_repository import AppointmentRepository
from app.websocket.manager import ws_manager


def _to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


class _InMemoryAppointmentsStore:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        scheduled = now + timedelta(hours=2)
        self._next_id = 2
        self._appointments: dict[int, dict[str, Any]] = {
            1: {
                "Id": 1,
                "ClientId": 1,
                "ClientName": "Cliente A",
                "OperationTypeId": 1,
                "OperationTypeName": "Descargue",
                "VehicleTypeId": 1,
                "VehicleTypeName": "Camion Sencillo",
                "DriverName": None,
                "DriverDocument": None,
                "VehiclePlate": "DEV123",
                "EstimatedTons": 10.0,
                "DockId": None,
                "DockName": None,
                "Status": "AGENDADA",
                "ScheduledAt": _to_iso(scheduled),
                "ArrivalAt": None,
                "DocumentDeliveryAt": None,
                "ProcessStartAt": None,
                "ProcessEndAt": None,
                "FinalizedAt": None,
                "CheckoutAt": None,
                "CancelledAt": None,
                "Remissions": None,
                "Precincts": None,
                "MovedWeightKg": None,
                "NonComplianceComment": None,
                "OtcNonComplianceReason": None,
                "OtsNonComplianceReason": None,
                "CancellationReason": None,
                "IsNoShow": False,
                "IsLateArrival": False,
                "LateArrivalMinutes": None,
                "Version": 1,
                "CreatedAt": _to_iso(now),
                "UpdatedAt": _to_iso(now),
            }
        }
        self._status_logs: dict[int, list[dict[str, Any]]] = {
            1: [
                {
                    "Id": 1,
                    "AppointmentId": 1,
                    "PreviousStatus": None,
                    "NewStatus": "AGENDADA",
                    "ChangedByUserId": 1,
                    "ChangedAt": _to_iso(now),
                    "CorrelationId": None,
                }
            ]
        }

    def _match(self, item: dict[str, Any], search: str | None, status: str | None) -> bool:
        if status and item["Status"] != status:
            return False
        if not search:
            return True

        term = search.lower().strip()
        client = (item.get("ClientName") or "").lower()
        plate = (item.get("VehiclePlate") or "").lower()
        return term in client or term in plate

    def _status_change(self, appointment_id: int, previous: str | None, new: str, user_id: int) -> None:
        logs = self._status_logs.setdefault(appointment_id, [])
        logs.append(
            {
                "Id": len(logs) + 1,
                "AppointmentId": appointment_id,
                "PreviousStatus": previous,
                "NewStatus": new,
                "ChangedByUserId": user_id,
                "ChangedAt": _to_iso(datetime.now(UTC)),
                "CorrelationId": None,
            }
        )

    def dashboard_summary(self) -> dict[str, Any]:
        items = list(self._appointments.values())
        total = len(items)

        def count(status: str) -> int:
            return sum(1 for row in items if row["Status"] == status)

        attended = count("ATENDIDA")
        completion = round((attended * 100.0 / total), 2) if total else 0

        return {
            "total": total,
            "agendada": count("AGENDADA"),
            "en_patio": count("EN_PATIO"),
            "entrega_documentos": count("ENTREGA_DOCUMENTOS"),
            "en_proceso": count("EN_PROCESO"),
            "para_firmar": count("PARA_FIRMAR"),
            "finalizado": count("FINALIZADO"),
            "atendida": attended,
            "cancelada": count("OPERACION_CANCELADA"),
            "completion_rate": completion,
        }

    def list_items(self, skip: int, take: int, search: str | None, status: str | None) -> dict[str, Any]:
        filtered = [row for row in self._appointments.values() if self._match(row, search, status)]
        filtered.sort(key=lambda item: item["ScheduledAt"], reverse=True)
        return {
            "items": filtered[skip : skip + take],
            "total": len(filtered),
            "skip": skip,
            "take": take,
        }

    def detail(self, appointment_id: int) -> dict[str, Any] | None:
        return self._appointments.get(appointment_id)

    def status_log(self, appointment_id: int) -> list[dict[str, Any]]:
        return self._status_logs.get(appointment_id, [])

    def candidates(self, appointment_id: int) -> dict[str, Any]:
        return {
            "appointmentId": appointment_id,
            "version": int(datetime.now(UTC).timestamp()),
            "docks": [
                {"Id": 1, "Name": "Muelle 1"},
                {"Id": 2, "Name": "Muelle 2"},
                {"Id": 3, "Name": "Muelle 3"},
            ],
            "operators": [
                {
                    "Id": 1,
                    "Name": "Operario Senior 1",
                    "OperatorLevel": "SENIOR",
                    "MaxConcurrentOperations": 1,
                    "ActiveAssignments": 0,
                },
                {
                    "Id": 2,
                    "Name": "Operario Junior 1",
                    "OperatorLevel": "JUNIOR",
                    "MaxConcurrentOperations": 1,
                    "ActiveAssignments": 0,
                },
            ],
        }

    def create(self, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        now = datetime.now(UTC)
        appointment_id = self._next_id
        self._next_id += 1

        item = {
            "Id": appointment_id,
            "ClientId": payload["clientId"],
            "ClientName": f"Cliente {payload['clientId']}",
            "OperationTypeId": payload["operationTypeId"],
            "OperationTypeName": "Descargue",
            "VehicleTypeId": payload["vehicleTypeId"],
            "VehicleTypeName": "Camion Sencillo",
            "DriverName": None,
            "DriverDocument": None,
            "VehiclePlate": f"DEV{appointment_id}",
            "EstimatedTons": payload["estimatedTons"],
            "DockId": None,
            "DockName": None,
            "Status": "AGENDADA",
            "ScheduledAt": _to_iso(payload["scheduledAt"]),
            "ArrivalAt": None,
            "DocumentDeliveryAt": None,
            "ProcessStartAt": None,
            "ProcessEndAt": None,
            "FinalizedAt": None,
            "CheckoutAt": None,
            "CancelledAt": None,
            "Remissions": None,
            "Precincts": None,
            "MovedWeightKg": None,
            "NonComplianceComment": None,
            "OtcNonComplianceReason": None,
            "OtsNonComplianceReason": None,
            "CancellationReason": None,
            "IsNoShow": False,
            "IsLateArrival": False,
            "LateArrivalMinutes": None,
            "Version": 1,
            "CreatedAt": _to_iso(now),
            "UpdatedAt": _to_iso(now),
        }

        self._appointments[appointment_id] = item
        self._status_logs[appointment_id] = []
        self._status_change(appointment_id, None, "AGENDADA", user_id)
        return item

    def update(self, appointment_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["ClientId"] = payload["clientId"]
        item["ClientName"] = f"Cliente {payload['clientId']}"
        item["OperationTypeId"] = payload["operationTypeId"]
        item["VehicleTypeId"] = payload["vehicleTypeId"]
        item["EstimatedTons"] = payload["estimatedTons"]
        item["ScheduledAt"] = _to_iso(payload["scheduledAt"])
        item["Version"] = int(item["Version"]) + 1
        item["UpdatedAt"] = _to_iso(datetime.now(UTC))
        return item

    def delete(self, appointment_id: int) -> None:
        self._appointments.pop(appointment_id, None)
        self._status_logs.pop(appointment_id, None)

    def _transition(self, appointment_id: int, next_status: str, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        previous = item["Status"]
        item["Status"] = next_status
        item["Version"] = int(item["Version"]) + 1
        item["UpdatedAt"] = _to_iso(datetime.now(UTC))
        self._status_change(appointment_id, previous, next_status, user_id)
        return item

    def checkin(self, appointment_id: int, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["DriverName"] = payload["driverName"]
        item["DriverDocument"] = payload["driverDocument"]
        item["VehiclePlate"] = payload["vehiclePlate"]
        item["ArrivalAt"] = _to_iso(datetime.now(UTC))
        return self._transition(appointment_id, "EN_PATIO", user_id)

    def assign(self, appointment_id: int, dock_id: int, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "ENTREGA_DOCUMENTOS", user_id)

    def reassign(self, appointment_id: int, dock_id: int, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def start_process(self, appointment_id: int, process_start_at: datetime, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["DocumentDeliveryAt"] = item["DocumentDeliveryAt"] or _to_iso(datetime.now(UTC))
        item["ProcessStartAt"] = _to_iso(process_start_at)
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["ProcessEndAt"] = _to_iso(process_end_at)
        return self._transition(appointment_id, "PARA_FIRMAR", user_id)

    def finalize(self, appointment_id: int, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["FinalizedAt"] = _to_iso(payload["finalizedAt"])
        item["MovedWeightKg"] = payload["movedWeightKg"]
        item["OtcNonComplianceReason"] = payload.get("otcNonComplianceReason")
        item["OtsNonComplianceReason"] = payload.get("otsNonComplianceReason")
        item["NonComplianceComment"] = payload.get("nonComplianceComment")
        return self._transition(appointment_id, "FINALIZADO", user_id)

    def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["CheckoutAt"] = _to_iso(checkout_at)
        return self._transition(appointment_id, "ATENDIDA", user_id)

    def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int) -> dict[str, Any]:
        item = self._appointments[appointment_id]
        item["CancellationReason"] = cancellation_reason
        item["CancelledAt"] = _to_iso(datetime.now(UTC))
        return self._transition(appointment_id, "OPERACION_CANCELADA", user_id)


DEV_APPOINTMENTS_STORE = _InMemoryAppointmentsStore()


class AppointmentService:
    def __init__(self, repository: AppointmentRepository) -> None:
        self.repository = repository
        self._dev_mode = settings.app_env.lower() == "development"

    def _map_db_error(self, exc: DBAPIError) -> AppError:
        message = str(exc.orig) if exc.orig else str(exc)
        known_codes = [
            "INVALID_DATE",
            "VALIDATION_ERROR",
            "RESOURCE_NOT_FOUND",
            "INVALID_STATUS_FOR_UPDATE",
            "INVALID_STATUS_FOR_DELETE",
            "INVALID_STATE_TRANSITION",
            "DOCK_BUSY",
            "OPERATORS_BUSY",
            "INVALID_PROCESS_START_AT",
            "INVALID_PROCESS_END_AT",
            "INVALID_FINALIZED_AT",
            "INVALID_CHECKOUT_AT",
        ]
        for code in known_codes:
            if code in message:
                return AppError(message=code.replace("_", " ").title(), error_code=code, status_code=409)
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

    async def dashboard_summary(self) -> dict:
        try:
            return await self.repository.get_dashboard_summary()
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.dashboard_summary()
            raise

    async def list_appointments(self, skip: int, take: int, search: str | None, status: str | None) -> dict:
        try:
            items = await self.repository.list_appointments(skip=skip, take=take, search=search, status=status)
            total = await self.repository.count_appointments(search=search, status=status)
            return {"items": items, "total": total, "skip": skip, "take": take}
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                return DEV_APPOINTMENTS_STORE.list_items(skip=skip, take=take, search=search, status=status)
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

    async def create(self, payload: dict, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                appointment_id = await self.repository.create_appointment(payload, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.create(payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "CREATE", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def update(self, appointment_id: int, payload: dict, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.update_appointment(appointment_id, payload, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.update(appointment_id, payload)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "UPDATE", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def delete(self, appointment_id: int, user_id: int) -> None:
        try:
            async with self.repository.session.begin():
                await self.repository.delete_appointment(appointment_id, user_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                DEV_APPOINTMENTS_STORE.delete(appointment_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast("appointment-changed", {"action": "DELETE", "appointmentId": appointment_id})

    async def checkin(self, appointment_id: int, payload: dict, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.checkin(appointment_id, payload, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.checkin(appointment_id, payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "CHECKIN", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def assign(self, appointment_id: int, payload: dict, user_id: int) -> dict:
        operator_ids = payload["seniorIds"] + payload.get("juniorIds", [])
        if len(operator_ids) != len(set(operator_ids)):
            raise AppError("Operadores repetidos", error_code="VALIDATION_ERROR", status_code=400)

        try:
            async with self.repository.session.begin():
                await self.repository.assign(appointment_id, payload["dockId"], operator_ids, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.assign(appointment_id, payload["dockId"], user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "ASSIGN", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def reassign(self, appointment_id: int, payload: dict, user_id: int) -> dict:
        operator_ids = payload["seniorIds"] + payload.get("juniorIds", [])
        if len(operator_ids) != len(set(operator_ids)):
            raise AppError("Operadores repetidos", error_code="VALIDATION_ERROR", status_code=400)

        try:
            async with self.repository.session.begin():
                await self.repository.reassign(appointment_id, payload["dockId"], operator_ids, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.reassign(appointment_id, payload["dockId"], user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "REASSIGN", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def start_process(self, appointment_id: int, process_start_at: datetime, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.start_process(appointment_id, process_start_at, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.start_process(appointment_id, process_start_at, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "START_PROCESS", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.to_sign(appointment_id, process_end_at, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.to_sign(appointment_id, process_end_at, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "TO_SIGN", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def finalize(self, appointment_id: int, payload: dict, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.finalize(appointment_id, payload, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.finalize(appointment_id, payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "FINALIZE", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.checkout(appointment_id, checkout_at, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.checkout(appointment_id, checkout_at, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "CHECKOUT", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data

    async def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.cancel(appointment_id, cancellation_reason, user_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.cancel(appointment_id, cancellation_reason, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await ws_manager.broadcast(
            "appointment-changed",
            {"action": "CANCEL", "appointmentId": data["Id"], "status": data["Status"]},
        )
        return data
