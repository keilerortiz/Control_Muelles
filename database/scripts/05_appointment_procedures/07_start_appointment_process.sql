CREATE OR ALTER PROCEDURE dbo.usp_StartAppointmentProcess
    @AppointmentId INT,
    @DocumentDeliveryAt DATETIME2,
    @ProcessStartAt DATETIME2,
    @Remissions NVARCHAR(2000),
    @Precincts NVARCHAR(2000),
    @ChangedBy INT,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @currentStatus NVARCHAR(50),
            @arrival DATETIME2,
            @currentDocumentDeliveryAt DATETIME2,
            @currentProcessStartAt DATETIME2,
            @currentRemissions NVARCHAR(2000),
            @currentPrecincts NVARCHAR(2000);

        SELECT
            @currentStatus = Status,
            @arrival = ArrivalAt,
            @currentDocumentDeliveryAt = DocumentDeliveryAt,
            @currentProcessStartAt = ProcessStartAt,
            @currentRemissions = Remissions,
            @currentPrecincts = Precincts
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50036, 'RESOURCE_NOT_FOUND', 1;
        IF @currentStatus <> 'ENTREGA_DOCUMENTOS' THROW 50037, 'INVALID_STATE_TRANSITION', 1;
        IF NULLIF(LTRIM(RTRIM(@Remissions)), '') IS NULL THROW 50054, 'VALIDATION_ERROR|REMISSIONS_REQUIRED', 1;
        IF NULLIF(LTRIM(RTRIM(@Precincts)), '') IS NULL THROW 50055, 'VALIDATION_ERROR|PRECINCTS_REQUIRED', 1;
        IF @DocumentDeliveryAt < @arrival THROW 50038, 'INVALID_PROCESS_START_AT', 1;
        IF @ProcessStartAt < @DocumentDeliveryAt THROW 50039, 'INVALID_PROCESS_START_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            DocumentDeliveryAt = @DocumentDeliveryAt,
            ProcessStartAt = @ProcessStartAt,
            Remissions = @Remissions,
            Precincts = @Precincts,
            Status = 'EN_PROCESO',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        DECLARE @currentDocumentDeliveryAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentDocumentDeliveryAt, 127);
        DECLARE @documentDeliveryAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @DocumentDeliveryAt, 127);
        DECLARE @currentProcessStartAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentProcessStartAt, 127);
        DECLARE @processStartAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @ProcessStartAt, 127);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'DocumentDeliveryAt', @OldValue = @currentDocumentDeliveryAtText, @NewValue = @documentDeliveryAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'ProcessStartAt', @OldValue = @currentProcessStartAtText, @NewValue = @processStartAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Remissions', @OldValue = @currentRemissions, @NewValue = @Remissions, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Precincts', @OldValue = @currentPrecincts, @NewValue = @Precincts, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = 'ENTREGA_DOCUMENTOS', @NewValue = 'EN_PROCESO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'ENTREGA_DOCUMENTOS', @NewStatus = 'EN_PROCESO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'START_PROCESS', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

