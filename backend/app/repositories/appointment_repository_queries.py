from __future__ import annotations

from datetime import datetime

from sqlalchemy import text


class AppointmentRepositoryQueriesMixin:
    async def get_active_operator_ids_by_level(self, appointment_id: int) -> dict[str, list[int]]:
        result = await self.session.execute(
            text(
                """
                SELECT
                    o.OperatorLevel,
                    o.Id AS OperatorId
                FROM dbo.tbl_AppointmentOperator ao
                INNER JOIN dbo.tbl_Operator o ON o.Id = ao.OperatorId
                WHERE ao.AppointmentId = :appointment_id
                  AND ao.IsActive = 1
                """
            ),
            {"appointment_id": appointment_id},
        )
        rows = [dict(item) for item in result.mappings().all()]
        return {
            "seniorIds": [row["OperatorId"] for row in rows if row.get("OperatorLevel") == "SENIOR"],
            "juniorIds": [row["OperatorId"] for row in rows if row.get("OperatorLevel") == "JUNIOR"],
        }

    def _dashboard_base_sql(self) -> str:
        return """
            WITH base AS (
                SELECT
                    a.Id,
                    a.Status,
                    a.ScheduledAt,
                    a.ArrivalAt,
                    a.DocumentDeliveryAt,
                    a.ProcessStartAt,
                    a.ProcessEndAt,
                    a.FinalizedAt,
                    a.CheckoutAt,
                    assignment_metrics.LastAssignedAt,
                    operator_metrics.ActiveOperatorCount,
                    COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes,
                    CASE
                        WHEN a.ArrivalAt IS NOT NULL AND assignment_metrics.LastAssignedAt IS NOT NULL
                        THEN CASE
                            WHEN DATEDIFF(MINUTE, a.ArrivalAt, assignment_metrics.LastAssignedAt) < 0 THEN 0
                            ELSE DATEDIFF(MINUTE, a.ArrivalAt, assignment_metrics.LastAssignedAt)
                        END
                    END AS AssignmentDelayMinutes,
                    CASE
                        WHEN a.DocumentDeliveryAt IS NOT NULL AND a.ProcessStartAt IS NOT NULL
                        THEN CASE
                            WHEN DATEDIFF(MINUTE, a.DocumentDeliveryAt, a.ProcessStartAt) < 0 THEN 0
                            ELSE DATEDIFF(MINUTE, a.DocumentDeliveryAt, a.ProcessStartAt)
                        END
                    END AS StartDelayMinutes,
                    CASE
                        WHEN a.FinalizedAt IS NOT NULL AND a.CheckoutAt IS NOT NULL
                        THEN CASE
                            WHEN DATEDIFF(MINUTE, a.FinalizedAt, a.CheckoutAt) < 0 THEN 0
                            ELSE DATEDIFF(MINUTE, a.FinalizedAt, a.CheckoutAt)
                        END
                    END AS CheckoutDelayMinutes
                FROM dbo.tbl_Appointment a
                INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                LEFT JOIN dbo.tbl_BusinessRule br
                    ON br.ClientId = a.ClientId
                   AND br.OperationTypeId = a.OperationTypeId
                   AND br.VehicleTypeId = a.VehicleTypeId
                   AND br.IsActive = 1
                LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                OUTER APPLY (
                    SELECT MAX(al.AssignedAt) AS LastAssignedAt
                    FROM dbo.tbl_AssignmentLog al
                    WHERE al.AppointmentId = a.Id
                ) assignment_metrics
                OUTER APPLY (
                    SELECT COUNT(1) AS ActiveOperatorCount
                    FROM dbo.tbl_AppointmentOperator ao
                    WHERE ao.AppointmentId = a.Id
                      AND ao.IsActive = 1
                ) operator_metrics
                WHERE a.IsDeleted = 0
                  AND (:date_from IS NULL OR a.ScheduledAt >= :date_from)
                  AND (:date_to IS NULL OR a.ScheduledAt <= :date_to)
            )
        """

    async def get_dashboard_summary(self, date_from=None, date_to=None) -> dict:
        params = {"date_from": date_from, "date_to": date_to}
        aggregate_result = await self.session.execute(
            text(
                self._dashboard_base_sql()
                + """
                SELECT
                    COUNT(1) AS total,
                    SUM(CASE WHEN Status = 'AGENDADA' THEN 1 ELSE 0 END) AS agendada,
                    SUM(CASE WHEN Status = 'EN_PATIO' THEN 1 ELSE 0 END) AS en_patio,
                    SUM(CASE WHEN Status = 'ENTREGA_DOCUMENTOS' THEN 1 ELSE 0 END) AS entrega_documentos,
                    SUM(CASE WHEN Status = 'EN_PROCESO' THEN 1 ELSE 0 END) AS en_proceso,
                    SUM(CASE WHEN Status = 'PARA_FIRMAR' THEN 1 ELSE 0 END) AS para_firmar,
                    SUM(CASE WHEN Status = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizado,
                    SUM(CASE WHEN Status = 'ATENDIDA' THEN 1 ELSE 0 END) AS atendida,
                    SUM(CASE WHEN Status = 'OPERACION_CANCELADA' THEN 1 ELSE 0 END) AS cancelada,
                    SUM(
                        CASE
                            WHEN Status = 'EN_PROCESO'
                              AND ProcessStartAt IS NOT NULL
                              AND StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) > StandardTimeMinutes
                            THEN 1 ELSE 0
                        END
                    ) AS retrasada,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL THEN 1 ELSE 0 END) AS on_time_candidates,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt) THEN 1 ELSE 0 END) AS on_time_arrivals,
                    SUM(CASE WHEN ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS ots_total,
                    SUM(CASE WHEN ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS ots_compliant,
                    SUM(
                        CASE
                            WHEN ArrivalAt IS NOT NULL
                              AND ScheduledAt IS NOT NULL
                              AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt)
                              AND DocumentDeliveryAt IS NOT NULL
                              AND DocumentDeliveryAt <= DATEADD(MINUTE, 35, CASE WHEN ArrivalAt > ScheduledAt THEN ArrivalAt ELSE ScheduledAt END)
                            THEN 1 ELSE 0
                        END
                    ) AS otc_compliant,
                    AVG(CAST(AssignmentDelayMinutes AS FLOAT)) AS averageAssignmentDelayMinutes,
                    AVG(CAST(StartDelayMinutes AS FLOAT)) AS averageStartDelayMinutes,
                    AVG(CAST(CheckoutDelayMinutes AS FLOAT)) AS averageCheckoutDelayMinutes
                FROM base
                """
            ),
            params,
        )
        aggregate = dict(aggregate_result.mappings().one())

        alerts_result = await self.session.execute(
            text(
                self._dashboard_base_sql()
                + """
                , alert_candidates AS (
                    SELECT Id AS appointmentId, 'WAITING_ASSIGNMENT' AS type, 'MEDIUM' AS severity, 'Cita esperando asignación de recursos' AS message
                    FROM base
                    WHERE Status = 'EN_PATIO' AND ActiveOperatorCount = 0
                    UNION ALL
                    SELECT Id, 'NO_OPERATORS', 'HIGH', 'Recurso activo sin operadores asignados'
                    FROM base
                    WHERE Status IN ('ENTREGA_DOCUMENTOS', 'EN_PROCESO') AND ActiveOperatorCount = 0
                    UNION ALL
                    SELECT Id, 'DELAYED', 'HIGH', 'Cita retrasada frente al tiempo estándar'
                    FROM base
                    WHERE Status = 'EN_PROCESO'
                      AND ProcessStartAt IS NOT NULL
                      AND StandardTimeMinutes > 0
                      AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) > StandardTimeMinutes
                    UNION ALL
                    SELECT Id, 'AT_RISK', 'MEDIUM', 'Cita en riesgo de incumplir SLA'
                    FROM base
                    WHERE Status = 'EN_PROCESO'
                      AND ProcessStartAt IS NOT NULL
                      AND StandardTimeMinutes > 0
                      AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) <= StandardTimeMinutes
                      AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) >= CAST(StandardTimeMinutes * 0.8 AS INT)
                )
                SELECT TOP 10 appointmentId, type, severity, message
                FROM alert_candidates
                ORDER BY CASE WHEN severity = 'HIGH' THEN 0 ELSE 1 END, appointmentId
                """
            ),
            params,
        )
        alerts = [dict(row) for row in alerts_result.mappings().all()]

        queue_stats_result = await self.session.execute(
            text(
                self._dashboard_base_sql()
                + """
                , queue AS (
                    SELECT
                        Id AS appointmentId,
                        Status AS status,
                        CASE
                            WHEN Status IN ('ENTREGA_DOCUMENTOS', 'EN_PROCESO') AND ActiveOperatorCount = 0 THEN 4
                            WHEN Status = 'EN_PROCESO'
                              AND ProcessStartAt IS NOT NULL
                              AND StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) > StandardTimeMinutes THEN 4
                            WHEN Status = 'EN_PATIO' AND ActiveOperatorCount = 0 THEN 3
                            WHEN Status = 'EN_PROCESO'
                              AND ProcessStartAt IS NOT NULL
                              AND StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) >= CAST(StandardTimeMinutes * 0.8 AS INT) THEN 3
                            ELSE 1
                        END AS queueScore
                    FROM base
                    WHERE Status IN ('EN_PATIO', 'ENTREGA_DOCUMENTOS', 'EN_PROCESO', 'PARA_FIRMAR')
                )
                SELECT COUNT(1) AS activeCount, COALESCE(MAX(queueScore), 0) AS highestScore
                FROM queue
                """
            ),
            params,
        )
        queue_stats = dict(queue_stats_result.mappings().one())

        queue_items_result = await self.session.execute(
            text(
                self._dashboard_base_sql()
                + """
                , queue AS (
                    SELECT
                        Id AS appointmentId,
                        Status AS status,
                        CASE
                            WHEN Status IN ('ENTREGA_DOCUMENTOS', 'EN_PROCESO') AND ActiveOperatorCount = 0 THEN 4
                            WHEN Status = 'EN_PROCESO'
                              AND ProcessStartAt IS NOT NULL
                              AND StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) > StandardTimeMinutes THEN 4
                            WHEN Status = 'EN_PATIO' AND ActiveOperatorCount = 0 THEN 3
                            WHEN Status = 'EN_PROCESO'
                              AND ProcessStartAt IS NOT NULL
                              AND StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) >= CAST(StandardTimeMinutes * 0.8 AS INT) THEN 3
                            ELSE 1
                        END AS queueScore
                    FROM base
                    WHERE Status IN ('EN_PATIO', 'ENTREGA_DOCUMENTOS', 'EN_PROCESO', 'PARA_FIRMAR')
                )
                SELECT TOP 10 appointmentId, status, queueScore
                FROM queue
                ORDER BY queueScore DESC, appointmentId ASC
                """
            ),
            params,
        )
        queue_items = [dict(row) for row in queue_items_result.mappings().all()]

        total = int(aggregate["total"] or 0)
        attended = int(aggregate["atendida"] or 0)
        on_time_candidates = int(aggregate["on_time_candidates"] or 0)
        on_time_arrivals = int(aggregate["on_time_arrivals"] or 0)
        ots_total = int(aggregate["ots_total"] or 0)
        ots_compliant = int(aggregate["ots_compliant"] or 0)
        otc_compliant = int(aggregate["otc_compliant"] or 0)

        def count_value(key: str) -> int:
            return int(aggregate[key] or 0)

        def average_value(key: str) -> float | None:
            value = aggregate.get(key)
            return round(float(value), 2) if value is not None else None

        return {
            "total": total,
            "agendada": count_value("agendada"),
            "en_patio": count_value("en_patio"),
            "entrega_documentos": count_value("entrega_documentos"),
            "en_proceso": count_value("en_proceso"),
            "para_firmar": count_value("para_firmar"),
            "retrasada": count_value("retrasada"),
            "finalizado": count_value("finalizado"),
            "atendida": attended,
            "cancelada": count_value("cancelada"),
            "completionRate": round((attended * 100.0 / total), 2) if total else 0,
            "operationalState": {
                "activeResources": count_value("en_patio") + count_value("entrega_documentos") + count_value("en_proceso"),
                "activeOperations": count_value("en_patio") + count_value("entrega_documentos") + count_value("en_proceso") + count_value("para_firmar"),
            },
            "kpis": {
                "cumpleCitaRate": round((on_time_arrivals * 100.0 / on_time_candidates), 2) if on_time_candidates else None,
                "otcRate": round((otc_compliant * 100.0 / on_time_arrivals), 2) if on_time_arrivals else None,
                "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None,
            },
            "slaMetrics": {
                "averageAssignmentDelayMinutes": average_value("averageAssignmentDelayMinutes"),
                "averageStartDelayMinutes": average_value("averageStartDelayMinutes"),
                "averageCheckoutDelayMinutes": average_value("averageCheckoutDelayMinutes"),
            },
            "queuePressure": {
                "activeCount": int(queue_stats["activeCount"] or 0),
                "highestScore": int(queue_stats["highestScore"] or 0),
                "items": queue_items,
            },
            "alerts": alerts,
        }

    async def list_appointments_page(
        self,
        skip: int,
        take: int,
        search: str | None,
        status: str | None,
        date_from=None,
        date_to=None,
    ) -> tuple[list[dict], int]:
        query = text(
            """
            SELECT *, COUNT(1) OVER() AS TotalRows
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
              AND (:date_from IS NULL OR ScheduledAt >= :date_from)
              AND (:date_to IS NULL OR ScheduledAt <= :date_to)
            ORDER BY ScheduledAt DESC
            OFFSET :skip ROWS FETCH NEXT :take ROWS ONLY
            OPTION (RECOMPILE)
            """
        )
        result = await self.session.execute(
            query,
            {
                "skip": skip,
                "take": take,
                "search": search,
                "status": status,
                "date_from": date_from,
                "date_to": date_to,
            },
        )
        rows = [dict(row) for row in result.mappings().all()]
        if not rows:
            return [], await self.count_appointments(
                search=search,
                status=status,
                date_from=date_from,
                date_to=date_to,
            )

        total = int(rows[0].pop("TotalRows"))
        for row in rows[1:]:
            row.pop("TotalRows", None)
        return rows, total

    async def count_appointments(self, search: str | None, status: str | None, date_from=None, date_to=None) -> int:
        query = text(
            """
            SELECT COUNT(1)
            FROM dbo.vw_AppointmentOperational
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
              AND (:date_from IS NULL OR ScheduledAt >= :date_from)
              AND (:date_to IS NULL OR ScheduledAt <= :date_to)
            """
        )
        result = await self.session.execute(
            query,
            {"search": search, "status": status, "date_from": date_from, "date_to": date_to},
        )
        return int(result.scalar_one())

    async def get_appointment(self, appointment_id: int) -> dict | None:
        result = await self.session.execute(
            text("SELECT * FROM dbo.vw_AppointmentOperational WHERE Id = :appointment_id"),
            {"appointment_id": appointment_id},
        )
        row = result.mappings().first()
        if not row:
            return None

        appointment = dict(row)
        operators_result = await self.session.execute(
            text(
                """
                WITH operator_source AS (
                    SELECT ao.OperatorId
                    FROM dbo.tbl_AppointmentOperator ao
                    WHERE ao.AppointmentId = :appointment_id
                      AND ao.IsActive = 1
                    UNION ALL
                    SELECT ao.OperatorId
                    FROM dbo.tbl_AppointmentOperator ao
                    WHERE ao.AppointmentId = :appointment_id
                      AND ao.IsActive = 0
                      AND NOT EXISTS (
                          SELECT 1
                          FROM dbo.tbl_AppointmentOperator active_ao
                          WHERE active_ao.AppointmentId = :appointment_id
                            AND active_ao.IsActive = 1
                      )
                      AND ao.ReleasedAt = (
                          SELECT MAX(last_ao.ReleasedAt)
                          FROM dbo.tbl_AppointmentOperator last_ao
                          WHERE last_ao.AppointmentId = :appointment_id
                            AND last_ao.IsActive = 0
                      )
                )
                SELECT
                    o.OperatorLevel,
                    o.Name
                FROM operator_source os
                INNER JOIN dbo.tbl_Operator o ON o.Id = os.OperatorId
                ORDER BY o.OperatorLevel DESC, o.Name ASC
                """
            ),
            {"appointment_id": appointment_id},
        )
        operators = [dict(item) for item in operators_result.mappings().all()]
        seniors = [item["Name"] for item in operators if item.get("OperatorLevel") == "SENIOR"]
        juniors = [item["Name"] for item in operators if item.get("OperatorLevel") == "JUNIOR"]

        appointment["SeniorOperators"] = ", ".join(seniors) if seniors else None
        appointment["JuniorOperators"] = ", ".join(juniors) if juniors else None
        return appointment

    async def get_status_log(self, appointment_id: int) -> list[dict]:
        result = await self.session.execute(
            text(
                """
                SELECT
                    l.Id,
                    l.AppointmentId,
                    l.PreviousStatus,
                    l.NewStatus,
                    l.ChangedByUserId,
                    u.Name AS ChangedByUserName,
                    l.ChangedAt,
                    l.CorrelationId
                FROM dbo.vw_AppointmentStatusLog l
                LEFT JOIN dbo.tbl_User u ON u.Id = l.ChangedByUserId
                WHERE AppointmentId = :appointment_id
                ORDER BY l.ChangedAt ASC
                """
            ),
            {"appointment_id": appointment_id},
        )
        return [dict(row) for row in result.mappings().all()]

    async def get_candidates(self, appointment_id: int) -> dict:
        dock_rows = await self.session.execute(
            text(
                """
                SELECT d.Id, d.Name
                FROM dbo.tbl_Dock d
                WHERE d.IsActive = 1
                  AND (
                      d.Id = (
                          SELECT a.DockId
                          FROM dbo.tbl_Appointment a
                          WHERE a.Id = :appointment_id
                            AND a.IsDeleted = 0
                      )
                      OR NOT EXISTS (
                          SELECT 1
                          FROM dbo.tbl_Appointment a
                          WHERE a.DockId = d.Id
                            AND a.IsDeleted = 0
                            AND a.Status IN ('ENTREGA_DOCUMENTOS', 'EN_PROCESO')
                            AND a.Id <> :appointment_id
                      )
                  )
                ORDER BY d.Name ASC
                """
            ),
            {"appointment_id": appointment_id},
        )
        operator_rows = await self.session.execute(
            text(
                """
                SELECT
                    oa.Id,
                    oa.Name,
                    oa.OperatorLevel,
                    oa.MaxConcurrentOperations,
                    oa.ActiveAssignments,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM dbo.tbl_AppointmentOperator ao
                            WHERE ao.AppointmentId = :appointment_id
                              AND ao.OperatorId = oa.Id
                              AND ao.IsActive = 1
                        ) THEN 1
                        ELSE 0
                    END AS IsAssigned
                FROM dbo.vw_OperatorAvailability
                oa
                WHERE oa.IsActive = 1
                  AND (
                      oa.ActiveAssignments < oa.MaxConcurrentOperations
                      OR EXISTS (
                          SELECT 1
                          FROM dbo.tbl_AppointmentOperator ao
                          WHERE ao.AppointmentId = :appointment_id
                            AND ao.OperatorId = oa.Id
                            AND ao.IsActive = 1
                      )
                  )
                ORDER BY IsAssigned DESC, oa.OperatorLevel DESC, oa.Name ASC
                """
            ),
            {"appointment_id": appointment_id},
        )
        generated_at = int(datetime.utcnow().timestamp())
        return {
            "appointmentId": appointment_id,
            "version": generated_at,
            "generatedAt": generated_at,
            "expiresAt": generated_at + 30,
            "ttlSeconds": 30,
            "docks": [dict(row) for row in dock_rows.mappings().all()],
            "operators": [dict(row) for row in operator_rows.mappings().all()],
        }
