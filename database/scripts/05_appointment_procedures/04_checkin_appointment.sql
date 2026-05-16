CREATE OR ALTER PROCEDURE dbo.usp_CheckInAppointment
    @AppointmentId INT,
    @DriverName NVARCHAR(150),
    @DriverDocument NVARCHAR(80),
    @VehiclePlate NVARCHAR(20),
    @ChangedBy INT,
    @ExpectedVersion INT = NULL,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @currentStatus NVARCHAR(50),
            @currentDriverName NVARCHAR(150),
            @currentDriverDocument NVARCHAR(80),
            @currentVehiclePlate NVARCHAR(20),
            @currentVersion INT,
            @arrivalAt DATETIME2 = SYSUTCDATETIME();

        SELECT
            @currentStatus = Status,
            @currentDriverName = DriverName,
            @currentDriverDocument = DriverDocument,
            @currentVehiclePlate = VehiclePlate,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50015, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus <> 'AGENDADA' THROW 50016, 'INVALID_STATE_TRANSITION', 1;

        UPDATE dbo.tbl_Appointment
        SET
            DriverName = @DriverName,
            DriverDocument = @DriverDocument,
            VehiclePlate = @VehiclePlate,
            ArrivalAt = @arrivalAt,
            Status = 'EN_PATIO',
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId
          AND (@ExpectedVersion IS NULL OR Version = @ExpectedVersion);

        DECLARE @arrivalAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @arrivalAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'DriverName', @OldValue = @currentDriverName, @NewValue = @DriverName, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'DriverDocument', @OldValue = @currentDriverDocument, @NewValue = @DriverDocument, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'VehiclePlate', @OldValue = @currentVehiclePlate, @NewValue = @VehiclePlate, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ArrivalAt', @OldValue = NULL, @NewValue = @arrivalAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = 'AGENDADA', @NewValue = 'EN_PATIO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'AGENDADA', @NewStatus = 'EN_PATIO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'CHECKIN', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
