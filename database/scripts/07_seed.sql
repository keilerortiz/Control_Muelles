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
