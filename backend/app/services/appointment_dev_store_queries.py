from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.services.appointment_service_common import CANDIDATES_TTL_SECONDS


class AppointmentDevStoreQueriesMixin:
    def dashboard_summary(self, date_from=None, date_to=None) -> dict[str, Any]:
        items = [
            item
            for item in self._appointments.values()
            if self._match(item, search=None, status=None, date_from=date_from, date_to=date_to)
        ]
        total = len(items)
        now = datetime.now(UTC)

        def count(status: str) -> int:
            return sum(1 for row in items if row["Status"] == status)

        attended = count("ATENDIDA")
        alerts: list[dict[str, Any]] = []
        queue: list[dict[str, Any]] = []
        otc_compliant = 0
        ots_compliant = 0
        otc_total = 0
        ots_total = 0

        for item in items:
            arrival_at = datetime.fromisoformat(item["ArrivalAt"]) if item.get("ArrivalAt") else None
            scheduled_at = datetime.fromisoformat(item["ScheduledAt"]) if item.get("ScheduledAt") else None
            document_delivery_at = datetime.fromisoformat(item["DocumentDeliveryAt"]) if item.get("DocumentDeliveryAt") else None
            process_start_at = datetime.fromisoformat(item["ProcessStartAt"]) if item.get("ProcessStartAt") else None
            process_end_at = datetime.fromisoformat(item["ProcessEndAt"]) if item.get("ProcessEndAt") else None
            finalized_at = datetime.fromisoformat(item["FinalizedAt"]) if item.get("FinalizedAt") else None
            checkout_at = datetime.fromisoformat(item["CheckoutAt"]) if item.get("CheckoutAt") else None
            standard_time = int(item.get("StandardTimeMinutes") or 0)
            item["AssignmentDelayMinutes"] = max(int((document_delivery_at - arrival_at).total_seconds() // 60), 0) if arrival_at and document_delivery_at else None
            item["StartDelayMinutes"] = max(int((process_start_at - document_delivery_at).total_seconds() // 60), 0) if document_delivery_at and process_start_at else None
            item["CheckoutDelayMinutes"] = max(int((checkout_at - finalized_at).total_seconds() // 60), 0) if finalized_at and checkout_at else None

            if arrival_at and scheduled_at and document_delivery_at and arrival_at <= scheduled_at + timedelta(minutes=15):
                otc_total += 1
                if document_delivery_at <= max(arrival_at, scheduled_at) + timedelta(minutes=35):
                    otc_compliant += 1
            if process_start_at and process_end_at and standard_time > 0:
                ots_total += 1
                if int((process_end_at - process_start_at).total_seconds() // 60) <= standard_time:
                    ots_compliant += 1
            if item["Status"] == "EN_PATIO":
                alerts.append({"appointmentId": item["Id"], "type": "WAITING_ASSIGNMENT", "severity": "MEDIUM", "message": "Cita esperando asignacion de recursos"})
            if item["Status"] == "EN_PROCESO" and process_start_at:
                elapsed_minutes = max(int((now - process_start_at).total_seconds() // 60), 0)
                if standard_time > 0 and elapsed_minutes > standard_time:
                    alerts.append({"appointmentId": item["Id"], "type": "DELAYED", "severity": "HIGH", "message": "Cita retrasada frente al tiempo estandar"})
                elif standard_time > 0 and elapsed_minutes >= int(standard_time * 0.8):
                    alerts.append({"appointmentId": item["Id"], "type": "AT_RISK", "severity": "MEDIUM", "message": "Cita en riesgo de incumplir SLA"})
            if item["Status"] in {"EN_PATIO", "ENTREGA_DOCUMENTOS", "EN_PROCESO"}:
                queue.append({"appointmentId": item["Id"], "status": item["Status"], "queueScore": 1})

        return {"total": total, "agendada": count("AGENDADA"), "en_patio": count("EN_PATIO"), "entrega_documentos": count("ENTREGA_DOCUMENTOS"), "en_proceso": count("EN_PROCESO"), "para_firmar": count("PARA_FIRMAR"), "finalizado": count("FINALIZADO"), "atendida": attended, "cancelada": count("OPERACION_CANCELADA"), "completionRate": round((attended * 100.0 / total), 2) if total else 0, "operationalState": {"activeResources": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO"), "activeOperations": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO") + count("PARA_FIRMAR")}, "kpis": {"cumpleCitaRate": round((otc_total * 100.0 / total), 2) if total else 0, "otcRate": round((otc_compliant * 100.0 / otc_total), 2) if otc_total else None, "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None}, "slaMetrics": {"averageAssignmentDelayMinutes": self._average_metric(items, "AssignmentDelayMinutes"), "averageStartDelayMinutes": self._average_metric(items, "StartDelayMinutes"), "averageCheckoutDelayMinutes": self._average_metric(items, "CheckoutDelayMinutes")}, "queuePressure": {"activeCount": len(queue), "highestScore": max((row["queueScore"] for row in queue), default=0), "items": queue[:10]}, "alerts": alerts[:10]}

    def list_items(self, skip: int, take: int, search: str | None, status: str | None, date_from=None, date_to=None) -> dict[str, Any]:
        filtered = [
            row
            for row in self._appointments.values()
            if self._match(row, search, status, date_from=date_from, date_to=date_to)
        ]
        filtered.sort(key=lambda item: item["ScheduledAt"], reverse=True)
        return {"items": filtered[skip : skip + take], "total": len(filtered), "skip": skip, "take": take}

    def detail(self, appointment_id: int) -> dict[str, Any] | None:
        return self._appointments.get(appointment_id)

    def status_log(self, appointment_id: int) -> list[dict[str, Any]]:
        return self._status_logs.get(appointment_id, [])

    def candidates(self, appointment_id: int) -> dict[str, Any]:
        generated_at = int(datetime.now(UTC).timestamp())
        return {"appointmentId": appointment_id, "version": generated_at, "generatedAt": generated_at, "expiresAt": generated_at + CANDIDATES_TTL_SECONDS, "ttlSeconds": CANDIDATES_TTL_SECONDS, "docks": [{"Id": 1, "Name": "Muelle 1"}, {"Id": 2, "Name": "Muelle 2"}, {"Id": 3, "Name": "Muelle 3"}], "operators": [{"Id": 1, "Name": "Operario Senior 1", "OperatorLevel": "SENIOR", "MaxConcurrentOperations": 1, "ActiveAssignments": 0}, {"Id": 2, "Name": "Operario Junior 1", "OperatorLevel": "JUNIOR", "MaxConcurrentOperations": 1, "ActiveAssignments": 0}]}
