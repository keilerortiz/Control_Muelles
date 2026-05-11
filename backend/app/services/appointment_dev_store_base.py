from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.exceptions import AppError, NotFoundError
from app.services.appointment_service_common import (
    CANDIDATES_TTL_SECONDS,
    parse_dt,
    to_iso,
)


class AppointmentDevStoreBase:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        scheduled = now + timedelta(hours=2)
        self._next_id = 2
        self._appointments: dict[int, dict[str, Any]] = {
            1: {
                "Id": 1, "ClientId": 1, "ClientName": "Cliente A", "OperationTypeId": 1, "OperationTypeName": "Descargue",
                "VehicleTypeId": 1, "VehicleTypeName": "Camion Sencillo", "StandardTimeMinutes": 120, "DriverName": None,
                "DriverDocument": None, "VehiclePlate": "DEV123", "EstimatedTons": 10.0, "DockId": None, "DockName": None,
                "Status": "AGENDADA", "ScheduledAt": to_iso(scheduled), "ArrivalAt": None, "DocumentDeliveryAt": None,
                "ProcessStartAt": None, "ProcessEndAt": None, "FinalizedAt": None, "CheckoutAt": None, "CancelledAt": None,
                "Remissions": None, "Precincts": None, "MovedWeightKg": None, "NonComplianceComment": None,
                "OtcNonComplianceReason": None, "OtsNonComplianceReason": None, "CancellationReason": None, "IsNoShow": False,
                "IsLateArrival": False, "LateArrivalMinutes": None, "Version": 1, "CreatedAt": to_iso(now), "UpdatedAt": to_iso(now),
            }
        }
        self._status_logs: dict[int, list[dict[str, Any]]] = {
            1: [{"Id": 1, "AppointmentId": 1, "PreviousStatus": None, "NewStatus": "AGENDADA", "ChangedByUserId": 1, "ChangedAt": to_iso(now), "CorrelationId": None}]
        }

    def _match(self, item: dict[str, Any], search: str | None, status: str | None, date_from=None, date_to=None) -> bool:
        if status and item["Status"] != status:
            return False
        scheduled_at = parse_dt(item.get("ScheduledAt"))
        if date_from and scheduled_at and scheduled_at < date_from:
            return False
        if date_to and scheduled_at and scheduled_at > date_to:
            return False
        if not search:
            return True
        term = search.lower().strip()
        return term in (item.get("ClientName") or "").lower() or term in (item.get("VehiclePlate") or "").lower()

    def _status_change(self, appointment_id: int, previous: str | None, new: str, user_id: int) -> None:
        logs = self._status_logs.setdefault(appointment_id, [])
        logs.append({"Id": len(logs) + 1, "AppointmentId": appointment_id, "PreviousStatus": previous, "NewStatus": new, "ChangedByUserId": user_id, "ChangedAt": to_iso(datetime.now(UTC)), "CorrelationId": None})

    def _get(self, appointment_id: int) -> dict[str, Any]:
        item = self._appointments.get(appointment_id)
        if not item:
            raise NotFoundError("Cita no encontrada")
        return item

    def _validate_configuration(self, payload: dict[str, Any]) -> None:
        if any(int(payload[key]) <= 0 for key in ("clientId", "operationTypeId", "vehicleTypeId")):
            raise AppError("Configuracion cliente-operacion-vehiculo invalida", error_code="VALIDATION_ERROR", status_code=400, details={"rule": "INVALID_CONFIGURATION"})

    def _validate_candidates_version(self, candidates_version: int) -> None:
        now_ts = int(datetime.now(UTC).timestamp())
        if candidates_version > now_ts + 5 or now_ts - candidates_version > CANDIDATES_TTL_SECONDS:
            raise AppError("Candidatos expirados", error_code="CANDIDATES_EXPIRED", status_code=409)

    def _ensure_real_update(self, item: dict[str, Any], payload: dict[str, Any]) -> None:
        has_real_change = any([item["ClientId"] != payload["clientId"], item["OperationTypeId"] != payload["operationTypeId"], item["VehicleTypeId"] != payload["vehicleTypeId"], float(item["EstimatedTons"]) != float(payload["estimatedTons"]), item["ScheduledAt"] != to_iso(payload["scheduledAt"])])
        if not has_real_change:
            raise AppError("La cita no tiene cambios para guardar", error_code="VALIDATION_ERROR", status_code=400, details={"rule": "NO_CHANGES_DETECTED"})

    def _average_metric(self, items: list[dict[str, Any]], key: str) -> float | None:
        values = [row[key] for row in items if row.get(key) is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 2)

    def _transition(self, appointment_id: int, next_status: str, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        previous = item["Status"]
        item["Status"] = next_status
        item["Version"] = int(item["Version"]) + 1
        item["UpdatedAt"] = to_iso(datetime.now(UTC))
        self._status_change(appointment_id, previous, next_status, user_id)
        return item
