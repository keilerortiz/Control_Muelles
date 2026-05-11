from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.services.appointment_service_common import parse_dt


class AppointmentServiceDashboardMixin:
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
        on_time_arrivals = 0
        on_time_candidates = 0
        otc_compliant = 0
        ots_compliant = 0
        ots_total = 0
        alerts: list[dict[str, Any]] = []
        queue_items: list[dict[str, Any]] = []

        for item in items:
            arrival_at = parse_dt(item.get("ArrivalAt"))
            scheduled_at = parse_dt(item.get("ScheduledAt"))
            document_delivery_at = parse_dt(item.get("DocumentDeliveryAt"))
            process_start_at = parse_dt(item.get("ProcessStartAt"))
            process_end_at = parse_dt(item.get("ProcessEndAt"))
            finalized_at = parse_dt(item.get("FinalizedAt"))
            checkout_at = parse_dt(item.get("CheckoutAt"))
            assigned_at = parse_dt(item.get("LastAssignedAt"))
            standard_time = int(item.get("StandardTimeMinutes") or 0)
            active_operator_count = int(item.get("ActiveOperatorCount") or 0)
            item["AssignmentDelayMinutes"] = max(int((assigned_at - arrival_at).total_seconds() // 60), 0) if arrival_at and assigned_at else None
            item["StartDelayMinutes"] = max(int((process_start_at - document_delivery_at).total_seconds() // 60), 0) if document_delivery_at and process_start_at else None
            item["CheckoutDelayMinutes"] = max(int((checkout_at - finalized_at).total_seconds() // 60), 0) if finalized_at and checkout_at else None

            cumple_cita = None
            if arrival_at and scheduled_at:
                on_time_candidates += 1
                cumple_cita = arrival_at <= scheduled_at + timedelta(minutes=15)
                if cumple_cita:
                    on_time_arrivals += 1
            if cumple_cita and document_delivery_at and arrival_at and scheduled_at and document_delivery_at <= max(arrival_at, scheduled_at) + timedelta(minutes=35):
                otc_compliant += 1
            if process_start_at and process_end_at and standard_time > 0:
                ots_total += 1
                if max(int((process_end_at - process_start_at).total_seconds() // 60), 0) <= standard_time:
                    ots_compliant += 1
            if item["Status"] == "EN_PATIO" and active_operator_count == 0:
                alerts.append({"appointmentId": item["Id"], "type": "WAITING_ASSIGNMENT", "severity": "MEDIUM", "message": "Cita esperando asignación de recursos"})
            if item["Status"] in {"ENTREGA_DOCUMENTOS", "EN_PROCESO"} and active_operator_count == 0:
                alerts.append({"appointmentId": item["Id"], "type": "NO_OPERATORS", "severity": "HIGH", "message": "Recurso activo sin operadores asignados"})
            if item["Status"] == "EN_PROCESO" and process_start_at and standard_time > 0:
                elapsed_minutes = max(int((now - process_start_at).total_seconds() // 60), 0)
                if elapsed_minutes > standard_time:
                    alerts.append({"appointmentId": item["Id"], "type": "DELAYED", "severity": "HIGH", "message": "Cita retrasada frente al tiempo estándar"})
                elif elapsed_minutes >= int(standard_time * 0.8):
                    alerts.append({"appointmentId": item["Id"], "type": "AT_RISK", "severity": "MEDIUM", "message": "Cita en riesgo de incumplir SLA"})
            if item["Status"] in {"EN_PATIO", "ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR"}:
                priority = 4 if any(alert["appointmentId"] == item["Id"] and alert["severity"] == "HIGH" for alert in alerts) else 3 if any(alert["appointmentId"] == item["Id"] for alert in alerts) else 1
                queue_items.append({"appointmentId": item["Id"], "status": item["Status"], "queueScore": priority})

        queue_items.sort(key=lambda row: (-row["queueScore"], row["appointmentId"]))
        return {"total": total, "agendada": count("AGENDADA"), "en_patio": count("EN_PATIO"), "entrega_documentos": count("ENTREGA_DOCUMENTOS"), "en_proceso": count("EN_PROCESO"), "para_firmar": count("PARA_FIRMAR"), "finalizado": count("FINALIZADO"), "atendida": attended, "cancelada": count("OPERACION_CANCELADA"), "completionRate": round((attended * 100.0 / total), 2) if total else 0, "operationalState": {"activeResources": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO"), "activeOperations": count("EN_PATIO") + count("ENTREGA_DOCUMENTOS") + count("EN_PROCESO") + count("PARA_FIRMAR")}, "kpis": {"cumpleCitaRate": round((on_time_arrivals * 100.0 / on_time_candidates), 2) if on_time_candidates else None, "otcRate": round((otc_compliant * 100.0 / on_time_arrivals), 2) if on_time_arrivals else None, "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None}, "slaMetrics": {"averageAssignmentDelayMinutes": self._average_metric(items, "AssignmentDelayMinutes"), "averageStartDelayMinutes": self._average_metric(items, "StartDelayMinutes"), "averageCheckoutDelayMinutes": self._average_metric(items, "CheckoutDelayMinutes")}, "queuePressure": {"activeCount": len(queue_items), "highestScore": max((row["queueScore"] for row in queue_items), default=0), "items": queue_items[:10]}, "alerts": alerts[:10]}
