CREATE INDEX IX_tbl_Appointment_OperationalHotPath
ON dbo.tbl_Appointment(Status, ScheduledAt)
INCLUDE (DockId, ArrivalAt, DocumentDeliveryAt, ProcessStartAt, ProcessEndAt, FinalizedAt, CheckoutAt, Version);

CREATE INDEX IX_tbl_AppointmentOperator_Active
ON dbo.tbl_AppointmentOperator(OperatorId, IsActive)
INCLUDE (AppointmentId);

GO
