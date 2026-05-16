CREATE OR ALTER PROCEDURE dbo.usp_MoveAppointmentToSign
    @AppointmentId INT,
    @ProcessEndAt DATETIME2,
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
            @processStartAt DATETIME2,
            @currentProcessEndAt DATETIME2,
            @currentVersion INT;

        SELECT
            @currentStatus = Status,
            @processStartAt = ProcessStartAt,
            @currentProcessEndAt = ProcessEndAt,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50040, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus <> 'EN_PROCESO' THROW 50041, 'INVALID_STATE_TRANSITION', 1;
        IF @ProcessEndAt < @processStartAt THROW 50042, 'INVALID_PROCESS_END_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            ProcessEndAt = @ProcessEndAt,
            Status = 'PARA_FIRMAR',
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

        DECLARE @currentProcessEndAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentProcessEndAt, 127);
        DECLARE @processEndAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ProcessEndAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ProcessEndAt', @OldValue = @currentProcessEndAtText, @NewValue = @processEndAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = 'EN_PROCESO', @NewValue = 'PARA_FIRMAR', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'EN_PROCESO', @NewStatus = 'PARA_FIRMAR', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'TO_SIGN', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
