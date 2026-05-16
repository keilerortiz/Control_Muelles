CREATE OR ALTER PROCEDURE dbo.usp_CheckoutAppointment
    @AppointmentId INT,
    @CheckoutAt DATETIME2,
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
            @finalizedAt DATETIME2,
            @currentCheckoutAt DATETIME2,
            @currentVersion INT;

        SELECT
            @currentStatus = Status,
            @finalizedAt = FinalizedAt,
            @currentCheckoutAt = CheckoutAt,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50051, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus <> 'FINALIZADO' THROW 50052, 'INVALID_STATE_TRANSITION', 1;
        IF @CheckoutAt < @finalizedAt THROW 50053, 'INVALID_CHECKOUT_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            CheckoutAt = @CheckoutAt,
            Status = 'ATENDIDA',
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId
          AND (@ExpectedVersion IS NULL OR Version = @ExpectedVersion);

        DECLARE @currentCheckoutAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentCheckoutAt, 127);
        DECLARE @checkoutAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @CheckoutAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'CheckoutAt', @OldValue = @currentCheckoutAtText, @NewValue = @checkoutAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = 'FINALIZADO', @NewValue = 'ATENDIDA', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'FINALIZADO', @NewStatus = 'ATENDIDA', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'CHECKOUT', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
