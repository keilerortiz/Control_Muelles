CREATE INDEX IX_tbl_Appointment_OperationalHotPath
ON dbo.tbl_Appointment(Status, ScheduledAt)
INCLUDE (DockId, ArrivalAt, DocumentDeliveryAt, ProcessStartAt, ProcessEndAt, FinalizedAt, CheckoutAt, Version);

CREATE INDEX IX_tbl_AppointmentOperator_Active
ON dbo.tbl_AppointmentOperator(OperatorId, IsActive)
INCLUDE (AppointmentId);

CREATE INDEX IX_tbl_AppointmentOperator_Appointment_Active
ON dbo.tbl_AppointmentOperator(AppointmentId, IsActive)
INCLUDE (OperatorId);

CREATE INDEX IX_tbl_AssignmentLog_Appointment_AssignedAt
ON dbo.tbl_AssignmentLog(AppointmentId, AssignedAt DESC)
INCLUDE (DockId, OperatorId, IsActive);

CREATE UNIQUE INDEX UX_tbl_NonComplianceReason_ReasonType_Name_Active
ON dbo.tbl_NonComplianceReason(ReasonType, Name)
WHERE IsDeleted = 0;

GO
