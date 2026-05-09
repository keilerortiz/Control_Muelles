CREATE OR ALTER PROCEDURE dbo.usp_FinalizeAppointment
    @AppointmentId INT,
    @FinalizedAt DATETIME2,
    @MovedWeightKg DECIMAL(18,2),
    @OtcNonComplianceReason NVARCHAR(500) = NULL,
    @OtsNonComplianceReason NVARCHAR(500) = NULL,
    @NonComplianceComment NVARCHAR(1000) = NULL,
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
            @scheduled DATETIME2,
            @documentDelivery DATETIME2,
            @processStart DATETIME2,
            @processEnd DATETIME2,
            @standardTime INT,
            @currentFinalizedAt DATETIME2,
            @currentMovedWeightKg DECIMAL(18,2),
            @currentOtcReason NVARCHAR(500),
            @currentOtsReason NVARCHAR(500),
            @currentComment NVARCHAR(1000);

        SELECT
            @currentStatus = a.Status,
            @arrival = a.ArrivalAt,
            @scheduled = a.ScheduledAt,
            @documentDelivery = a.DocumentDeliveryAt,
            @processStart = a.ProcessStartAt,
            @processEnd = a.ProcessEndAt,
            @standardTime = ot.StandardTimeMinutes,
            @currentFinalizedAt = a.FinalizedAt,
            @currentMovedWeightKg = a.MovedWeightKg,
            @currentOtcReason = a.OtcNonComplianceReason,
            @currentOtsReason = a.OtsNonComplianceReason,
            @currentComment = a.NonComplianceComment
        FROM dbo.tbl_Appointment a
        INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
        WHERE a.Id = @AppointmentId AND a.IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50043, 'RESOURCE_NOT_FOUND', 1;
        IF @currentStatus <> 'PARA_FIRMAR' THROW 50044, 'INVALID_STATE_TRANSITION', 1;
        IF @FinalizedAt < @processEnd THROW 50045, 'INVALID_FINALIZED_AT', 1;

        DECLARE @baseTime DATETIME2 = CASE WHEN @arrival > @scheduled THEN @arrival ELSE @scheduled END;
        DECLARE @otcLimit DATETIME2 = DATEADD(MINUTE, 35, @baseTime);
        DECLARE @cumpleCita BIT = CASE WHEN @arrival <= DATEADD(MINUTE, 15, @scheduled) THEN 1 ELSE 0 END;
        DECLARE @otcFail BIT = CASE WHEN @cumpleCita = 1 AND @documentDelivery > @otcLimit THEN 1 ELSE 0 END;
        DECLARE @otsFail BIT = CASE WHEN DATEDIFF(MINUTE, @processStart, @processEnd) > @standardTime THEN 1 ELSE 0 END;

        IF @otcFail = 1 AND (@OtcNonComplianceReason IS NULL OR LTRIM(RTRIM(@OtcNonComplianceReason)) = '')
            THROW 50046, 'VALIDATION_ERROR|OTC_REASON_REQUIRED', 1;
        IF @otcFail = 0 AND NULLIF(LTRIM(RTRIM(@OtcNonComplianceReason)), '') IS NOT NULL
            THROW 50047, 'VALIDATION_ERROR|OTC_REASON_NOT_ALLOWED', 1;

        IF @otsFail = 1 AND (@OtsNonComplianceReason IS NULL OR LTRIM(RTRIM(@OtsNonComplianceReason)) = '')
            THROW 50048, 'VALIDATION_ERROR|OTS_REASON_REQUIRED', 1;
        IF @otsFail = 0 AND NULLIF(LTRIM(RTRIM(@OtsNonComplianceReason)), '') IS NOT NULL
            THROW 50049, 'VALIDATION_ERROR|OTS_REASON_NOT_ALLOWED', 1;

        IF (@otcFail = 1 OR @otsFail = 1) AND (@NonComplianceComment IS NULL OR LTRIM(RTRIM(@NonComplianceComment)) = '')
            THROW 50050, 'VALIDATION_ERROR|NON_COMPLIANCE_COMMENT_REQUIRED', 1;

        UPDATE dbo.tbl_Appointment
        SET
            FinalizedAt = @FinalizedAt,
            MovedWeightKg = @MovedWeightKg,
            OtcNonComplianceReason = @OtcNonComplianceReason,
            OtsNonComplianceReason = @OtsNonComplianceReason,
            NonComplianceComment = @NonComplianceComment,
            Status = 'FINALIZADO',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        DECLARE @currentFinalizedAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentFinalizedAt, 127);
        DECLARE @finalizedAtText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @FinalizedAt, 127);
        DECLARE @currentMovedWeightKgText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentMovedWeightKg);
        DECLARE @movedWeightKgText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @MovedWeightKg);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'FinalizedAt', @OldValue = @currentFinalizedAtText, @NewValue = @finalizedAtText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'MovedWeightKg', @OldValue = @currentMovedWeightKgText, @NewValue = @movedWeightKgText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'OtcNonComplianceReason', @OldValue = @currentOtcReason, @NewValue = @OtcNonComplianceReason, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'OtsNonComplianceReason', @OldValue = @currentOtsReason, @NewValue = @OtsNonComplianceReason, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'NonComplianceComment', @OldValue = @currentComment, @NewValue = @NonComplianceComment, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'Status', @OldValue = 'PARA_FIRMAR', @NewValue = 'FINALIZADO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'PARA_FIRMAR', @NewStatus = 'FINALIZADO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'FINALIZE', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

