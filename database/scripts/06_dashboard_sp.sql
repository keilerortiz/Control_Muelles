SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetDashboardSummary
    @date_from DATETIME2 = NULL,
    @date_to DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Crear tabla base temporal
    IF OBJECT_ID('tempdb..#DashboardBase') IS NOT NULL DROP TABLE #DashboardBase;

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
          AND (@date_from IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) >= @date_from)
          AND (@date_to IS NULL OR COALESCE(a.ProcessStartAt, a.ScheduledAt) <= @date_to)
    )
    SELECT * INTO #DashboardBase FROM base;

    -- 2. Resultado 1: Agregados Principales
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
        SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 THEN 1 ELSE 0 END) AS ots_total,
        SUM(CASE WHEN Status IN ('PARA_FIRMAR', 'FINALIZADO', 'ATENDIDA') AND ProcessStartAt IS NOT NULL AND ProcessEndAt IS NOT NULL AND StandardTimeMinutes > 0 AND DATEDIFF(MINUTE, ProcessStartAt, ProcessEndAt) <= StandardTimeMinutes THEN 1 ELSE 0 END) AS ots_compliant,
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
    FROM #DashboardBase;

    -- 3. Resultado 2: Alertas
    WITH alert_candidates AS (
        SELECT Id AS appointmentId, 'WAITING_ASSIGNMENT' AS type, 'MEDIUM' AS severity, 'Cita esperando asignación de recursos' AS message
        FROM #DashboardBase
        WHERE Status = 'EN_PATIO' AND ActiveOperatorCount = 0
        UNION ALL
        SELECT Id, 'NO_OPERATORS', 'HIGH', 'Recurso activo sin operadores asignados'
        FROM #DashboardBase
        WHERE Status IN ('ENTREGA_DOCUMENTOS', 'EN_PROCESO') AND ActiveOperatorCount = 0
        UNION ALL
        SELECT Id, 'DELAYED', 'HIGH', 'Cita retrasada frente al tiempo estándar'
        FROM #DashboardBase
        WHERE Status = 'EN_PROCESO'
          AND ProcessStartAt IS NOT NULL
          AND StandardTimeMinutes > 0
          AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) > StandardTimeMinutes
        UNION ALL
        SELECT Id, 'AT_RISK', 'MEDIUM', 'Cita en riesgo de incumplir SLA'
        FROM #DashboardBase
        WHERE Status = 'EN_PROCESO'
          AND ProcessStartAt IS NOT NULL
          AND StandardTimeMinutes > 0
          AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) <= StandardTimeMinutes
          AND DATEDIFF(MINUTE, ProcessStartAt, SYSUTCDATETIME()) >= CAST(StandardTimeMinutes * 0.8 AS INT)
    )
    SELECT TOP 10 appointmentId, type, severity, message
    FROM alert_candidates
    ORDER BY CASE WHEN severity = 'HIGH' THEN 0 ELSE 1 END, appointmentId;

    -- 4. Resultado 3: Queue Stats
    WITH queue AS (
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
        FROM #DashboardBase
        WHERE Status IN ('EN_PATIO', 'ENTREGA_DOCUMENTOS', 'EN_PROCESO', 'PARA_FIRMAR')
    )
    SELECT COUNT(1) AS activeCount, COALESCE(MAX(queueScore), 0) AS highestScore
    FROM queue;

    -- 5. Resultado 4: Queue Items
    WITH queue AS (
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
        FROM #DashboardBase
        WHERE Status IN ('EN_PATIO', 'ENTREGA_DOCUMENTOS', 'EN_PROCESO', 'PARA_FIRMAR')
    )
    SELECT TOP 10 appointmentId, status, queueScore
    FROM queue
    ORDER BY queueScore DESC, appointmentId ASC;

    DROP TABLE #DashboardBase;
END
GO
