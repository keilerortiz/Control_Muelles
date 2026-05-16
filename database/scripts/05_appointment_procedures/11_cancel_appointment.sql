CREATE OR ALTER PROCEDURE dbo.usp_CancelAppointment
    @AppointmentId INT,
    @CancellationReason NVARCHAR(1000),
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
            @currentCancellationReason NVARCHAR(1000),
            @currentVersion INT,
            @cancelledAt DATETIME2 = SYSUTCDATETIME();

        SELECT
            @currentStatus = Status,
            @currentCancellationReason = CancellationReason,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50054, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus NOT IN ('EN_PATIO', 'EN_PROCESO') THROW 50055, 'INVALID_STATE_TRANSITION', 1;
        IF @CancellationReason IS NULL OR LTRIM(RTRIM(@CancellationReason)) = '' THROW 50056, 'VALIDATION_ERROR|CANCELLATION_REASON_REQUIRED', 1;

        UPDATE dbo.tbl_Appointment
        SET
            CancellationReason = @CancellationReason,
            CancelledAt = @cancelledAt,
            Status = 'OPERACION_CANCELADA',
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId
          AND (@ExpectedVersion IS NULL OR Version = @ExpectedVersion);

        UPDATE dbo.tbl_AppointmentOperator
        SET IsActive = 0, ReleasedAt = SYSUTCDATETIME()
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_AssignmentLog
        SET IsActive = 0, ReleasedAt = SYSUTCDATETIME(), ReleasedByUserId = @ChangedBy
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        DECLARE @cancelledAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @cancelledAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'CancellationReason', @OldValue = @currentCancellationReason, @NewValue = @CancellationReason, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'CancelledAt', @OldValue = NULL, @NewValue = @cancelledAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = @currentStatus, @NewValue = 'OPERACION_CANCELADA', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = @currentStatus, @NewStatus = 'OPERACION_CANCELADA', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'CANCEL', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
