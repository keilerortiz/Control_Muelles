CREATE OR ALTER PROCEDURE dbo.usp_ReassignAppointmentResource
    @AppointmentId INT,
    @DockId INT,
    @OperatorIds NVARCHAR(MAX),
    @CandidatesVersion BIGINT,
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
            @currentDockId INT,
            @currentVersion INT;

        SELECT
            @currentStatus = Status,
            @currentDockId = DockId,
            @currentVersion = Version
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50026, 'RESOURCE_NOT_FOUND', 1;
        
        -- Optimistic Concurrency Check
        IF @ExpectedVersion IS NOT NULL AND @currentVersion <> @ExpectedVersion
            THROW 50040, 'CONCURRENCY_CONFLICT|The record has been modified by another user.', 1;

        IF @currentStatus <> 'EN_PROCESO' THROW 50027, 'INVALID_STATE_TRANSITION', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.tbl_Appointment a
            WHERE a.DockId = @DockId
              AND a.Status IN ('ENTREGA_DOCUMENTOS','EN_PROCESO')
              AND a.Id <> @AppointmentId
              AND a.IsDeleted = 0
        ) THROW 50029, 'DOCK_BUSY', 1;

        DECLARE @rawOperator TABLE (OperatorId INT NOT NULL);
        INSERT INTO @rawOperator (OperatorId)
        SELECT TRY_CAST(value AS INT)
        FROM STRING_SPLIT(@OperatorIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

        IF EXISTS (
            SELECT OperatorId
            FROM @rawOperator
            GROUP BY OperatorId
            HAVING COUNT(1) > 1
        ) THROW 50031, 'VALIDATION_ERROR|DUPLICATE_OPERATOR_IDS', 1;

        DECLARE @operator TABLE (OperatorId INT PRIMARY KEY);
        INSERT INTO @operator (OperatorId)
        SELECT DISTINCT OperatorId FROM @rawOperator;

        IF NOT EXISTS (SELECT 1 FROM @operator) THROW 50032, 'VALIDATION_ERROR|MISSING_OPERATORS', 1;

        IF EXISTS (
            SELECT 1
            FROM @operator op
            LEFT JOIN dbo.tbl_Operator o ON o.Id = op.OperatorId AND o.IsActive = 1
            WHERE o.Id IS NULL
        ) THROW 50033, 'VALIDATION_ERROR|INVALID_OPERATOR', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.tbl_Operator o
            INNER JOIN @operator op ON op.OperatorId = o.Id
            WHERE o.OperatorLevel = 'SENIOR'
        ) THROW 50034, 'VALIDATION_ERROR|MISSING_SENIOR_OPERATOR', 1;

        IF EXISTS (
            SELECT 1
            FROM @operator op
            INNER JOIN dbo.tbl_Operator o ON o.Id = op.OperatorId
            OUTER APPLY (
                SELECT COUNT(1) AS ActiveAssignments
                FROM dbo.tbl_AppointmentOperator ao
                WHERE ao.OperatorId = op.OperatorId
                  AND ao.IsActive = 1
                  AND ao.AppointmentId <> @AppointmentId
            ) active_usage
            WHERE active_usage.ActiveAssignments >= o.MaxConcurrentOperations
        ) THROW 50035, 'OPERATORS_BUSY', 1;

        UPDATE dbo.tbl_AppointmentOperator
        SET IsActive = 0, ReleasedAt = SYSUTCDATETIME()
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_AssignmentLog
        SET IsActive = 0, ReleasedAt = SYSUTCDATETIME(), ReleasedByUserId = @ChangedBy
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_Appointment
        SET
            DockId = @DockId,
            Status = 'EN_PROCESO',
            UpdatedAt = SYSUTCDATETIME(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId
          AND (@ExpectedVersion IS NULL OR Version = @ExpectedVersion);

        INSERT INTO dbo.tbl_AppointmentOperator (AppointmentId, OperatorId)
        SELECT @AppointmentId, OperatorId FROM @operator;

        INSERT INTO dbo.tbl_AssignmentLog (AppointmentId, DockId, OperatorId, AssignedByUserId)
        SELECT @AppointmentId, @DockId, OperatorId, @ChangedBy FROM @operator;

        DECLARE @currentDockIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @currentDockId);
        DECLARE @dockIdText NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), @DockId);

        EXEC dbo.usp_InsertAppointmentAudit @AppointmentId = @AppointmentId, @FieldName = 'DockId', @OldValue = @currentDockIdText, @NewValue = @dockIdText, @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        EXEC dbo.usp_InsertAppointmentStatusLog @AppointmentId = @AppointmentId, @PreviousStatus = 'EN_PROCESO', @NewStatus = 'EN_PROCESO', @ChangedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;
        EXEC dbo.usp_InsertAppointmentEvent @AppointmentId = @AppointmentId, @EventType = 'REASSIGN', @CreatedByUserId = @ChangedBy, @CorrelationId = @CorrelationId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
