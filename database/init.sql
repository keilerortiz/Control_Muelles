
SET NOCOUNT ON;

IF DB_ID(DB_NAME()) IS NULL
BEGIN
    RAISERROR('Database context is not set.', 16, 1);
    RETURN;
END;

IF OBJECT_ID('dbo.tbl_AppointmentAudit', 'U') IS NOT NULL DROP TABLE dbo.tbl_AppointmentAudit;
IF OBJECT_ID('dbo.tbl_AppointmentEvent', 'U') IS NOT NULL DROP TABLE dbo.tbl_AppointmentEvent;
IF OBJECT_ID('dbo.tbl_AssignmentLog', 'U') IS NOT NULL DROP TABLE dbo.tbl_AssignmentLog;
IF OBJECT_ID('dbo.tbl_AppointmentOperator', 'U') IS NOT NULL DROP TABLE dbo.tbl_AppointmentOperator;
IF OBJECT_ID('dbo.tbl_AppointmentStatusLog', 'U') IS NOT NULL DROP TABLE dbo.tbl_AppointmentStatusLog;
IF OBJECT_ID('dbo.tbl_RefreshToken', 'U') IS NOT NULL DROP TABLE dbo.tbl_RefreshToken;
IF OBJECT_ID('dbo.tbl_Appointment', 'U') IS NOT NULL DROP TABLE dbo.tbl_Appointment;
IF OBJECT_ID('dbo.tbl_DockCapability', 'U') IS NOT NULL DROP TABLE dbo.tbl_DockCapability;
IF OBJECT_ID('dbo.tbl_Operator', 'U') IS NOT NULL DROP TABLE dbo.tbl_Operator;
IF OBJECT_ID('dbo.tbl_Dock', 'U') IS NOT NULL DROP TABLE dbo.tbl_Dock;
IF OBJECT_ID('dbo.tbl_VehicleType', 'U') IS NOT NULL DROP TABLE dbo.tbl_VehicleType;
IF OBJECT_ID('dbo.tbl_OperationType', 'U') IS NOT NULL DROP TABLE dbo.tbl_OperationType;
IF OBJECT_ID('dbo.tbl_Client', 'U') IS NOT NULL DROP TABLE dbo.tbl_Client;
IF OBJECT_ID('dbo.tbl_UserRole', 'U') IS NOT NULL DROP TABLE dbo.tbl_UserRole;
IF OBJECT_ID('dbo.tbl_User', 'U') IS NOT NULL DROP TABLE dbo.tbl_User;
IF OBJECT_ID('dbo.tbl_Role', 'U') IS NOT NULL DROP TABLE dbo.tbl_Role;

CREATE TABLE dbo.tbl_Role (
    Id INT IDENTITY(1,1) NOT NULL,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_Role PRIMARY KEY (Id),
    CONSTRAINT UQ_tbl_Role_Code UNIQUE (Code)
);

CREATE TABLE dbo.tbl_User (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_User PRIMARY KEY (Id),
    CONSTRAINT UQ_tbl_User_Email UNIQUE (Email)
);

CREATE TABLE dbo.tbl_UserRole (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_UserRole PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_tbl_UserRole_tbl_User FOREIGN KEY (UserId) REFERENCES dbo.tbl_User(Id),
    CONSTRAINT FK_tbl_UserRole_tbl_Role FOREIGN KEY (RoleId) REFERENCES dbo.tbl_Role(Id)
);

CREATE TABLE dbo.tbl_Client (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_Client PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_OperationType (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    StandardTimeMinutes INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_OperationType PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_VehicleType (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_VehicleType PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_Dock (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_Dock PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_Operator (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    OperatorLevel NVARCHAR(20) NOT NULL,
    MaxConcurrentOperations INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_Operator PRIMARY KEY (Id),
    CONSTRAINT CK_tbl_Operator_Level CHECK (OperatorLevel IN ('SENIOR', 'JUNIOR'))
);

CREATE TABLE dbo.tbl_DockCapability (
    Id INT IDENTITY(1,1) NOT NULL,
    DockId INT NOT NULL,
    OperationTypeId INT NOT NULL,
    VehicleTypeId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_DockCapability PRIMARY KEY (Id),
    CONSTRAINT UQ_tbl_DockCapability UNIQUE (DockId, OperationTypeId, VehicleTypeId),
    CONSTRAINT FK_tbl_DockCapability_tbl_Dock FOREIGN KEY (DockId) REFERENCES dbo.tbl_Dock(Id),
    CONSTRAINT FK_tbl_DockCapability_tbl_OperationType FOREIGN KEY (OperationTypeId) REFERENCES dbo.tbl_OperationType(Id),
    CONSTRAINT FK_tbl_DockCapability_tbl_VehicleType FOREIGN KEY (VehicleTypeId) REFERENCES dbo.tbl_VehicleType(Id)
);
CREATE TABLE dbo.tbl_Appointment (
    Id INT IDENTITY(1,1) NOT NULL,
    ClientId INT NOT NULL,
    OperationTypeId INT NOT NULL,
    VehicleTypeId INT NOT NULL,
    DriverName NVARCHAR(150) NULL,
    DriverDocument NVARCHAR(80) NULL,
    VehiclePlate NVARCHAR(20) NULL,
    EstimatedTons DECIMAL(18,2) NOT NULL,
    DockId INT NULL,
    Status NVARCHAR(50) NOT NULL,
    ScheduledAt DATETIME2 NOT NULL,
    ArrivalAt DATETIME2 NULL,
    DocumentDeliveryAt DATETIME2 NULL,
    ProcessStartAt DATETIME2 NULL,
    ProcessEndAt DATETIME2 NULL,
    FinalizedAt DATETIME2 NULL,
    CheckoutAt DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    Remissions NVARCHAR(2000) NULL,
    Precincts NVARCHAR(2000) NULL,
    MovedWeightKg DECIMAL(18,2) NULL,
    NonComplianceComment NVARCHAR(1000) NULL,
    OtcNonComplianceReason NVARCHAR(500) NULL,
    OtsNonComplianceReason NVARCHAR(500) NULL,
    CancellationReason NVARCHAR(1000) NULL,
    IsNoShow BIT NOT NULL DEFAULT 0,
    IsLateArrival BIT NOT NULL DEFAULT 0,
    LateArrivalMinutes INT NULL,
    Version INT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT NULL,
    UpdatedAt DATETIME2 NULL,
    UpdatedBy INT NULL,
    CONSTRAINT PK_tbl_Appointment PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_Appointment_tbl_Client FOREIGN KEY (ClientId) REFERENCES dbo.tbl_Client(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_OperationType FOREIGN KEY (OperationTypeId) REFERENCES dbo.tbl_OperationType(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_VehicleType FOREIGN KEY (VehicleTypeId) REFERENCES dbo.tbl_VehicleType(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_Dock FOREIGN KEY (DockId) REFERENCES dbo.tbl_Dock(Id),
    CONSTRAINT CK_tbl_Appointment_Status CHECK (Status IN (
        'AGENDADA','EN_PATIO','ENTREGA_DOCUMENTOS','EN_PROCESO','PARA_FIRMAR','FINALIZADO','ATENDIDA','OPERACION_CANCELADA'
    ))
);

CREATE TABLE dbo.tbl_RefreshToken (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    TokenHash NVARCHAR(255) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    RevokedAt DATETIME2 NULL,
    DeviceInfo NVARCHAR(255) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_tbl_RefreshToken PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_RefreshToken_tbl_User FOREIGN KEY (UserId) REFERENCES dbo.tbl_User(Id)
);

CREATE TABLE dbo.tbl_AppointmentStatusLog (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    PreviousStatus NVARCHAR(50) NULL,
    NewStatus NVARCHAR(50) NOT NULL,
    ChangedByUserId INT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CorrelationId UNIQUEIDENTIFIER NULL,
    CONSTRAINT PK_tbl_AppointmentStatusLog PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentStatusLog_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE TABLE dbo.tbl_AppointmentOperator (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    OperatorId INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ReleasedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_AppointmentOperator PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentOperator_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id),
    CONSTRAINT FK_tbl_AppointmentOperator_tbl_Operator FOREIGN KEY (OperatorId) REFERENCES dbo.tbl_Operator(Id)
);

CREATE TABLE dbo.tbl_AssignmentLog (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    DockId INT NOT NULL,
    OperatorId INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedByUserId INT NULL,
    AssignedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ReleasedAt DATETIME2 NULL,
    ReleasedByUserId INT NULL,
    CONSTRAINT PK_tbl_AssignmentLog PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AssignmentLog_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id),
    CONSTRAINT FK_tbl_AssignmentLog_tbl_Dock FOREIGN KEY (DockId) REFERENCES dbo.tbl_Dock(Id),
    CONSTRAINT FK_tbl_AssignmentLog_tbl_Operator FOREIGN KEY (OperatorId) REFERENCES dbo.tbl_Operator(Id)
);

CREATE TABLE dbo.tbl_AppointmentEvent (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    EventType NVARCHAR(80) NOT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedByUserId INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CorrelationId UNIQUEIDENTIFIER NULL,
    CONSTRAINT PK_tbl_AppointmentEvent PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentEvent_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE TABLE dbo.tbl_AppointmentAudit (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    FieldName NVARCHAR(150) NOT NULL,
    OldValue NVARCHAR(MAX) NULL,
    NewValue NVARCHAR(MAX) NULL,
    ChangedByUserId INT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CorrelationId UNIQUEIDENTIFIER NULL,
    CONSTRAINT PK_tbl_AppointmentAudit PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentAudit_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE INDEX IX_tbl_Appointment_OperationalHotPath
ON dbo.tbl_Appointment(Status, ScheduledAt)
INCLUDE (DockId, ArrivalAt, DocumentDeliveryAt, ProcessStartAt, ProcessEndAt, FinalizedAt, CheckoutAt, Version);

CREATE INDEX IX_tbl_AppointmentOperator_Active
ON dbo.tbl_AppointmentOperator(OperatorId, IsActive)
INCLUDE (AppointmentId);

GO

CREATE OR ALTER VIEW dbo.vw_UserAuth
AS
SELECT
    u.Id,
    u.Name,
    u.Email,
    u.PasswordHash,
    u.IsActive,
    STRING_AGG(r.Code, ',') AS Roles
FROM dbo.tbl_User u
INNER JOIN dbo.tbl_UserRole ur ON ur.UserId = u.Id
INNER JOIN dbo.tbl_Role r ON r.Id = ur.RoleId
WHERE u.IsDeleted = 0
GROUP BY u.Id, u.Name, u.Email, u.PasswordHash, u.IsActive;
GO

CREATE OR ALTER VIEW dbo.vw_AppointmentOperational
AS
SELECT
    a.Id,
    a.ClientId,
    c.Name AS ClientName,
    a.OperationTypeId,
    ot.Name AS OperationTypeName,
    ot.StandardTimeMinutes,
    a.VehicleTypeId,
    vt.Name AS VehicleTypeName,
    a.DriverName,
    a.DriverDocument,
    a.VehiclePlate,
    a.EstimatedTons,
    a.DockId,
    d.Name AS DockName,
    a.Status,
    a.ScheduledAt,
    a.ArrivalAt,
    a.DocumentDeliveryAt,
    a.ProcessStartAt,
    a.ProcessEndAt,
    a.FinalizedAt,
    a.CheckoutAt,
    a.CancelledAt,
    a.Remissions,
    a.Precincts,
    a.MovedWeightKg,
    a.NonComplianceComment,
    a.OtcNonComplianceReason,
    a.OtsNonComplianceReason,
    a.CancellationReason,
    a.IsNoShow,
    a.IsLateArrival,
    a.LateArrivalMinutes,
    a.Version,
    a.CreatedAt,
    a.UpdatedAt
FROM dbo.tbl_Appointment a
INNER JOIN dbo.tbl_Client c ON c.Id = a.ClientId
INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
INNER JOIN dbo.tbl_VehicleType vt ON vt.Id = a.VehicleTypeId
LEFT JOIN dbo.tbl_Dock d ON d.Id = a.DockId
WHERE a.IsDeleted = 0;
GO

CREATE OR ALTER VIEW dbo.vw_AppointmentStatusLog
AS
SELECT
    l.Id,
    l.AppointmentId,
    l.PreviousStatus,
    l.NewStatus,
    l.ChangedByUserId,
    l.ChangedAt,
    l.CorrelationId
FROM dbo.tbl_AppointmentStatusLog l;
GO
CREATE OR ALTER VIEW dbo.vw_DashboardSummary
AS
WITH active_ops AS (
    SELECT *
    FROM dbo.tbl_Appointment
    WHERE IsDeleted = 0
),
base AS (
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'AGENDADA' THEN 1 ELSE 0 END) AS agendada,
        SUM(CASE WHEN Status = 'EN_PATIO' THEN 1 ELSE 0 END) AS en_patio,
        SUM(CASE WHEN Status = 'ENTREGA_DOCUMENTOS' THEN 1 ELSE 0 END) AS entrega_documentos,
        SUM(CASE WHEN Status = 'EN_PROCESO' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN Status = 'PARA_FIRMAR' THEN 1 ELSE 0 END) AS para_firmar,
        SUM(CASE WHEN Status = 'FINALIZADO' THEN 1 ELSE 0 END) AS finalizado,
        SUM(CASE WHEN Status = 'ATENDIDA' THEN 1 ELSE 0 END) AS atendida,
        SUM(CASE WHEN Status = 'OPERACION_CANCELADA' THEN 1 ELSE 0 END) AS cancelada
    FROM active_ops
)
SELECT
    total,
    agendada,
    en_patio,
    entrega_documentos,
    en_proceso,
    para_firmar,
    finalizado,
    atendida,
    cancelada,
    CASE WHEN total = 0 THEN 0 ELSE CAST((atendida * 100.0) / total AS DECIMAL(5,2)) END AS completion_rate
FROM base;
GO

CREATE OR ALTER VIEW dbo.vw_OperatorAvailability
AS
SELECT
    o.Id,
    o.Name,
    o.OperatorLevel,
    o.MaxConcurrentOperations,
    o.IsActive,
    COUNT(CASE WHEN ao.IsActive = 1 THEN 1 END) AS ActiveAssignments
FROM dbo.tbl_Operator o
LEFT JOIN dbo.tbl_AppointmentOperator ao ON ao.OperatorId = o.Id
GROUP BY o.Id, o.Name, o.OperatorLevel, o.MaxConcurrentOperations, o.IsActive;
GO

CREATE OR ALTER PROCEDURE dbo.usp_CreateAppointment
    @ClientId INT,
    @OperationTypeId INT,
    @VehicleTypeId INT,
    @EstimatedTons DECIMAL(18,2),
    @ScheduledAt DATETIME2,
    @CreatedBy INT,
    @AppointmentId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @ScheduledAt <= GETUTCDATE() THROW 50001, 'INVALID_DATE', 1;
        IF @EstimatedTons <= 0 THROW 50002, 'VALIDATION_ERROR', 1;

        INSERT INTO dbo.tbl_Appointment (
            ClientId, OperationTypeId, VehicleTypeId, EstimatedTons, Status, ScheduledAt, CreatedBy
        )
        VALUES (
            @ClientId, @OperationTypeId, @VehicleTypeId, @EstimatedTons, 'AGENDADA', @ScheduledAt, @CreatedBy
        );

        SET @AppointmentId = SCOPE_IDENTITY();

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, NULL, 'AGENDADA', @CreatedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'CREATE_APPOINTMENT', @CreatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_UpdateAppointment
    @AppointmentId INT,
    @ClientId INT,
    @OperationTypeId INT,
    @VehicleTypeId INT,
    @EstimatedTons DECIMAL(18,2),
    @ScheduledAt DATETIME2,
    @UpdatedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50003, 'RESOURCE_NOT_FOUND', 1;
        IF @currentStatus <> 'AGENDADA' THROW 50004, 'INVALID_STATUS_FOR_UPDATE', 1;
        IF @ScheduledAt <= GETUTCDATE() THROW 50005, 'INVALID_DATE', 1;

        UPDATE dbo.tbl_Appointment
        SET
            ClientId = @ClientId,
            OperationTypeId = @OperationTypeId,
            VehicleTypeId = @VehicleTypeId,
            EstimatedTons = @EstimatedTons,
            ScheduledAt = @ScheduledAt,
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @UpdatedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'UPDATE_APPOINTMENT', @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_DeleteAppointment
    @AppointmentId INT,
    @DeletedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus IS NULL THROW 50006, 'RESOURCE_NOT_FOUND', 1;
        IF @currentStatus <> 'AGENDADA' THROW 50007, 'INVALID_STATUS_FOR_DELETE', 1;

        UPDATE dbo.tbl_Appointment
        SET IsDeleted = 1, UpdatedAt = GETUTCDATE(), UpdatedBy = @DeletedBy, Version = Version + 1
        WHERE Id = @AppointmentId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_CheckInAppointment
    @AppointmentId INT,
    @DriverName NVARCHAR(150),
    @DriverDocument NVARCHAR(80),
    @VehiclePlate NVARCHAR(20),
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;
        IF @currentStatus <> 'AGENDADA' THROW 50008, 'INVALID_STATE_TRANSITION', 1;

        UPDATE dbo.tbl_Appointment
        SET
            DriverName = @DriverName,
            DriverDocument = @DriverDocument,
            VehiclePlate = @VehiclePlate,
            ArrivalAt = GETUTCDATE(),
            Status = 'EN_PATIO',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'AGENDADA', 'EN_PATIO', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'CHECKIN', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_AssignAppointmentResource
    @AppointmentId INT,
    @DockId INT,
    @OperatorIds NVARCHAR(MAX),
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50), @operationTypeId INT, @vehicleTypeId INT;
        SELECT @currentStatus = Status, @operationTypeId = OperationTypeId, @vehicleTypeId = VehicleTypeId
        FROM dbo.tbl_Appointment
        WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus <> 'EN_PATIO' THROW 50009, 'INVALID_STATE_TRANSITION', 1;

        IF NOT EXISTS (
            SELECT 1 FROM dbo.tbl_DockCapability dc
            WHERE dc.DockId = @DockId AND dc.OperationTypeId = @operationTypeId AND dc.VehicleTypeId = @vehicleTypeId
        ) THROW 50010, 'DOCK_BUSY', 1;

        IF EXISTS (
            SELECT 1
            FROM dbo.tbl_Appointment a
            WHERE a.DockId = @DockId
              AND a.Status IN ('EN_PATIO','ENTREGA_DOCUMENTOS','EN_PROCESO')
              AND a.Id <> @AppointmentId
              AND a.IsDeleted = 0
        ) THROW 50011, 'DOCK_BUSY', 1;

        DECLARE @operator TABLE (OperatorId INT PRIMARY KEY);
        INSERT INTO @operator (OperatorId)
        SELECT DISTINCT TRY_CAST(value AS INT)
        FROM STRING_SPLIT(@OperatorIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.tbl_Operator o
            INNER JOIN @operator op ON op.OperatorId = o.Id
            WHERE o.OperatorLevel = 'SENIOR'
        ) THROW 50012, 'VALIDATION_ERROR', 1;

        IF EXISTS (
            SELECT 1
            FROM @operator op
            INNER JOIN dbo.vw_OperatorAvailability oa ON oa.Id = op.OperatorId
            WHERE oa.ActiveAssignments >= oa.MaxConcurrentOperations
        ) THROW 50013, 'OPERATORS_BUSY', 1;

        UPDATE dbo.tbl_Appointment
        SET DockId = @DockId, Status = 'ENTREGA_DOCUMENTOS', UpdatedAt = GETUTCDATE(), UpdatedBy = @ChangedBy, Version = Version + 1
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentOperator (AppointmentId, OperatorId)
        SELECT @AppointmentId, OperatorId FROM @operator;

        INSERT INTO dbo.tbl_AssignmentLog (AppointmentId, DockId, OperatorId, AssignedByUserId)
        SELECT @AppointmentId, @DockId, OperatorId, @ChangedBy FROM @operator;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'EN_PATIO', 'ENTREGA_DOCUMENTOS', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'ASSIGN', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_ReassignAppointmentResource
    @AppointmentId INT,
    @DockId INT,
    @OperatorIds NVARCHAR(MAX),
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;
        IF @currentStatus <> 'EN_PROCESO' THROW 50014, 'INVALID_STATE_TRANSITION', 1;

        UPDATE dbo.tbl_AppointmentOperator
        SET IsActive = 0, ReleasedAt = GETUTCDATE()
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_AssignmentLog
        SET IsActive = 0, ReleasedAt = GETUTCDATE(), ReleasedByUserId = @ChangedBy
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        EXEC dbo.usp_AssignAppointmentResource @AppointmentId, @DockId, @OperatorIds, @ChangedBy;

        UPDATE dbo.tbl_Appointment
        SET Status = 'EN_PROCESO', UpdatedAt = GETUTCDATE(), UpdatedBy = @ChangedBy
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'REASSIGN', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_StartAppointmentProcess
    @AppointmentId INT,
    @ProcessStartAt DATETIME2,
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50), @arrival DATETIME2;
        SELECT @currentStatus = Status, @arrival = ArrivalAt FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus <> 'ENTREGA_DOCUMENTOS' THROW 50015, 'INVALID_STATE_TRANSITION', 1;
        IF @ProcessStartAt < @arrival THROW 50016, 'INVALID_PROCESS_START_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            DocumentDeliveryAt = ISNULL(DocumentDeliveryAt, GETUTCDATE()),
            ProcessStartAt = @ProcessStartAt,
            Status = 'EN_PROCESO',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'ENTREGA_DOCUMENTOS', 'EN_PROCESO', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'START_PROCESS', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_MoveAppointmentToSign
    @AppointmentId INT,
    @ProcessEndAt DATETIME2,
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50), @processStartAt DATETIME2;
        SELECT @currentStatus = Status, @processStartAt = ProcessStartAt FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus <> 'EN_PROCESO' THROW 50017, 'INVALID_STATE_TRANSITION', 1;
        IF @ProcessEndAt < @processStartAt THROW 50018, 'INVALID_PROCESS_END_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            ProcessEndAt = @ProcessEndAt,
            Status = 'PARA_FIRMAR',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        UPDATE dbo.tbl_AppointmentOperator
        SET IsActive = 0, ReleasedAt = GETUTCDATE()
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_AssignmentLog
        SET IsActive = 0, ReleasedAt = GETUTCDATE(), ReleasedByUserId = @ChangedBy
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'EN_PROCESO', 'PARA_FIRMAR', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'TO_SIGN', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_FinalizeAppointment
    @AppointmentId INT,
    @FinalizedAt DATETIME2,
    @MovedWeightKg DECIMAL(18,2),
    @OtcNonComplianceReason NVARCHAR(500) = NULL,
    @OtsNonComplianceReason NVARCHAR(500) = NULL,
    @NonComplianceComment NVARCHAR(1000) = NULL,
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50), @arrival DATETIME2, @scheduled DATETIME2, @documentDelivery DATETIME2, @processStart DATETIME2, @processEnd DATETIME2, @standardTime INT;

        SELECT
            @currentStatus = a.Status,
            @arrival = a.ArrivalAt,
            @scheduled = a.ScheduledAt,
            @documentDelivery = a.DocumentDeliveryAt,
            @processStart = a.ProcessStartAt,
            @processEnd = a.ProcessEndAt,
            @standardTime = ot.StandardTimeMinutes
        FROM dbo.tbl_Appointment a
        INNER JOIN dbo.tbl_OperationType ot ON ot.Id = a.OperationTypeId
        WHERE a.Id = @AppointmentId AND a.IsDeleted = 0;

        IF @currentStatus <> 'PARA_FIRMAR' THROW 50019, 'INVALID_STATE_TRANSITION', 1;
        IF @FinalizedAt < @processEnd THROW 50020, 'INVALID_FINALIZED_AT', 1;

        DECLARE @baseTime DATETIME2 = CASE WHEN @arrival > @scheduled THEN @arrival ELSE @scheduled END;
        DECLARE @otcLimit DATETIME2 = DATEADD(MINUTE, 35, @baseTime);
        DECLARE @cumpleCita BIT = CASE WHEN @arrival <= DATEADD(MINUTE, 15, @scheduled) THEN 1 ELSE 0 END;
        DECLARE @otcFail BIT = CASE WHEN @cumpleCita = 1 AND @documentDelivery > @otcLimit THEN 1 ELSE 0 END;
        DECLARE @otsFail BIT = CASE WHEN DATEDIFF(MINUTE, @processStart, @processEnd) > @standardTime THEN 1 ELSE 0 END;

        IF @otcFail = 1 AND (@OtcNonComplianceReason IS NULL OR LTRIM(RTRIM(@OtcNonComplianceReason)) = '') THROW 50021, 'VALIDATION_ERROR', 1;
        IF @otcFail = 0 AND @OtcNonComplianceReason IS NOT NULL THROW 50022, 'VALIDATION_ERROR', 1;

        IF @otsFail = 1 AND (@OtsNonComplianceReason IS NULL OR LTRIM(RTRIM(@OtsNonComplianceReason)) = '') THROW 50023, 'VALIDATION_ERROR', 1;
        IF @otsFail = 0 AND @OtsNonComplianceReason IS NOT NULL THROW 50024, 'VALIDATION_ERROR', 1;

        IF (@otcFail = 1 OR @otsFail = 1) AND (@NonComplianceComment IS NULL OR LTRIM(RTRIM(@NonComplianceComment)) = '')
            THROW 50025, 'VALIDATION_ERROR', 1;

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

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'PARA_FIRMAR', 'FINALIZADO', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'FINALIZE', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_CheckoutAppointment
    @AppointmentId INT,
    @CheckoutAt DATETIME2,
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50), @finalizedAt DATETIME2;
        SELECT @currentStatus = Status, @finalizedAt = FinalizedAt FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus <> 'FINALIZADO' THROW 50026, 'INVALID_STATE_TRANSITION', 1;
        IF @CheckoutAt < @finalizedAt THROW 50027, 'INVALID_CHECKOUT_AT', 1;

        UPDATE dbo.tbl_Appointment
        SET
            CheckoutAt = @CheckoutAt,
            Status = 'ATENDIDA',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, 'FINALIZADO', 'ATENDIDA', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'CHECKOUT', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_CancelAppointment
    @AppointmentId INT,
    @CancellationReason NVARCHAR(1000),
    @ChangedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @currentStatus NVARCHAR(50);
        SELECT @currentStatus = Status FROM dbo.tbl_Appointment WHERE Id = @AppointmentId AND IsDeleted = 0;

        IF @currentStatus NOT IN ('EN_PATIO', 'EN_PROCESO') THROW 50028, 'INVALID_STATE_TRANSITION', 1;
        IF @CancellationReason IS NULL OR LTRIM(RTRIM(@CancellationReason)) = '' THROW 50029, 'VALIDATION_ERROR', 1;

        UPDATE dbo.tbl_Appointment
        SET
            CancellationReason = @CancellationReason,
            CancelledAt = GETUTCDATE(),
            Status = 'OPERACION_CANCELADA',
            UpdatedAt = GETUTCDATE(),
            UpdatedBy = @ChangedBy,
            Version = Version + 1
        WHERE Id = @AppointmentId;

        UPDATE dbo.tbl_AppointmentOperator
        SET IsActive = 0, ReleasedAt = GETUTCDATE()
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        UPDATE dbo.tbl_AssignmentLog
        SET IsActive = 0, ReleasedAt = GETUTCDATE(), ReleasedByUserId = @ChangedBy
        WHERE AppointmentId = @AppointmentId AND IsActive = 1;

        INSERT INTO dbo.tbl_AppointmentStatusLog (AppointmentId, PreviousStatus, NewStatus, ChangedByUserId)
        VALUES (@AppointmentId, @currentStatus, 'OPERACION_CANCELADA', @ChangedBy);

        INSERT INTO dbo.tbl_AppointmentEvent (AppointmentId, EventType, CreatedByUserId)
        VALUES (@AppointmentId, 'CANCEL', @ChangedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_InsertRefreshToken
    @UserId INT,
    @TokenHash NVARCHAR(255),
    @ExpiresAt DATETIME2,
    @DeviceInfo NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO dbo.tbl_RefreshToken(UserId, TokenHash, ExpiresAt, DeviceInfo)
    VALUES (@UserId, @TokenHash, @ExpiresAt, @DeviceInfo);
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_RevokeRefreshToken
    @TokenHash NVARCHAR(255)
AS
BEGIN
    UPDATE dbo.tbl_RefreshToken
    SET RevokedAt = GETUTCDATE()
    WHERE TokenHash = @TokenHash AND RevokedAt IS NULL;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_RevokeUserRefreshTokens
    @UserId INT
AS
BEGIN
    UPDATE dbo.tbl_RefreshToken
    SET RevokedAt = GETUTCDATE()
    WHERE UserId = @UserId AND RevokedAt IS NULL;
END;
GO

INSERT INTO dbo.tbl_Role (Code, Name)
VALUES
    ('PLANEADOR', 'Planeador'),
    ('PORTERIA', 'Porteria'),
    ('SUPERVISOR', 'Supervisor'),
    ('CONSULTOR', 'Consultor'),
    ('ADMIN', 'Administrador');

INSERT INTO dbo.tbl_User (Name, Email, PasswordHash)
VALUES ('Admin Control Muelles', 'admin@muelles.local', '$2b$12$u.Ulh7F8OSMAx0Obn8uV2uQoarvb9KOFUrkUGVtBXyhOUx.ysqKGa');

INSERT INTO dbo.tbl_UserRole (UserId, RoleId)
SELECT 1, Id FROM dbo.tbl_Role WHERE Code = 'ADMIN';

INSERT INTO dbo.tbl_Client (Name) VALUES ('Cliente A'), ('Cliente B');
INSERT INTO dbo.tbl_OperationType (Name, StandardTimeMinutes) VALUES ('Descargue', 120), ('Cargue', 90);
INSERT INTO dbo.tbl_VehicleType (Name) VALUES ('Camion Sencillo'), ('Tractomula');
INSERT INTO dbo.tbl_Dock (Name) VALUES ('Muelle 1'), ('Muelle 2'), ('Muelle 3');

INSERT INTO dbo.tbl_Operator (Name, OperatorLevel) VALUES
    ('Operario Senior 1', 'SENIOR'),
    ('Operario Senior 2', 'SENIOR'),
    ('Operario Junior 1', 'JUNIOR'),
    ('Operario Junior 2', 'JUNIOR');

INSERT INTO dbo.tbl_DockCapability (DockId, OperationTypeId, VehicleTypeId)
SELECT d.Id, o.Id, v.Id
FROM dbo.tbl_Dock d
CROSS JOIN dbo.tbl_OperationType o
CROSS JOIN dbo.tbl_VehicleType v;
