CREATE OR ALTER VIEW dbo.vw_UserAuth
AS
SELECT
    u.Id,
    u.Name,
    u.Email,
    u.PasswordHash,
    u.IsActive,
    STRING_AGG(r.Code, ',') AS Roles
FROM dbo.tbl_User u
INNER JOIN dbo.tbl_UserRole ur ON ur.UserId = u.Id
INNER JOIN dbo.tbl_Role r ON r.Id = ur.RoleId
WHERE u.IsDeleted = 0
GROUP BY u.Id, u.Name, u.Email, u.PasswordHash, u.IsActive;
GO

CREATE OR ALTER VIEW dbo.vw_AppointmentOperational
AS
SELECT
    a.Id,
    a.ClientId,
    c.Name AS ClientName,
    a.OperationTypeId,
    ot.Name AS OperationTypeName,
    ot.StandardTimeMinutes,
    a.VehicleTypeId,
    vt.Name AS VehicleTypeName,
    a.DriverName,
    a.DriverDocument,
    a.VehiclePlate,
    a.EstimatedTons,
    a.DockId,
    d.Name AS DockName,
    a.Status,
    a.ScheduledAt,
    a.ArrivalAt,
    a.DocumentDeliveryAt,
    a.ProcessStartAt,
    a.ProcessEndAt,
    a.FinalizedAt,
    a.CheckoutAt,
    a.CancelledAt,
    assignment_metrics.LastAssignedAt,
    operator_metrics.ActiveOperatorCount,
    a.Remissions,
    a.Precincts,
    a.MovedWeightKg,
    a.NonComplianceComment,
    a.OtcNonComplianceReason,
    a.OtsNonComplianceReason,
    a.CancellationReason,
    a.IsNoShow,
    a.IsLateArrival,
    a.LateArrivalMinutes,
    a.Version,
    a.CreatedAt,
    a.UpdatedAt
FROM dbo.tbl_Appointment a
INNER JOIN dbo.tbl_Client c ON c.Id = a.ClientId
INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
INNER JOIN dbo.tbl_VehicleType vt ON vt.Id = a.VehicleTypeId
LEFT JOIN dbo.tbl_Dock d ON d.Id = a.DockId
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
WHERE a.IsDeleted = 0;
GO

CREATE OR ALTER VIEW dbo.vw_AppointmentStatusLog
AS
SELECT
    l.Id,
    l.AppointmentId,
    l.PreviousStatus,
    l.NewStatus,
    l.ChangedByUserId,
    l.ChangedAt,
    l.CorrelationId
FROM dbo.tbl_AppointmentStatusLog l;
GO
CREATE OR ALTER VIEW dbo.vw_DashboardSummary
AS
WITH active_ops AS (
    SELECT *
    FROM dbo.tbl_Appointment
    WHERE IsDeleted = 0
),
base AS (
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'AGENDADA' THEN 1 ELSE 0 END) AS agendada,
        SUM(CASE WHEN Status = 'EN_PATIO' THEN 1 ELSE 0 END) AS en_patio,
        SUM(CASE WHEN Status = 'ENTREGA_DOCUMENTOS' THEN 1 ELSE 0 END) AS entrega_documentos,
        SUM(CASE WHEN Status = 'EN_PROCESO' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN Status = 'PARA_FIRMAR' THEN 1 ELSE 0 END) AS para_firmar,
        SUM(CASE WHEN Status = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizado,
        SUM(CASE WHEN Status = 'ATENDIDA' THEN 1 ELSE 0 END) AS atendida,
        SUM(CASE WHEN Status = 'OPERACION_CANCELADA' THEN 1 ELSE 0 END) AS cancelada
    FROM active_ops
)
SELECT
    total,
    agendada,
    en_patio,
    entrega_documentos,
    en_proceso,
    para_firmar,
    finalizado,
    atendida,
    cancelada,
    CASE WHEN total = 0 THEN 0 ELSE CAST((atendida * 100.0) / total AS DECIMAL(5,2)) END AS completion_rate
FROM base;
GO

CREATE OR ALTER VIEW dbo.vw_OperatorAvailability
AS
SELECT
    o.Id,
    o.Name,
    o.OperatorLevel,
    o.MaxConcurrentOperations,
    o.IsActive,
    COUNT(CASE WHEN ao.IsActive = 1 THEN 1 END) AS ActiveAssignments
FROM dbo.tbl_Operator o
LEFT JOIN dbo.tbl_AppointmentOperator ao ON ao.OperatorId = o.Id
GROUP BY o.Id, o.Name, o.OperatorLevel, o.MaxConcurrentOperations, o.IsActive;
GO
