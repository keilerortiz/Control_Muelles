
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

