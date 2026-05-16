CREATE OR ALTER PROCEDURE dbo.usp_InsertAppointmentStatusLog
    @AppointmentId INT,
    @PreviousStatus NVARCHAR(50) = NULL,
    @NewStatus NVARCHAR(50),
    @ChangedByUserId INT = NULL,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    INSERT INTO dbo.tbl_AppointmentStatusLog (
        AppointmentId,
        PreviousStatus,
        NewStatus,
        ChangedByUserId,
        CorrelationId
    )
    VALUES (
        @AppointmentId,
        @PreviousStatus,
        @NewStatus,
        @ChangedByUserId,
        @CorrelationId
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_InsertAppointmentEvent
    @AppointmentId INT,
    @EventType NVARCHAR(80),
    @CreatedByUserId INT = NULL,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    INSERT INTO dbo.tbl_AppointmentEvent (
        AppointmentId,
        EventType,
        CreatedByUserId,
        CorrelationId
    )
    VALUES (
        @AppointmentId,
        @EventType,
        @CreatedByUserId,
        @CorrelationId
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_InsertAppointmentAudit
    @AppointmentId INT,
    @FieldName NVARCHAR(150),
    @OldValue NVARCHAR(MAX) = NULL,
    @NewValue NVARCHAR(MAX) = NULL,
    @ChangedByUserId INT = NULL,
    @CorrelationId UNIQUEIDENTIFIER = NULL
AS
BEGIN
    IF NOT (
        (@OldValue <> @NewValue)
        OR (@OldValue IS NULL AND @NewValue IS NOT NULL)
        OR (@OldValue IS NOT NULL AND @NewValue IS NULL)
    )
        RETURN;

    INSERT INTO dbo.tbl_AppointmentAudit (
        AppointmentId,
        FieldName,
        OldValue,
        NewValue,
        ChangedByUserId,
        CorrelationId
    )
    VALUES (
        @AppointmentId,
        @FieldName,
        @OldValue,
        @NewValue,
        @ChangedByUserId,
        @CorrelationId
    );
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_ValidateCandidatesVersion
    @CandidatesVersion BIGINT
AS
BEGIN
    DECLARE @currentEpoch BIGINT = DATEDIFF_BIG(SECOND, '1970-01-01T00:00:00', SYSUTCDATETIME());
    IF @CandidatesVersion IS NULL
       OR @CandidatesVersion > (@currentEpoch + 5)
       OR (@currentEpoch - @CandidatesVersion) > 30
    BEGIN
        THROW 50030, 'CANDIDATES_EXPIRED', 1;
    END;
END;
GO
