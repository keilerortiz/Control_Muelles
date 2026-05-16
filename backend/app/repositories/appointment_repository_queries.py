from __future__ import annotations

from datetime import datetime

from sqlalchemy import text


class AppointmentRepositoryQueriesMixin:
    async def get_kpis_timeline(self, date_from=None, date_to=None) -> dict:
        result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT
                        a.Id,
                        a.Status,
                        a.ScheduledAt,
                        a.ArrivalAt,
                        a.DocumentDeliveryAt,
                        a.ProcessStartAt,
                        a.ProcessEndAt,
                        COALESCE(a.DocumentDeliveryAt, a.ScheduledAt) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS OtcBucketAt,
                        COALESCE(a.ProcessEndAt, a.ScheduledAt) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time' AS OtsBucketAt,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                ),
                otc_bucket AS (
                    SELECT
                        (DATEPART(HOUR, OtcBucketAt) / 2) * 2 AS bucket_start_hour,
                        SUM(
                            CASE
                                WHEN ArrivalAt IS NOT NULL
                                 AND ScheduledAt IS NOT NULL
                                 AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt)
                                THEN 1 ELSE 0
                            END
                        ) AS otc_total,
                        SUM(
                            CASE
                                WHEN ArrivalAt IS NOT NULL
                                 AND ScheduledAt IS NOT NULL
                                 AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt)
                                 AND DocumentDeliveryAt IS NOT NULL
                                 AND DocumentDeliveryAt <= DATEADD(MINUTE, 35, CASE WHEN ArrivalAt > ScheduledAt THEN ArrivalAt ELSE ScheduledAt END)
                                THEN 1 ELSE 0
                            END
                        ) AS otc_ok
                    FROM base
                    GROUP BY (DATEPART(HOUR, OtcBucketAt) / 2) * 2
                ),
                ots_bucket AS (
                    SELECT
                        (DATEPART(HOUR, OtsBucketAt) / 2) * 2 AS bucket_start_hour,
                        SUM(
                            CASE
                                WHEN ProcessStartAt IS NOT NULL
                                 AND ProcessEndAt IS NOT NULL
                                 AND StandardTimeMinutes > 0
                                 AND Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA')
                                THEN 1 ELSE 0
                            END
                        ) AS ots_total,
                        SUM(
                            CASE
                                WHEN ProcessStartAt IS NOT NULL
                                 AND ProcessEndAt IS NOT NULL
                                 AND StandardTimeMinutes > 0
                                 AND Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA')
                                 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes
                                THEN 1 ELSE 0
                            END
                        ) AS ots_ok
                    FROM base
                    GROUP BY (DATEPART(HOUR, OtsBucketAt) / 2) * 2
                )
                SELECT
                    h.bucket_start_hour,
                    CASE WHEN COALESCE(o.otc_total, 0) > 0 THEN CAST((o.otc_ok * 100.0) / o.otc_total AS FLOAT) ELSE 0 END AS otc_rate,
                    CASE WHEN COALESCE(s.ots_total, 0) > 0 THEN CAST((s.ots_ok * 100.0) / s.ots_total AS FLOAT) ELSE 0 END AS ots_rate
                FROM (
                    VALUES (0),(2),(4),(6),(8),(10),(12),(14),(16),(18),(20),(22)
                ) AS h(bucket_start_hour)
                LEFT JOIN otc_bucket o ON o.bucket_start_hour = h.bucket_start_hour
                LEFT JOIN ots_bucket s ON s.bucket_start_hour = h.bucket_start_hour
                ORDER BY h.bucket_start_hour
                """
            ),
            {"date_from": date_from, "date_to": date_to},
        )
        rows = [dict(row) for row in result.mappings().all()]
        bucket_map = {
            int(row["bucket_start_hour"]): {
                "otcRate": round(float(row["otc_rate"]), 2) if row.get("otc_rate") is not None else None,
                "otsRate": round(float(row["ots_rate"]), 2) if row.get("ots_rate") is not None else None,
            }
            for row in rows
        }
        buckets: list[dict] = []
        for hour in range(0, 24, 2):
            label = f"{hour:02d}:00"
            value = bucket_map.get(hour, {})
            otc = value.get("otcRate", 0)
            ots = value.get("otsRate", 0)
            buckets.append({"label": label, "hour": hour, "otcRate": otc, "otsRate": ots})
        return {"timezone": "America/Bogota", "buckets": buckets}

    async def get_operator_performance(self, date_from=None, date_to=None) -> dict:
        params = {"date_from": date_from, "date_to": date_to}
        result = await self.session.execute(
            text(
                self._dashboard_base_sql()
                + """
                , operator_source AS (
                    SELECT
                        src.AppointmentId,
                        src.OperatorId
                    FROM (
                        SELECT
                            ao.AppointmentId,
                            ao.OperatorId
                        FROM dbo.tbl_AppointmentOperator ao
                        WHERE ao.IsActive = 1
                        UNION ALL
                        SELECT
                            ao.AppointmentId,
                            ao.OperatorId
                        FROM dbo.tbl_AppointmentOperator ao
                        WHERE ao.IsActive = 0
                          AND NOT EXISTS (
                              SELECT 1
                              FROM dbo.tbl_AppointmentOperator active_ao
                              WHERE active_ao.AppointmentId = ao.AppointmentId
                                AND active_ao.IsActive = 1
                          )
                          AND ao.ReleasedAt = (
                              SELECT MAX(last_ao.ReleasedAt)
                              FROM dbo.tbl_AppointmentOperator last_ao
                              WHERE last_ao.AppointmentId = ao.AppointmentId
                                AND last_ao.IsActive = 0
                          )
                    ) src
                    GROUP BY src.AppointmentId, src.OperatorId
                ),
                appointment_ots AS (
                    SELECT
                        b.Id AS AppointmentId,
                        CASE
                            WHEN b.Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA')
                              AND b.ProcessStartAt IS NOT NULL
                              AND b.StandardTimeMinutes > 0
                            THEN 1
                            ELSE 0
                        END AS is_evaluable,
                        CASE
                            WHEN b.Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA')
                              AND b.ProcessStartAt IS NOT NULL
                              AND b.StandardTimeMinutes > 0
                              AND DATEDIFF(MINUTE, b.ProcessStartAt, COALESCE(b.ProcessEndAt, SYSUTCDATETIME())) <= b.StandardTimeMinutes
                            THEN 1
                            ELSE 0
                        END AS is_compliant,
                        CASE
                            WHEN b.Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA')
                              AND b.ProcessStartAt IS NOT NULL
                              AND b.StandardTimeMinutes > 0
                            THEN DATEDIFF(MINUTE, b.ProcessStartAt, COALESCE(b.ProcessEndAt, SYSUTCDATETIME()))
                            ELSE 0
                        END AS executed_minutes
                    FROM base b
                )
                SELECT
                    o.Id AS operatorId,
                    o.Name AS operatorName,
                    o.OperatorLevel AS operatorLevel,
                    SUM(ao_ots.executed_minutes) AS executedMinutes,
                    SUM(CASE WHEN ao_ots.is_evaluable = 1 THEN 1 ELSE 0 END) AS totalOperations,
                    SUM(CASE WHEN ao_ots.is_evaluable = 1 AND ao_ots.is_compliant = 1 THEN 1 ELSE 0 END) AS compliantOperations
                FROM operator_source os
                INNER JOIN appointment_ots ao_ots ON ao_ots.AppointmentId = os.AppointmentId
                INNER JOIN dbo.tbl_Operator o ON o.Id = os.OperatorId
                GROUP BY o.Id, o.Name, o.OperatorLevel
                HAVING SUM(CASE WHEN ao_ots.is_evaluable = 1 THEN 1 ELSE 0 END) > 0
                ORDER BY
                    CAST(SUM(CASE WHEN ao_ots.is_evaluable = 1 AND ao_ots.is_compliant = 1 THEN 1 ELSE 0 END) AS FLOAT)
                    / NULLIF(CAST(SUM(CASE WHEN ao_ots.is_evaluable = 1 THEN 1 ELSE 0 END) AS FLOAT), 0) DESC,
                    SUM(ao_ots.executed_minutes) DESC,
                    o.Name ASC
                """
            ),
            params,
        )
        rows = [dict(row) for row in result.mappings().all()]
        items: list[dict] = []
        for row in rows:
            total_operations = int(row.get("totalOperations") or 0)
            compliant_operations = int(row.get("compliantOperations") or 0)
            ots_rate = round((compliant_operations * 100.0 / total_operations), 2) if total_operations else 0.0
            items.append(
                {
                    "operatorId": int(row["operatorId"]),
                    "name": row["operatorName"],
                    "role": "Senior" if row.get("operatorLevel") == "SENIOR" else "Junior",
                    "executedMinutes": int(row.get("executedMinutes") or 0),
                    "totalOperations": total_operations,
                    "compliantOperations": compliant_operations,
                    "otsRate": ots_rate,
                }
            )
        return {"items": items}

    async def get_logistics_dashboard(self, date_from=None, date_to=None) -> dict:
        params = {"date_from": date_from, "date_to": date_to}
        summary_result = await self.session.execute(
            text(
                """
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
                        a.MovedWeightKg,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                )
                SELECT
                    SUM(CASE WHEN Status = 'AGENDADA' THEN 1 ELSE 0 END) AS scheduledVehicles,
                    SUM(CASE WHEN Status = 'EN_PATIO' THEN 1 ELSE 0 END) AS inYardVehicles,
                    SUM(CASE WHEN Status = 'ENTREGA_DOCUMENTOS' THEN 1 ELSE 0 END) AS documentDeliveryVehicles,
                    SUM(CASE WHEN Status = 'EN_PROCESO' THEN 1 ELSE 0 END) AS inProcessVehicles,
                    SUM(CASE WHEN Status = 'PARA_FIRMAR' THEN 1 ELSE 0 END) AS toSignVehicles,
                    SUM(CASE WHEN Status = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizedVehicles,
                    SUM(CASE WHEN Status = 'ATENDIDA' THEN 1 ELSE 0 END) AS attendedVehicles,
                    SUM(CASE WHEN Status = 'OPERACION_CANCELADA' THEN 1 ELSE 0 END) AS cancelledVehicles,
                    COALESCE(SUM(CAST(MovedWeightKg AS FLOAT)), 0) AS movedWeightKg,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL THEN 1 ELSE 0 END) AS arrivalCandidates,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt) THEN 1 ELSE 0 END) AS onTimeArrivals,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt) AND DocumentDeliveryAt IS NOT NULL THEN 1 ELSE 0 END) AS otcTotal,
                    SUM(CASE WHEN ArrivalAt IS NOT NULL AND ScheduledAt IS NOT NULL AND ArrivalAt <= DATEADD(MINUTE, 15, ScheduledAt) AND DocumentDeliveryAt IS NOT NULL AND DocumentDeliveryAt <= DATEADD(MINUTE, 35, CASE WHEN ArrivalAt > ScheduledAt THEN ArrivalAt ELSE ScheduledAt END) THEN 1 ELSE 0 END) AS otcCompliant,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS otsTotal,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS otsCompliant,
                    SUM(CASE WHEN Status = 'EN_PROCESO' AND ProcessStartAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) >= CAST(StandardTimeMinutes * 0.8 AS INT) THEN 1 ELSE 0 END) AS riskOperations,
                    AVG(CASE WHEN ArrivalAt IS NOT NULL AND CheckoutAt IS NOT NULL THEN CAST(DATEDIFF(MINUTE, ArrivalAt, CheckoutAt) AS FLOAT) END) AS averageTotalStayMinutes,
                    SUM(CASE WHEN Status = 'OPERACION_CANCELADA' THEN 1 ELSE 0 END) AS cancelledOperations
                FROM base
                """
            ),
            params,
        )
        summary_row = dict(summary_result.mappings().one())

        status_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT Id
                    FROM dbo.tbl_Appointment a
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                ),
                status_counts AS (
                    SELECT a.Status, COUNT(1) AS total
                    FROM dbo.tbl_Appointment a
                    INNER JOIN base b ON b.Id = a.Id
                    GROUP BY a.Status
                )
                SELECT stage.status, stage.label, COALESCE(sc.total, 0) AS total
                FROM (
                    VALUES
                        ('AGENDADA', 'Programadas'),
                        ('EN_PATIO', 'En patio'),
                        ('ENTREGA_DOCUMENTOS', 'Entrega docs'),
                        ('EN_PROCESO', 'En proceso'),
                        ('PARA_FIRMAR', 'Para firmar'),
                        ('FINALIZADO', 'Finalizadas'),
                        ('ATENDIDA', 'Atendidas')
                ) AS stage(status, label)
                LEFT JOIN status_counts sc ON sc.Status = stage.status
                """
            ),
            params,
        )
        status_funnel = [dict(row) for row in status_result.mappings().all()]

        durations_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT Id
                    FROM dbo.tbl_Appointment a
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                ),
                transitions AS (
                    SELECT
                        b.Id AS AppointmentId,
                        MAX(CASE WHEN l.NewStatus = 'EN_PATIO' THEN l.ChangedAt END) AS en_patio_at,
                        MAX(CASE WHEN l.NewStatus = 'ENTREGA_DOCUMENTOS' THEN l.ChangedAt END) AS entrega_documentos_at,
                        MAX(CASE WHEN l.NewStatus = 'EN_PROCESO' THEN l.ChangedAt END) AS en_proceso_at,
                        MAX(CASE WHEN l.NewStatus = 'PARA_FIRMAR' THEN l.ChangedAt END) AS para_firmar_at,
                        MAX(CASE WHEN l.NewStatus = 'FINALIZADO' THEN l.ChangedAt END) AS finalizado_at,
                        MAX(CASE WHEN l.NewStatus = 'ATENDIDA' THEN l.ChangedAt END) AS atendida_at
                    FROM base b
                    INNER JOIN dbo.tbl_AppointmentStatusLog l ON l.AppointmentId = b.Id
                    GROUP BY b.Id
                ),
                metric_source AS (
                    SELECT 'assignment' AS code, 'Asignación' AS label, DATEDIFF(MINUTE, en_patio_at, entrega_documentos_at) AS minutes FROM transitions WHERE en_patio_at IS NOT NULL AND entrega_documentos_at IS NOT NULL
                    UNION ALL
                    SELECT 'documents', 'Entrega documentos', DATEDIFF(MINUTE, entrega_documentos_at, en_proceso_at) FROM transitions WHERE entrega_documentos_at IS NOT NULL AND en_proceso_at IS NOT NULL
                    UNION ALL
                    SELECT 'process', 'Proceso', DATEDIFF(MINUTE, en_proceso_at, para_firmar_at) FROM transitions WHERE en_proceso_at IS NOT NULL AND para_firmar_at IS NOT NULL
                    UNION ALL
                    SELECT 'signing', 'Para firmar', DATEDIFF(MINUTE, para_firmar_at, finalizado_at) FROM transitions WHERE para_firmar_at IS NOT NULL AND finalizado_at IS NOT NULL
                    UNION ALL
                    SELECT 'stay', 'Tiempo de permanencia', DATEDIFF(MINUTE, finalizado_at, atendida_at) FROM transitions WHERE finalizado_at IS NOT NULL AND atendida_at IS NOT NULL
                )
                SELECT
                    code,
                    label,
                    COUNT(1) AS sampleSize,
                    AVG(CAST(CASE WHEN minutes < 0 THEN 0 ELSE minutes END AS FLOAT)) AS averageMinutes
                FROM metric_source
                GROUP BY code, label
                """
            ),
            params,
        )
        duration_rows = [dict(row) for row in durations_result.mappings().all()]
        duration_map = {row["code"]: row for row in duration_rows}
        process_durations = []
        for code, label in [
            ("assignment", "Asignación"),
            ("documents", "Entrega documentos"),
            ("process", "Proceso"),
            ("signing", "Para firmar"),
            ("stay", "Tiempo de permanencia"),
        ]:
            row = duration_map.get(code, {})
            average_minutes = row.get("averageMinutes")
            process_durations.append(
                {
                    "code": code,
                    "label": label,
                    "averageMinutes": round(float(average_minutes), 2) if average_minutes is not None else None,
                    "sampleSize": int(row.get("sampleSize") or 0),
                }
            )

        senior_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT
                        a.Id,
                        a.Status,
                        a.ScheduledAt,
                        a.ProcessStartAt,
                        a.ProcessEndAt,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                ),
                assigned AS (
                    SELECT
                        o.Id AS operatorId,
                        o.Name AS operatorName,
                        b.Id AS appointmentId,
                        b.Status,
                        b.ScheduledAt,
                        b.ProcessStartAt,
                        b.ProcessEndAt,
                        b.StandardTimeMinutes,
                        ao.AssignedAt,
                        ao.ReleasedAt
                    FROM base b
                    INNER JOIN dbo.tbl_AppointmentOperator ao ON ao.AppointmentId = b.Id
                    INNER JOIN dbo.tbl_Operator o ON o.Id = ao.OperatorId
                    WHERE o.OperatorLevel = 'SENIOR'
                ),
                totals AS (
                    SELECT
                        operatorId,
                        operatorName,
                        SUM(CASE WHEN AssignedAt IS NOT NULL THEN DATEDIFF(MINUTE, AssignedAt, COALESCE(ReleasedAt, SYSUTCDATETIME())) ELSE 0 END) AS workedMinutes,
                        SUM(CASE WHEN ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') THEN 1 ELSE 0 END) AS totalOperations,
                        SUM(CASE WHEN ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS compliantOperations
                    FROM assigned
                    GROUP BY operatorId, operatorName
                )
                SELECT
                    operatorId,
                    operatorName,
                    workedMinutes,
                    totalOperations,
                    compliantOperations
                FROM totals
                ORDER BY totalOperations DESC, workedMinutes DESC, operatorName ASC
                """
            ),
            params,
        )
        senior_rows = [dict(row) for row in senior_result.mappings().all()]

        senior_buckets_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT
                        a.Id,
                        a.Status,
                        a.ScheduledAt,
                        a.ProcessStartAt,
                        a.ProcessEndAt,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                )
                SELECT
                    o.Id AS operatorId,
                    (DATEPART(HOUR, COALESCE(b.ProcessEndAt, b.ScheduledAt) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time') / 2) * 2 AS hour,
                    SUM(CASE WHEN b.ProcessStartAt IS NOT NULL AND b.ProcessEndAt IS NOT NULL AND b.StandardTimeMinutes > 0 AND b.Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') THEN 1 ELSE 0 END) AS totalOperations,
                    SUM(CASE WHEN b.ProcessStartAt IS NOT NULL AND b.ProcessEndAt IS NOT NULL AND b.StandardTimeMinutes > 0 AND b.Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND DATEDIFF(MINUTE, b.ProcessStartAt, b.ProcessEndAt) <= b.StandardTimeMinutes THEN 1 ELSE 0 END) AS compliantOperations
                FROM base b
                INNER JOIN dbo.tbl_AppointmentOperator ao ON ao.AppointmentId = b.Id
                INNER JOIN dbo.tbl_Operator o ON o.Id = ao.OperatorId
                WHERE o.OperatorLevel = 'SENIOR'
                GROUP BY o.Id, (DATEPART(HOUR, COALESCE(b.ProcessEndAt, b.ScheduledAt) AT TIME ZONE 'UTC' AT TIME ZONE 'SA Pacific Standard Time') / 2) * 2
                """
            ),
            params,
        )
        senior_bucket_map: dict[int, dict[int, dict]] = {}
        for row in senior_buckets_result.mappings().all():
            item = dict(row)
            operator_id = int(item["operatorId"])
            hour = int(item["hour"])
            total_operations = int(item.get("totalOperations") or 0)
            compliant_operations = int(item.get("compliantOperations") or 0)
            senior_bucket_map.setdefault(operator_id, {})[hour] = {
                "hour": hour,
                "label": f"{hour:02d}:00",
                "otsRate": round((compliant_operations * 100.0 / total_operations), 2) if total_operations else None,
                "totalOperations": total_operations,
            }

        senior_operator_ots = []
        for row in senior_rows:
            operator_id = int(row["operatorId"])
            total_operations = int(row.get("totalOperations") or 0)
            compliant_operations = int(row.get("compliantOperations") or 0)
            buckets_by_hour = senior_bucket_map.get(operator_id, {})
            senior_operator_ots.append(
                {
                    "operatorId": operator_id,
                    "name": row["operatorName"],
                    "workedMinutes": int(row.get("workedMinutes") or 0),
                    "totalOperations": total_operations,
                    "compliantOperations": compliant_operations,
                    "otsRate": round((compliant_operations * 100.0 / total_operations), 2) if total_operations else 0.0,
                    "buckets": [
                        buckets_by_hour.get(
                            hour,
                            {"hour": hour, "label": f"{hour:02d}:00", "otsRate": None, "totalOperations": 0},
                        )
                        for hour in range(0, 24, 2)
                    ],
                }
            )

        ots_by_client_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT
                        a.Id,
                        c.Name AS clientName,
                        a.Status,
                        a.ProcessStartAt,
                        a.ProcessEndAt,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_Client c ON c.Id = a.ClientId
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                )
                SELECT
                    clientName,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS totalOperations,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS compliantOperations
                FROM base
                GROUP BY clientName
                HAVING SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) > 0
                ORDER BY
                    CAST(SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS FLOAT)
                    / NULLIF(CAST(SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS FLOAT), 0) DESC,
                    clientName ASC
                """
            ),
            params,
        )
        ots_by_client = [
            {
                "name": row["clientName"],
                "otsRate": round((int(row.get("compliantOperations") or 0) * 100.0 / int(row.get("totalOperations") or 1)), 2),
                "totalOperations": int(row.get("totalOperations") or 0),
            }
            for row in ots_by_client_result.mappings().all()
        ]

        ots_by_operation_type_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT
                        a.Id,
                        ot.Name AS operationTypeName,
                        a.Status,
                        a.ProcessStartAt,
                        a.ProcessEndAt,
                        COALESCE(s.StandardTimeMinutes, ot.StandardTimeMinutes) AS StandardTimeMinutes
                    FROM dbo.tbl_Appointment a
                    INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
                    LEFT JOIN dbo.tbl_BusinessRule br
                        ON br.ClientId = a.ClientId
                       AND br.OperationTypeId = a.OperationTypeId
                       AND br.VehicleTypeId = a.VehicleTypeId
                       AND br.IsActive = 1
                    LEFT JOIN dbo.tbl_Standard s ON s.Id = br.StandardId AND s.IsActive = 1
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                )
                SELECT
                    operationTypeName,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS totalOperations,
                    SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS compliantOperations
                FROM base
                GROUP BY operationTypeName
                HAVING SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) > 0
                ORDER BY
                    CAST(SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS FLOAT)
                    / NULLIF(CAST(SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS FLOAT), 0) DESC,
                    operationTypeName ASC
                """
            ),
            params,
        )
        ots_by_operation_type = [
            {
                "name": row["operationTypeName"],
                "otsRate": round((int(row.get("compliantOperations") or 0) * 100.0 / int(row.get("totalOperations") or 1)), 2),
                "totalOperations": int(row.get("totalOperations") or 0),
            }
            for row in ots_by_operation_type_result.mappings().all()
        ]

        supervisor_result = await self.session.execute(
            text(
                """
                WITH base AS (
                    SELECT a.Id
                    FROM dbo.tbl_Appointment a
                    WHERE a.IsDeleted = 0
                      AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                      AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
                ),
                supervisor_assignments AS (
                    SELECT
                        u.Id AS supervisorId,
                        u.Name AS supervisorName,
                        al.AppointmentId
                    FROM dbo.tbl_AssignmentLog al
                    INNER JOIN base b ON b.Id = al.AppointmentId
                    INNER JOIN dbo.tbl_User u ON u.Id = al.AssignedByUserId
                    INNER JOIN dbo.tbl_UserRole ur ON ur.UserId = u.Id
                    INNER JOIN dbo.tbl_Role r ON r.Id = ur.RoleId
                    WHERE al.AssignedByUserId IS NOT NULL
                      AND r.Code IN ('SUPERVISOR', 'ADMIN')
                    GROUP BY u.Id, u.Name, al.AppointmentId
                )
                SELECT
                    supervisorId,
                    supervisorName,
                    COUNT(1) AS managedVehicles
                FROM supervisor_assignments
                GROUP BY supervisorId, supervisorName
                ORDER BY COUNT(1) DESC, supervisorName ASC
                """
            ),
            params,
        )
        supervisor_items = [
            {
                "supervisorId": int(row["supervisorId"]),
                "name": row["supervisorName"],
                "managedVehicles": int(row.get("managedVehicles") or 0),
            }
            for row in supervisor_result.mappings().all()
        ]

        bottlenecks = sorted(
            [item for item in process_durations if item["averageMinutes"] is not None],
            key=lambda item: item["averageMinutes"] or 0,
            reverse=True,
        )[:3]

        def int_value(key: str) -> int:
            return int(summary_row.get(key) or 0)

        def float_value(key: str) -> float:
            return round(float(summary_row.get(key) or 0), 2)

        ots_total = int_value("otsTotal")
        ots_compliant = int_value("otsCompliant")
        otc_total = int_value("otcTotal")
        otc_compliant = int_value("otcCompliant")
        arrival_candidates = int_value("arrivalCandidates")
        on_time_arrivals = int_value("onTimeArrivals")
        average_total_stay = summary_row.get("averageTotalStayMinutes")

        return {
            "summary": {
                "scheduledVehicles": int_value("scheduledVehicles"),
                "inYardVehicles": int_value("inYardVehicles"),
                "documentDeliveryVehicles": int_value("documentDeliveryVehicles"),
                "inProcessVehicles": int_value("inProcessVehicles"),
                "toSignVehicles": int_value("toSignVehicles"),
                "finalizedVehicles": int_value("finalizedVehicles"),
                "attendedVehicles": int_value("attendedVehicles"),
                "cancelledVehicles": int_value("cancelledVehicles"),
                "activeVehicles": int_value("inYardVehicles") + int_value("documentDeliveryVehicles") + int_value("inProcessVehicles") + int_value("toSignVehicles"),
                "movedWeightKg": float_value("movedWeightKg"),
                "otcRate": round((otc_compliant * 100.0 / otc_total), 2) if otc_total else None,
                "otsRate": round((ots_compliant * 100.0 / ots_total), 2) if ots_total else None,
                "onTimeArrivalRate": round((on_time_arrivals * 100.0 / arrival_candidates), 2) if arrival_candidates else None,
                "evaluatedOperations": ots_total,
                "cancelledOperations": int_value("cancelledVehicles"),
                "supervisorsWithAssignments": len(supervisor_items),
                "seniorOperatorsMeasured": len(senior_operator_ots),
                "riskOperations": int_value("riskOperations"),
                "averageTotalStayMinutes": round(float(average_total_stay), 2) if average_total_stay is not None else None,
            },
            "statusFunnel": status_funnel,
            "processDurations": process_durations,
            "bottlenecks": bottlenecks,
            "seniorOperatorOts": senior_operator_ots,
            "supervisorAssignments": supervisor_items,
            "otsByClient": ots_by_client,
            "otsByOperationType": ots_by_operation_type,
        }

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
                  AND (:date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= :date_from)
                  AND (:date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= :date_to)
            )
        """

    async def get_dashboard_summary(self, date_from=None, date_to=None) -> dict:
        params = {"date_from": date_from, "date_to": date_to}
        conn = await self.session.connection()
        aggregate, alerts, queue_stats, queue_items = await conn.run_sync(
            lambda sync_conn: self._execute_dashboard_summary_sp(sync_conn, params)
        )

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

    def _execute_dashboard_summary_sp(self, sync_conn, params: dict) -> tuple[dict, list[dict], dict, list[dict]]:
        cursor = sync_conn.connection.cursor()
        try:
            cursor.execute(
                "EXEC dbo.usp_GetDashboardSummary @date_from=?, @date_to=?",
                (params["date_from"], params["date_to"]),
            )
            aggregate_rows = self._fetch_cursor_rows(cursor)
            alerts = self._fetch_nextset_rows(cursor)
            queue_stats_rows = self._fetch_nextset_rows(cursor)
            queue_items = self._fetch_nextset_rows(cursor)
        finally:
            cursor.close()

        aggregate = aggregate_rows[0] if aggregate_rows else {}
        queue_stats = queue_stats_rows[0] if queue_stats_rows else {"activeCount": 0, "highestScore": 0}
        return aggregate, alerts, queue_stats, queue_items

    @staticmethod
    def _fetch_cursor_rows(cursor) -> list[dict]:
        if not cursor.description:
            return []
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def _fetch_nextset_rows(self, cursor) -> list[dict]:
        if not cursor.nextset():
            return []
        return self._fetch_cursor_rows(cursor)

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
            SELECT
                base.*,
                operator_names.SeniorOperators,
                operator_names.JuniorOperators,
                COUNT(1) OVER() AS TotalRows
            FROM dbo.vw_AppointmentOperational base
            OUTER APPLY (
                SELECT
                    STRING_AGG(CASE WHEN src.OperatorLevel = 'SENIOR' THEN src.Name END, ', ') AS SeniorOperators,
                    STRING_AGG(CASE WHEN src.OperatorLevel = 'JUNIOR' THEN src.Name END, ', ') AS JuniorOperators
                FROM (
                    SELECT o.OperatorLevel, o.Name
                    FROM dbo.tbl_AppointmentOperator ao
                    INNER JOIN dbo.tbl_Operator o ON o.Id = ao.OperatorId
                    WHERE ao.AppointmentId = base.Id
                      AND ao.IsActive = 1
                    UNION ALL
                    SELECT o.OperatorLevel, o.Name
                    FROM dbo.tbl_AppointmentOperator ao
                    INNER JOIN dbo.tbl_Operator o ON o.Id = ao.OperatorId
                    WHERE ao.AppointmentId = base.Id
                      AND ao.IsActive = 0
                      AND NOT EXISTS (
                          SELECT 1
                          FROM dbo.tbl_AppointmentOperator active_ao
                          WHERE active_ao.AppointmentId = base.Id
                            AND active_ao.IsActive = 1
                      )
                      AND ao.ReleasedAt = (
                          SELECT MAX(last_ao.ReleasedAt)
                          FROM dbo.tbl_AppointmentOperator last_ao
                          WHERE last_ao.AppointmentId = base.Id
                            AND last_ao.IsActive = 0
                      )
                ) src
            ) operator_names
            WHERE (:search IS NULL OR ClientName LIKE '%' + :search + '%' OR VehiclePlate LIKE '%' + :search + '%')
              AND (:status IS NULL OR Status = :status)
              AND (:date_from IS NULL OR COALESCE(ProcessStartAt, ScheduledAt) >= :date_from)
              AND (:date_to IS NULL OR COALESCE(ProcessStartAt, ScheduledAt) <= :date_to)
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
              AND (:date_from IS NULL OR COALESCE(ProcessStartAt, ScheduledAt) >= :date_from)
              AND (:date_to IS NULL OR COALESCE(ProcessStartAt, ScheduledAt) <= :date_to)
            """
        )
        result = await self.session.execute(
            query,
            {"search": search, "status": status, "date_from": date_from, "date_to": date_to},
        )
        return int(result.scalar_one())

    async def get_appointment(self, appointment_id: int) -> dict | None:
        result = await self.session.execute(
            text("""
                SELECT
                    Id, ClientId, ClientName, OperationTypeId, OperationTypeName, StandardTimeMinutes,
                    VehicleTypeId, VehicleTypeName, DriverName, DriverDocument, VehiclePlate,
                    EstimatedTons, DockId, DockName, Status, ScheduledAt, ArrivalAt,
                    DocumentDeliveryAt, ProcessStartAt, ProcessEndAt, FinalizedAt, CheckoutAt, CancelledAt,
                    LastAssignedAt, ActiveOperatorCount, Remissions, Precincts, MovedWeightKg,
                    NonComplianceComment, OtcNonComplianceReason, OtsNonComplianceReason,
                    CancellationReason, IsNoShow, IsLateArrival, LateArrivalMinutes, Version,
                    CreatedAt, UpdatedAt
                FROM dbo.vw_AppointmentOperational
                WHERE Id = :appointment_id
            """),
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
