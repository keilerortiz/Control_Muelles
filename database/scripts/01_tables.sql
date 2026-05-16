SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE TABLE dbo.tbl_Role (
    Id INT IDENTITY(1,1) NOT NULL,
    Code NVARCHAR(50) NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
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
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_User PRIMARY KEY (Id)
);
GO

CREATE UNIQUE INDEX UX_tbl_User_Email_Active
ON dbo.tbl_User (Email)
WHERE IsDeleted = 0;

CREATE TABLE dbo.tbl_UserRole (
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_UserRole PRIMARY KEY (UserId, RoleId),
    CONSTRAINT FK_tbl_UserRole_tbl_User FOREIGN KEY (UserId) REFERENCES dbo.tbl_User(Id),
    CONSTRAINT FK_tbl_UserRole_tbl_Role FOREIGN KEY (RoleId) REFERENCES dbo.tbl_Role(Id)
);

CREATE TABLE dbo.tbl_Client (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_Client PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_OperationType (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    StandardTimeMinutes INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_OperationType PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_Standard (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    StandardTimeMinutes INT NOT NULL,
    ToleranceMinutes INT NOT NULL DEFAULT 0,
    Description NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_Standard PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_VehicleType (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_VehicleType PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_Dock (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_Dock PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_NonComplianceReason (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    ReasonType NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_NonComplianceReason PRIMARY KEY (Id),
    CONSTRAINT CK_tbl_NonComplianceReason_ReasonType CHECK (ReasonType IN ('OTC', 'OTS'))
);

CREATE TABLE dbo.tbl_DockCapability (
    DockId INT NOT NULL,
    OperationTypeId INT NOT NULL,
    VehicleTypeId INT NOT NULL,
    CONSTRAINT PK_tbl_DockCapability PRIMARY KEY (DockId, OperationTypeId, VehicleTypeId),
    CONSTRAINT FK_tbl_DockCapability_tbl_Dock FOREIGN KEY (DockId) REFERENCES dbo.tbl_Dock(Id),
    CONSTRAINT FK_tbl_DockCapability_tbl_OperationType FOREIGN KEY (OperationTypeId) REFERENCES dbo.tbl_OperationType(Id),
    CONSTRAINT FK_tbl_DockCapability_tbl_VehicleType FOREIGN KEY (VehicleTypeId) REFERENCES dbo.tbl_VehicleType(Id)
);

CREATE TABLE dbo.tbl_BusinessRule (
    Id INT IDENTITY(1,1) NOT NULL,
    ClientId INT NOT NULL,
    VehicleTypeId INT NOT NULL,
    OperationTypeId INT NOT NULL,
    StandardId INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_BusinessRule PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_BusinessRule_tbl_Client FOREIGN KEY (ClientId) REFERENCES dbo.tbl_Client(Id),
    CONSTRAINT FK_tbl_BusinessRule_tbl_VehicleType FOREIGN KEY (VehicleTypeId) REFERENCES dbo.tbl_VehicleType(Id),
    CONSTRAINT FK_tbl_BusinessRule_tbl_OperationType FOREIGN KEY (OperationTypeId) REFERENCES dbo.tbl_OperationType(Id),
    CONSTRAINT FK_tbl_BusinessRule_tbl_Standard FOREIGN KEY (StandardId) REFERENCES dbo.tbl_Standard(Id)
);

CREATE UNIQUE INDEX UX_tbl_BusinessRule_Active
ON dbo.tbl_BusinessRule (ClientId, VehicleTypeId, OperationTypeId)
WHERE IsDeleted = 0;

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
    CreatedBy INT NULL,
    UpdatedBy INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_Appointment PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_Appointment_tbl_Client FOREIGN KEY (ClientId) REFERENCES dbo.tbl_Client(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_OperationType FOREIGN KEY (OperationTypeId) REFERENCES dbo.tbl_OperationType(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_VehicleType FOREIGN KEY (VehicleTypeId) REFERENCES dbo.tbl_VehicleType(Id),
    CONSTRAINT FK_tbl_Appointment_tbl_Dock FOREIGN KEY (DockId) REFERENCES dbo.tbl_Dock(Id)
);

CREATE TABLE dbo.tbl_Operator (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    OperatorLevel NVARCHAR(20) NOT NULL,
    MaxConcurrentOperations INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_Operator PRIMARY KEY (Id)
);

CREATE TABLE dbo.tbl_AppointmentOperator (
    AppointmentId INT NOT NULL,
    OperatorId INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ReleasedAt DATETIME2 NULL,
    CONSTRAINT PK_tbl_AppointmentOperator PRIMARY KEY (AppointmentId, OperatorId),
    CONSTRAINT FK_tbl_AppointmentOperator_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id),
    CONSTRAINT FK_tbl_AppointmentOperator_tbl_Operator FOREIGN KEY (OperatorId) REFERENCES dbo.tbl_Operator(Id)
);

CREATE TABLE dbo.tbl_AssignmentLog (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    DockId INT NULL,
    OperatorId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    AssignedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    AssignedByUserId INT NULL,
    ReleasedAt DATETIME2 NULL,
    ReleasedByUserId INT NULL,
    CorrelationId NVARCHAR(100) NULL,
    CONSTRAINT PK_tbl_AssignmentLog PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AssignmentLog_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE TABLE dbo.tbl_AppointmentStatusLog (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    PreviousStatus NVARCHAR(50) NULL,
    NewStatus NVARCHAR(50) NOT NULL,
    ChangedByUserId INT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CorrelationId NVARCHAR(100) NULL,
    CONSTRAINT PK_tbl_AppointmentStatusLog PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentStatusLog_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE TABLE dbo.tbl_RefreshToken (
    Id INT IDENTITY(1,1) NOT NULL,
    UserId INT NOT NULL,
    TokenHash NVARCHAR(255) NOT NULL,
    DeviceInfo NVARCHAR(500) NULL,
    ExpiresAt DATETIME2 NOT NULL,
    IsRevoked BIT NOT NULL DEFAULT 0,
    RevokedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_tbl_RefreshToken PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_RefreshToken_tbl_User FOREIGN KEY (UserId) REFERENCES dbo.tbl_User(Id)
);

CREATE TABLE dbo.tbl_AppointmentEvent (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    EventType NVARCHAR(50) NOT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedByUserId INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CorrelationId NVARCHAR(100) NULL,
    CONSTRAINT PK_tbl_AppointmentEvent PRIMARY KEY (Id),
    CONSTRAINT FK_tbl_AppointmentEvent_tbl_Appointment FOREIGN KEY (AppointmentId) REFERENCES dbo.tbl_Appointment(Id)
);

CREATE TABLE dbo.tbl_AppointmentAudit (
    Id INT IDENTITY(1,1) NOT NULL,
    AppointmentId INT NOT NULL,
    FieldName NVARCHAR(100) NOT NULL,
    OldValue NVARCHAR(MAX) NULL,
    NewValue NVARCHAR(MAX) NULL,
    ChangedByUserId INT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CorrelationId NVARCHAR(100) NULL,
    CONSTRAINT PK_tbl_AppointmentAudit PRIMARY KEY (Id)
);
