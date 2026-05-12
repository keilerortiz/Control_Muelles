CREATE OR ALTER PROCEDURE dbo.usp_CreateAppointment
    @ClientId INT,
    @OperationTypeId INT,
    @VehicleTypeId INT,
    @EstimatedTons DECIMAL(18,2),
    @ScheduledAt DATETIME2,
    @CreatedBy INT,
    @CorrelationId UNIQUEIDENTIFIER = NULL,
    @AppointmentId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @ScheduledAt <= GETUTCDATE() THROW 50001, 'INVALID_DATE', 1;
        IF @EstimatedTons <= 0 THROW 50002, 'VALIDATION_ERROR', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_Client WHERE Id = @ClientId AND IsActive = 1)
            THROW 50003, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_OperationType WHERE Id = @OperationTypeId AND IsActive = 1)
            THROW 50004, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_VehicleType WHERE Id = @VehicleTypeId AND IsActive = 1)
            THROW 50005, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.tbl_BusinessRule
            WHERE ClientId = @ClientId
              AND OperationTypeId = @OperationTypeId
              AND VehicleTypeId = @VehicleTypeId
              AND IsActive = 1
        )
            THROW 50013, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;

        INSERT INTO dbo.tbl_Appointment (
            ClientId, OperationTypeId, VehicleTypeId, EstimatedTons, Status, ScheduledAt, CreatedBy
        )
        VALUES (
            @ClientId, @OperationTypeId, @VehicleTypeId, @EstimatedTons, 'AGENDADA', @ScheduledAt, @CreatedBy
        );

        SET @AppointmentId = SCOPE_IDENTITY();

        DECLARE
            @clientIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ClientId),
            @operationTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @OperationTypeId),
            @vehicleTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @VehicleTypeId),
            @estimatedTonsText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @EstimatedTons),
            @scheduledAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ScheduledAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ClientId', @OldValue = NULL, @NewValue = @clientIdText, @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'OperationTypeId', @OldValue = NULL, @NewValue = @operationTypeIdText, @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'VehicleTypeId', @OldValue = NULL, @NewValue = @vehicleTypeIdText, @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'EstimatedTons', @OldValue = NULL, @NewValue = @estimatedTonsText, @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ScheduledAt', @OldValue = NULL, @NewValue = @scheduledAtText, @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = NULL, @NewValue = 'AGENDADA', @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = NULL, @NewStatus = 'AGENDADA', @ChangedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'CREATE_APPOINTMENT', @CreatedByUserId = @CreatedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

