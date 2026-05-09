from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.exc import DBAPIError

from app.core.config import settings
from app.core.exceptions import AppError, NotFoundError
from app.repositories.appointment_repository import AppointmentRepository
from app.websocket.manager import ws_manager

CANDIDATES_TTL_SECONDS = 30
VALID_CLIENT_IDS = {1, 2}
VALID_OPERATION_TYPE_IDS = {1, 2}
VALID_VEHICLE_TYPE_IDS = {1, 2}

ERROR_METADATA: dict[str, tuple[str, int]] = {
    "INVALID_DATE": ("Fecha inválida", 409),
    "VALIDATION_ERROR": ("Error de validación", 400),
    "RESOURCE_NOT_FOUND": ("Recurso no encontrado", 404),
    "INVALID_STATUS_FOR_UPDATE": ("Estado inválido para actualizar", 409),
    "INVALID_STATUS_FOR_DELETE": ("Estado inválido para eliminar", 409),
    "INVALID_STATE_TRANSITION": ("Transición inválida", 409),
    "DOCK_BUSY": ("Muelle ocupado", 409),
    "OPERATORS_BUSY": ("Operarios ocupados", 409),
    "CANDIDATES_EXPIRED": ("Candidatos expirados", 409),
    "INVALID_PROCESS_START_AT": ("Inicio de proceso inválido", 409),
    "INVALID_PROCESS_END_AT": ("Fin de proceso inválido", 409),
    "INVALID_FINALIZED_AT": ("Fecha de finalización inválida", 409),
    "INVALID_CHECKOUT_AT": ("Fecha de checkout inválida", 409),
}


def _to_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def _parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return _normalize_datetime(value)
    return datetime.fromisoformat(str(value))


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
                "StandardTimeMinutes": 120,
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

    def _get(self, appointment_id: int) -> dict[str, Any]:
        item = self._appointments.get(appointment_id)
        if not item:
            raise NotFoundError("Cita no encontrada")
        return item

    def _validate_configuration(self, payload: dict[str, Any]) -> None:
        if payload["clientId"] not in VALID_CLIENT_IDS:
            raise AppError(
                "Configuración cliente-operación-vehículo inválida",
                error_code="VALIDATION_ERROR",
                status_code=400,
                details={"rule": "INVALID_CONFIGURATION"},
            )
        if payload["operationTypeId"] not in VALID_OPERATION_TYPE_IDS:
            raise AppError(
                "Configuración cliente-operación-vehículo inválida",
                error_code="VALIDATION_ERROR",
                status_code=400,
                details={"rule": "INVALID_CONFIGURATION"},
            )
        if payload["vehicleTypeId"] not in VALID_VEHICLE_TYPE_IDS:
            raise AppError(
                "Configuración cliente-operación-vehículo inválida",
                error_code="VALIDATION_ERROR",
                status_code=400,
                details={"rule": "INVALID_CONFIGURATION"},
            )

    def _validate_candidates_version(self, candidates_version: int) -> None:
        now_ts = int(datetime.now(UTC).timestamp())
        if candidates_version > now_ts + 5 or now_ts - candidates_version > CANDIDATES_TTL_SECONDS:
            raise AppError("Candidatos expirados", error_code="CANDIDATES_EXPIRED", status_code=409)

    def _ensure_real_update(self, item: dict[str, Any], payload: dict[str, Any]) -> None:
        has_real_change = any(
            [
                item["ClientId"] != payload["clientId"],
                item["OperationTypeId"] != payload["operationTypeId"],
                item["VehicleTypeId"] != payload["vehicleTypeId"],
                float(item["EstimatedTons"]) != float(payload["estimatedTons"]),
                item["ScheduledAt"] != _to_iso(payload["scheduledAt"]),
            ]
        )
        if not has_real_change:
            raise AppError(
                "La cita no tiene cambios para guardar",
                error_code="VALIDATION_ERROR",
                status_code=400,
                details={"rule": "NO_CHANGES_DETECTED"},
            )

    def dashboard_summary(self) -> dict[str, Any]:
        items = list(self._appointments.values())
        total = len(items)
        now = datetime.now(UTC)

        def count(status: str) -> int:
            return sum(1 for row in items if row["Status"] == status)

        def parse_dt(value: str | None) -> datetime | None:
            return datetime.fromisoformat(value) if value else None

        attended = count("ATENDIDA")
        completion = round((attended * 100.0 / total), 2) if total else 0

        alerts: list[dict[str, Any]] = []
        queue: list[dict[str, Any]] = []
        otc_compliant = 0
        ots_compliant = 0
        otc_total = 0
        ots_total = 0

        for item in items:
            arrival_at = parse_dt(item.get("ArrivalAt"))
            scheduled_at = parse_dt(item.get("ScheduledAt"))
            document_delivery_at = parse_dt(item.get("DocumentDeliveryAt"))
            process_start_at = parse_dt(item.get("ProcessStartAt"))
            process_end_at = parse_dt(item.get("ProcessEndAt"))
            finalized_at = parse_dt(item.get("FinalizedAt"))
            checkout_at = parse_dt(item.get("CheckoutAt"))
            standard_time = int(item.get("StandardTimeMinutes") or 0)

            assignment_delay = None
            if arrival_at and document_delivery_at:
                assignment_delay = max(int((document_delivery_at - arrival_at).total_seconds() // 60), 0)

            start_delay = None
            if document_delivery_at and process_start_at:
                start_delay = max(int((process_start_at - document_delivery_at).total_seconds() // 60), 0)

            checkout_delay = None
            if finalized_at and checkout_at:
                checkout_delay = max(int((checkout_at - finalized_at).total_seconds() // 60), 0)

            if arrival_at and scheduled_at and document_delivery_at:
                cumple_cita = arrival_at <= scheduled_at + timedelta(minutes=15)
                if cumple_cita:
                    otc_total += 1
                    base_time = max(arrival_at, scheduled_at)
                    if document_delivery_at <= base_time + timedelta(minutes=35):
                        otc_compliant += 1

            if process_start_at and process_end_at and standard_time > 0:
                ots_total += 1
                if int((process_end_at - process_start_at).total_seconds() // 60) <= standard_time:
                    ots_compliant += 1

            if item["Status"] == "EN_PATIO":
                alerts.append(
                    {
                        "appointmentId": item["Id"],
                        "type": "WAITING_ASSIGNMENT",
                        "severity": "MEDIUM",
                        "message": "Cita esperando asignación de recursos",
                    }
                )

            if item["Status"] == "EN_PROCESO" and process_start_at:
                elapsed_minutes = max(int((now - process_start_at).total_seconds() // 60), 0)
                if standard_time > 0 and elapsed_minutes > standard_time:
                    alerts.append(
                        {
                            "appointmentId": item["Id"],
                            "type": "DELAYED",
                            "severity": "HIGH",
                            "message": "Cita retrasada frente al tiempo estándar",
                        }
                    )
                elif standard_time > 0 and elapsed_minutes >= int(standard_time * 0.8):
                    alerts.append(
                        {
                            "appointmentId": item["Id"],
                            "type": "AT_RISK",
                            "severity": "MEDIUM",
                            "message": "Cita en riesgo de incumplir SLA",
                        }
                    )

            if item["Status"] in {"EN_PATIO", "ENTREGA_DOCUMENTOS", "EN_PROCESO"}:
                queue.append(
                    {
                        "appointmentId": item["Id"],
                        "status": item["Status"],
                        "queueScore": 1,
                    }
                )

            item["AssignmentDelayMinutes"] = assignment_delay
            item["StartDelayMinutes"] = start_delay
            item["CheckoutDelayMinutes"] = checkout_delay

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
            "completionRate": completion,
            "operationalState": {
                "activeResources": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO"),
                "activeOperations": count("EN_PATIO")
                + count("ENTREGA_DOCUMENTOS")
                + count("EN_PROCESO")
                + count("PARA_FIRMAR"),
            },
            "kpis": {
                "cumpleCitaRate": round((otc_total * 100.0 / total), 2) if total else 0,
                "otcRate": round((otc_compliant * 100.0 / otc_total), 2) if otc_total else None,
                "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None,
            },
            "slaMetrics": {
                "averageAssignmentDelayMinutes": self._average_metric(items, "AssignmentDelayMinutes"),
                "averageStartDelayMinutes": self._average_metric(items, "StartDelayMinutes"),
                "averageCheckoutDelayMinutes": self._average_metric(items, "CheckoutDelayMinutes"),
            },
            "queuePressure": {
                "activeCount": len(queue),
                "highestScore": max((row["queueScore"] for row in queue), default=0),
                "items": queue[:10],
            },
            "alerts": alerts[:10],
        }

    def _average_metric(self, items: list[dict[str, Any]], key: str) -> float | None:
        values = [row[key] for row in items if row.get(key) is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 2)

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
        generated_at = int(datetime.now(UTC).timestamp())
        return {
            "appointmentId": appointment_id,
            "version": generated_at,
            "generatedAt": generated_at,
            "expiresAt": generated_at + CANDIDATES_TTL_SECONDS,
            "ttlSeconds": CANDIDATES_TTL_SECONDS,
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
        self._validate_configuration(payload)
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
        item = self._get(appointment_id)
        if item["Status"] != "AGENDADA":
            raise AppError("Estado inválido para actualizar", error_code="INVALID_STATUS_FOR_UPDATE", status_code=409)
        self._validate_configuration(payload)
        self._ensure_real_update(item, payload)

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
        item = self._get(appointment_id)
        previous = item["Status"]
        item["Status"] = next_status
        item["Version"] = int(item["Version"]) + 1
        item["UpdatedAt"] = _to_iso(datetime.now(UTC))
        self._status_change(appointment_id, previous, next_status, user_id)
        return item

    def checkin(self, appointment_id: int, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "AGENDADA":
            raise AppError("Transición inválida", error_code="INVALID_STATE_TRANSITION", status_code=409)

        item["DriverName"] = payload["driverName"]
        item["DriverDocument"] = payload["driverDocument"]
        item["VehiclePlate"] = payload["vehiclePlate"]
        item["ArrivalAt"] = _to_iso(datetime.now(UTC))
        return self._transition(appointment_id, "EN_PATIO", user_id)

    def assign(self, appointment_id: int, dock_id: int, candidates_version: int, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "EN_PATIO":
            raise AppError("Transición inválida", error_code="INVALID_STATE_TRANSITION", status_code=409)
        self._validate_candidates_version(candidates_version)

        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "ENTREGA_DOCUMENTOS", user_id)

    def reassign(self, appointment_id: int, dock_id: int, candidates_version: int, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "EN_PROCESO":
            raise AppError("Transición inválida", error_code="INVALID_STATE_TRANSITION", status_code=409)
        self._validate_candidates_version(candidates_version)

        item["DockId"] = dock_id
        item["DockName"] = f"Muelle {dock_id}"
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def start_process(
        self,
        appointment_id: int,
        document_delivery_at: datetime,
        process_start_at: datetime,
        user_id: int,
    ) -> dict[str, Any]:
        item = self._get(appointment_id)
        if item["Status"] != "ENTREGA_DOCUMENTOS":
            raise AppError("Transición inválida", error_code="INVALID_STATE_TRANSITION", status_code=409)

        arrival_at = item.get("ArrivalAt")
        arrival_dt = datetime.fromisoformat(arrival_at) if arrival_at else None
        normalized_document_delivery = _normalize_datetime(document_delivery_at)
        normalized_process_start = _normalize_datetime(process_start_at)

        if arrival_dt and normalized_document_delivery < arrival_dt:
            raise AppError("Inicio de proceso inválido", error_code="INVALID_PROCESS_START_AT", status_code=409)
        if normalized_process_start < normalized_document_delivery:
            raise AppError("Inicio de proceso inválido", error_code="INVALID_PROCESS_START_AT", status_code=409)

        item["DocumentDeliveryAt"] = _to_iso(normalized_document_delivery)
        item["ProcessStartAt"] = _to_iso(normalized_process_start)
        return self._transition(appointment_id, "EN_PROCESO", user_id)

    def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["ProcessEndAt"] = _to_iso(process_end_at)
        return self._transition(appointment_id, "PARA_FIRMAR", user_id)

    def finalize(self, appointment_id: int, payload: dict[str, Any], user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["FinalizedAt"] = _to_iso(payload["finalizedAt"])
        item["MovedWeightKg"] = payload["movedWeightKg"]
        item["OtcNonComplianceReason"] = payload.get("otcNonComplianceReason")
        item["OtsNonComplianceReason"] = payload.get("otsNonComplianceReason")
        item["NonComplianceComment"] = payload.get("nonComplianceComment")
        return self._transition(appointment_id, "FINALIZADO", user_id)

    def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
        item["CheckoutAt"] = _to_iso(checkout_at)
        return self._transition(appointment_id, "ATENDIDA", user_id)

    def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int) -> dict[str, Any]:
        item = self._get(appointment_id)
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

    def _average_metric(self, items: list[dict[str, Any]], key: str) -> float | None:
        values = [row[key] for row in items if row.get(key) is not None]
        if not values:
            return None
        return round(sum(values) / len(values), 2)

    def _build_dashboard_summary(self, items: list[dict[str, Any]]) -> dict[str, Any]:
        total = len(items)
        now = datetime.now(UTC)

        def count(status: str) -> int:
            return sum(1 for row in items if row["Status"] == status)

        attended = count("ATENDIDA")
        completion_rate = round((attended * 100.0 / total), 2) if total else 0
        on_time_arrivals = 0
        on_time_candidates = 0
        otc_compliant = 0
        ots_compliant = 0
        ots_total = 0
        alerts: list[dict[str, Any]] = []
        queue_items: list[dict[str, Any]] = []

        for item in items:
            arrival_at = _parse_dt(item.get("ArrivalAt"))
            scheduled_at = _parse_dt(item.get("ScheduledAt"))
            document_delivery_at = _parse_dt(item.get("DocumentDeliveryAt"))
            process_start_at = _parse_dt(item.get("ProcessStartAt"))
            process_end_at = _parse_dt(item.get("ProcessEndAt"))
            finalized_at = _parse_dt(item.get("FinalizedAt"))
            checkout_at = _parse_dt(item.get("CheckoutAt"))
            assigned_at = _parse_dt(item.get("LastAssignedAt"))
            standard_time = int(item.get("StandardTimeMinutes") or 0)
            active_operator_count = int(item.get("ActiveOperatorCount") or 0)

            assignment_delay = None
            if arrival_at and assigned_at:
                assignment_delay = max(int((assigned_at - arrival_at).total_seconds() // 60), 0)

            start_delay = None
            if document_delivery_at and process_start_at:
                start_delay = max(int((process_start_at - document_delivery_at).total_seconds() // 60), 0)

            checkout_delay = None
            if finalized_at and checkout_at:
                checkout_delay = max(int((checkout_at - finalized_at).total_seconds() // 60), 0)

            item["AssignmentDelayMinutes"] = assignment_delay
            item["StartDelayMinutes"] = start_delay
            item["CheckoutDelayMinutes"] = checkout_delay

            cumple_cita = None
            if arrival_at and scheduled_at:
                on_time_candidates += 1
                cumple_cita = arrival_at <= scheduled_at + timedelta(minutes=15)
                if cumple_cita:
                    on_time_arrivals += 1

            if cumple_cita and document_delivery_at and arrival_at and scheduled_at:
                base_time = max(arrival_at, scheduled_at)
                if document_delivery_at <= base_time + timedelta(minutes=35):
                    otc_compliant += 1

            if process_start_at and process_end_at and standard_time > 0:
                ots_total += 1
                elapsed_minutes = max(int((process_end_at - process_start_at).total_seconds() // 60), 0)
                if elapsed_minutes <= standard_time:
                    ots_compliant += 1

            if item["Status"] == "EN_PATIO" and active_operator_count == 0:
                alerts.append(
                    {
                        "appointmentId": item["Id"],
                        "type": "WAITING_ASSIGNMENT",
                        "severity": "MEDIUM",
                        "message": "Cita esperando asignación de recursos",
                    }
                )

            if item["Status"] in {"ENTREGA_DOCUMENTOS", "EN_PROCESO"} and active_operator_count == 0:
                alerts.append(
                    {
                        "appointmentId": item["Id"],
                        "type": "NO_OPERATORS",
                        "severity": "HIGH",
                        "message": "Recurso activo sin operadores asignados",
                    }
                )

            if item["Status"] == "EN_PROCESO" and process_start_at and standard_time > 0:
                elapsed_minutes = max(int((now - process_start_at).total_seconds() // 60), 0)
                if elapsed_minutes > standard_time:
                    alerts.append(
                        {
                            "appointmentId": item["Id"],
                            "type": "DELAYED",
                            "severity": "HIGH",
                            "message": "Cita retrasada frente al tiempo estándar",
                        }
                    )
                elif elapsed_minutes >= int(standard_time * 0.8):
                    alerts.append(
                        {
                            "appointmentId": item["Id"],
                            "type": "AT_RISK",
                            "severity": "MEDIUM",
                            "message": "Cita en riesgo de incumplir SLA",
                        }
                    )

            if item["Status"] in {"EN_PATIO", "ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR"}:
                priority = 1
                if any(alert["appointmentId"] == item["Id"] and alert["severity"] == "HIGH" for alert in alerts):
                    priority = 4
                elif any(alert["appointmentId"] == item["Id"] for alert in alerts):
                    priority = 3

                queue_items.append(
                    {
                        "appointmentId": item["Id"],
                        "status": item["Status"],
                        "queueScore": priority,
                    }
                )

        queue_items.sort(key=lambda row: (-row["queueScore"], row["appointmentId"]))

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
            "completionRate": completion_rate,
            "operationalState": {
                "activeResources": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO"),
                "activeOperations": count("EN_PATIO")
                + count("ENTREGA_DOCUMENTOS")
                + count("EN_PROCESO")
                + count("PARA_FIRMAR"),
            },
            "kpis": {
                "cumpleCitaRate": round((on_time_arrivals * 100.0 / on_time_candidates), 2) if on_time_candidates else None,
                "otcRate": round((otc_compliant * 100.0 / on_time_arrivals), 2) if on_time_arrivals else None,
                "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None,
            },
            "slaMetrics": {
                "averageAssignmentDelayMinutes": self._average_metric(items, "AssignmentDelayMinutes"),
                "averageStartDelayMinutes": self._average_metric(items, "StartDelayMinutes"),
                "averageCheckoutDelayMinutes": self._average_metric(items, "CheckoutDelayMinutes"),
            },
            "queuePressure": {
                "activeCount": len(queue_items),
                "highestScore": max((row["queueScore"] for row in queue_items), default=0),
                "items": queue_items[:10],
            },
            "alerts": alerts[:10],
        }

    async def _broadcast_change(self, action: str, appointment_id: int, status: str | None, correlation_id: str) -> None:
        payload: dict[str, Any] = {
            "action": action,
            "appointmentId": appointment_id,
            "correlationId": correlation_id,
        }
        if status is not None:
            payload["status"] = status
        await ws_manager.broadcast("appointment-changed", payload)

    async def dashboard_summary(self) -> dict:
        try:
            items = await self.repository.get_operational_snapshot()
            return self._build_dashboard_summary(items)
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

    async def create(self, payload: dict, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                appointment_id = await self.repository.create_appointment(payload, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.create(payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("CREATE", data["Id"], data["Status"], correlation_id)
        return data

    async def update(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.update_appointment(appointment_id, payload, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                if not DEV_APPOINTMENTS_STORE.detail(appointment_id):
                    raise NotFoundError("Cita no encontrada") from exc
                data = DEV_APPOINTMENTS_STORE.update(appointment_id, payload)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("UPDATE", data["Id"], data["Status"], correlation_id)
        return data

    async def delete(self, appointment_id: int, user_id: int, correlation_id: str) -> None:
        try:
            async with self.repository.session.begin():
                await self.repository.delete_appointment(appointment_id, user_id, correlation_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                DEV_APPOINTMENTS_STORE.delete(appointment_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("DELETE", appointment_id, None, correlation_id)

    async def checkin(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.checkin(appointment_id, payload, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.checkin(appointment_id, payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("CHECKIN", data["Id"], data["Status"], correlation_id)
        return data

    async def assign(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        operator_ids = payload["seniorIds"] + payload.get("juniorIds", [])
        if len(operator_ids) != len(set(operator_ids)):
            raise AppError("Operadores repetidos", error_code="VALIDATION_ERROR", status_code=400)

        try:
            async with self.repository.session.begin():
                await self.repository.assign(
                    appointment_id,
                    payload["dockId"],
                    operator_ids,
                    payload["candidatesVersion"],
                    user_id,
                    correlation_id,
                )
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.assign(
                    appointment_id,
                    payload["dockId"],
                    payload["candidatesVersion"],
                    user_id,
                )
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("ASSIGN", data["Id"], data["Status"], correlation_id)
        return data

    async def reassign(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        operator_ids = payload["seniorIds"] + payload.get("juniorIds", [])
        if len(operator_ids) != len(set(operator_ids)):
            raise AppError("Operadores repetidos", error_code="VALIDATION_ERROR", status_code=400)

        try:
            async with self.repository.session.begin():
                await self.repository.reassign(
                    appointment_id,
                    payload["dockId"],
                    operator_ids,
                    payload["candidatesVersion"],
                    user_id,
                    correlation_id,
                )
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.reassign(
                    appointment_id,
                    payload["dockId"],
                    payload["candidatesVersion"],
                    user_id,
                )
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("REASSIGN", data["Id"], data["Status"], correlation_id)
        return data

    async def start_process(
        self,
        appointment_id: int,
        document_delivery_at: datetime,
        process_start_at: datetime,
        user_id: int,
        correlation_id: str,
    ) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.start_process(
                    appointment_id,
                    document_delivery_at,
                    process_start_at,
                    user_id,
                    correlation_id,
                )
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.start_process(
                    appointment_id,
                    document_delivery_at,
                    process_start_at,
                    user_id,
                )
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("START_PROCESS", data["Id"], data["Status"], correlation_id)
        return data

    async def to_sign(self, appointment_id: int, process_end_at: datetime, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.to_sign(appointment_id, process_end_at, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.to_sign(appointment_id, process_end_at, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("TO_SIGN", data["Id"], data["Status"], correlation_id)
        return data

    async def finalize(self, appointment_id: int, payload: dict, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.finalize(appointment_id, payload, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.finalize(appointment_id, payload, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("FINALIZE", data["Id"], data["Status"], correlation_id)
        return data

    async def checkout(self, appointment_id: int, checkout_at: datetime, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.checkout(appointment_id, checkout_at, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.checkout(appointment_id, checkout_at, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("CHECKOUT", data["Id"], data["Status"], correlation_id)
        return data

    async def cancel(self, appointment_id: int, cancellation_reason: str, user_id: int, correlation_id: str) -> dict:
        try:
            async with self.repository.session.begin():
                await self.repository.cancel(appointment_id, cancellation_reason, user_id, correlation_id)
            data = await self.detail(appointment_id)
        except DBAPIError as exc:
            if self._dev_mode and self._is_db_unavailable(exc):
                data = DEV_APPOINTMENTS_STORE.cancel(appointment_id, cancellation_reason, user_id)
            else:
                raise self._map_db_error(exc) from exc

        await self._broadcast_change("CANCEL", data["Id"], data["Status"], correlation_id)
        return data
