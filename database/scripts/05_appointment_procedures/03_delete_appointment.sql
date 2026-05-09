CREATE OR ALTER PROCEDURE dbo.usp_DeleteAppointment
    @AppointmentId INT,
    @DeletedBy INT,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50013, 'RESOURCE_NOT_FOUND', 1;
        IF @currentStatus <> 'AGENDADA' THROW 50014, 'INVALID_STATUS_FOR_DELETE', 1;

        UPDATE dbo.tbl_Appointment
        SET IsDeleted = 1, UpdatedAt = GETUTCDATE(), UpdatedBy = @DeletedBy, Version = Version + 1
        WHERE Id = @AppointmentId;

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'IsDeleted', @OldValue = '0', @NewValue = '1', @ChangedByUserId = @DeletedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

