CREATE OR ALTER PROCEDURE dbo.usp_UpdateAppointment
    @AppointmentId INT,
    @ClientId INT,
    @OperationTypeId INT,
    @VehicleTypeId INT,
    @EstimatedTons DECIMAL(18,2),
    @ScheduledAt DATETIME2,
    @DriverName NVARCHAR(150) = NULL,
    @DriverDocument NVARCHAR(80) = NULL,
    @VehiclePlate NVARCHAR(20) = NULL,
    @NonComplianceComment NVARCHAR(1000) = NULL,
    @UpdatedBy INT,
    @ExpectedVersion INT = NULL,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @currentStatus NVARCHAR(50),
            @currentClientId INT,
            @currentOperationTypeId INT,
            @currentVehicleTypeId INT,
            @currentEstimatedTons DECIMAL(18,2),
            @currentScheduledAt DATETIME2,
            @currentVersion INT;

        SELECT
            @currentStatus = Status,
            @currentClientId = ClientId,
            @currentOperationTypeId = OperationTypeId,
            @currentVehicleTypeId = VehicleTypeId,
            @currentEstimatedTons = EstimatedTons,
            @currentScheduledAt = ScheduledAt,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50006, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus <> 'AGENDADA' THROW 50007, 'INVALID_STATUS_FOR_UPDATE', 1;
        IF @ScheduledAt <= SYSUTCDATETIME() THROW 50008, 'INVALID_DATE', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_Client WHERE Id = @ClientId AND IsActive = 1)
            THROW 50009, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_OperationType WHERE Id = @OperationTypeId AND IsActive = 1)
            THROW 50010, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_VehicleType WHERE Id = @VehicleTypeId AND IsActive = 1)
            THROW 50011, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.tbl_BusinessRule
            WHERE ClientId = @ClientId
              AND OperationTypeId = @OperationTypeId
              AND VehicleTypeId = @VehicleTypeId
              AND IsActive = 1
        )
            THROW 50013, 'VALIDATION_ERROR|INVALID_CONFIGURATION', 1;

        IF @currentClientId = @ClientId
           AND @currentOperationTypeId = @OperationTypeId
           AND @currentVehicleTypeId = @VehicleTypeId
           AND @currentEstimatedTons = @EstimatedTons
           AND @currentScheduledAt = @ScheduledAt
        BEGIN
            THROW 50012, 'VALIDATION_ERROR|NO_CHANGES_DETECTED', 1;
        END;

        UPDATE dbo.tbl_Appointment
        SET
            ClientId = @ClientId,
            OperationTypeId = @OperationTypeId,
            VehicleTypeId = @VehicleTypeId,
            EstimatedTons = @EstimatedTons,
            ScheduledAt = @ScheduledAt,
            DriverName = @DriverName,
            DriverDocument = @DriverDocument,
            VehiclePlate = @VehiclePlate,
            NonComplianceComment = @NonComplianceComment,
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @UpdatedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId
          AND (@ExpectedVersion IS NULL OR Version = @ExpectedVersion);

        DECLARE
            @currentClientIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentClientId),
            @newClientIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ClientId),
            @currentOperationTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentOperationTypeId),
            @newOperationTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @OperationTypeId),
            @currentVehicleTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentVehicleTypeId),
            @newVehicleTypeIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @VehicleTypeId),
            @currentEstimatedTonsText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentEstimatedTons),
            @newEstimatedTonsText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @EstimatedTons),
            @currentScheduledAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentScheduledAt, 127),
            @newScheduledAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ScheduledAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ClientId', @OldValue = @currentClientIdText, @NewValue = @newClientIdText, @ChangedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'OperationTypeId', @OldValue = @currentOperationTypeIdText, @NewValue = @newOperationTypeIdText, @ChangedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'VehicleTypeId', @OldValue = @currentVehicleTypeIdText, @NewValue = @newVehicleTypeIdText, @ChangedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'EstimatedTons', @OldValue = @currentEstimatedTonsText, @NewValue = @newEstimatedTonsText, @ChangedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ScheduledAt', @OldValue = @currentScheduledAtText, @NewValue = @newScheduledAtText, @ChangedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'UPDATE_APPOINTMENT', @CreatedByUserId = @UpdatedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
