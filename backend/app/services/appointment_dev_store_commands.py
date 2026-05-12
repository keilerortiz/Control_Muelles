from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.core.exceptions import AppError
from app.services.appointment_service_common import normalize_datetime, to_iso


class AppointmentDevStoreCommandsMixin:
    def _validate_scheduled_at(self, scheduled_at: datetime) -> None:
        normalized_scheduled = normalize_datetime(scheduled_at)
        now = datetime.now(UTC)
        if normalized_scheduled <= now:
            raise AppError(
                "La fecha programada debe ser futura", error_code="INVALID_DATE", status_code=400
            )

    def create(self, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        self._validate_configuration(payload)
        self._validate_scheduled_at(payload["scheduledAt"])
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
            "StandardTimeMinutes": 120,
            "DriverName": payload.get("driverName"),
            "DriverDocument": payload.get("driverDocument"),
            "VehiclePlate": payload.get("vehiclePlate"),
            "EstimatedTons": payload["estimatedTons"],
            "DockId": None,
            "DockName": None,
            "Status": "AGENDADA",
            "ScheduledAt": to_iso(payload["scheduledAt"]),
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
            "NonComplianceComment": payload.get("nonComplianceComment"),
            "OtcNonComplianceReason": None,
            "OtsNonComplianceReason": None,
            "CancellationReason": None,
            "IsNoShow": False,
            "IsLateArrival": False,
            "LateArrivalMinutes": None,
            "Version": 1,
            "CreatedAt": to_iso(now),
            "UpdatedAt": to_iso(now),
        }
        self._appointments[appointment_id] = item
        self._status_logs[appointment_id] = []
        self._status_change(appointment_id, None, "AGENDADA", user_id)
        return item

    def update(self, appointment_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "AGENDADA":
            raise AppError(
                "Estado invalido para actualizar",
                error_code="INVALID_STATUS_FOR_UPDATE",
                status_code=409,
            )
        self._validate_configuration(payload)
        self._validate_scheduled_at(payload["scheduledAt"])
        self._ensure_real_update(item, payload)
        item["ClientId"] = payload["clientId"]
        item["ClientName"] = f"Cliente {payload['clientId']}"
        item["OperationTypeId"] = payload["operationTypeId"]
        item["VehicleTypeId"] = payload["vehicleTypeId"]
        item["EstimatedTons"] = payload["estimatedTons"]
        item["ScheduledAt"] = to_iso(payload["scheduledAt"])
        item["DriverName"] = payload.get("driverName")
        item["DriverDocument"] = payload.get("driverDocument")
        item["VehiclePlate"] = payload.get("vehiclePlate")
        item["NonComplianceComment"] = payload.get("nonComplianceComment")
        item["Version"] = int(item["Version"]) + 1
        item["UpdatedAt"] = to_iso(datetime.now(UTC))
        return item

    def delete(self, appointment_id: int) -> None:
        self._appointments.pop(appointment_id, None)
        self._status_logs.pop(appointment_id, None)

    def checkin(self, appointment_id: int, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "AGENDADA":
            raise AppError(
                "Transicion invalida", error_code="INVALID_STATE_TRANSITION", status_code=409
            )
        item["DriverName"] = payload["driverName"]
        item["DriverDocument"] = payload["driverDocument"]
        item["VehiclePlate"] = payload["vehiclePlate"]
        item["ArrivalAt"] = to_iso(datetime.now(UTC))
        return self._transition(appointment_id, "EN_PATIO", user_id)

    def assign(
        self, appointment_id: int, dock_id: int, candidates_version: int, user_id: int
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "EN_PATIO":
            raise AppError(
                "Transicion invalida", error_code="INVALID_STATE_TRANSITION", status_code=409
            )
        self._validate_candidates_version(candidates_version)
        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "ENTREGA_DOCUMENTOS", user_id)

    def reassign(
        self, appointment_id: int, dock_id: int, candidates_version: int, user_id: int
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "EN_PROCESO":
            raise AppError(
                "Transicion invalida", error_code="INVALID_STATE_TRANSITION", status_code=409
            )
        self._validate_candidates_version(candidates_version)
        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def start_process(
        self,
        appointment_id: int,
        document_delivery_at: datetime,
        process_start_at: datetime,
        remissions: str,
        precincts: str,
        user_id: int,
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "ENTREGA_DOCUMENTOS":
            raise AppError(
                "Transicion invalida", error_code="INVALID_STATE_TRANSITION", status_code=409
            )
        normalized_document_delivery = normalize_datetime(document_delivery_at)
        normalized_process_start = normalize_datetime(process_start_at)
        if normalized_process_start < normalized_document_delivery:
            raise AppError(
                "Inicio de proceso invalido", error_code="INVALID_PROCESS_START_AT", status_code=409
            )
        if not remissions.strip() or not precincts.strip():
            raise AppError(
                "Remision y precintos son obligatorios",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )
        item["DocumentDeliveryAt"] = to_iso(normalized_document_delivery)
        item["ProcessStartAt"] = to_iso(normalized_process_start)
        item["Remissions"] = remissions.strip()
        item["Precincts"] = precincts.strip()
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def to_sign(
        self, appointment_id: int, process_end_at: datetime, user_id: int
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["ProcessEndAt"] = to_iso(process_end_at)
        return self._transition(appointment_id, "PARA_FIRMAR", user_id)

    def finalize(
        self, appointment_id: int, payload: dict[str, Any], user_id: int
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["FinalizedAt"] = to_iso(payload["finalizedAt"])
        item["MovedWeightKg"] = payload["movedWeightKg"]
        item["OtcNonComplianceReason"] = payload.get("otcNonComplianceReason")
        item["OtsNonComplianceReason"] = payload.get("otsNonComplianceReason")
        item["NonComplianceComment"] = payload.get("nonComplianceComment")
        return self._transition(appointment_id, "FINALIZADO", user_id)

    def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int) -> dict[str, Any]:
        self._get(appointment_id)["CheckoutAt"] = to_iso(checkout_at)
        return self._transition(appointment_id, "ATENDIDA", user_id)

    def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["CancellationReason"] = cancellation_reason
        item["CancelledAt"] = to_iso(datetime.now(UTC))
        return self._transition(appointment_id, "OPERACION_CANCELADA", user_id)
