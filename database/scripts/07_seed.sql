INSERT INTO dbo.tbl_Role (Code, Name)
VALUES
    ('PLANEADOR', 'Planeador'),
    ('PORTERIA', 'Porteria'),
    ('SUPERVISOR', 'Supervisor'),
    ('CONSULTOR', 'Consultor'),
    ('ADMIN', 'Administrador');

INSERT INTO dbo.tbl_User (Name, Email, PasswordHash)
VALUES
    ('Admin Control Muelles', 'admin@muelles.local', '$2b$12$pKhxGcPpzRMHKv7MRDQuQOOXo2HOSNo4MdI3z5zJmF5GF/LeUBNhe'),
    ('Supervisor Control Muelles', 'supervisor@muelles.local', '$2b$12$pKhxGcPpzRMHKv7MRDQuQOOXo2HOSNo4MdI3z5zJmF5GF/LeUBNhe'),
    ('Planeador Control Muelles', 'planeador@muelles.local', '$2b$12$pKhxGcPpzRMHKv7MRDQuQOOXo2HOSNo4MdI3z5zJmF5GF/LeUBNhe'),
    ('Porteria Control Muelles', 'porteria@muelles.local', '$2b$12$pKhxGcPpzRMHKv7MRDQuQOOXo2HOSNo4MdI3z5zJmF5GF/LeUBNhe');

INSERT INTO dbo.tbl_UserRole (UserId, RoleId)
SELECT u.Id, r.Id
FROM dbo.tbl_User u
INNER JOIN dbo.tbl_Role r ON
    (u.Email = 'admin@muelles.local' AND r.Code = 'ADMIN')
    OR (u.Email = 'supervisor@muelles.local' AND r.Code = 'SUPERVISOR')
    OR (u.Email = 'planeador@muelles.local' AND r.Code = 'PLANEADOR')
    OR (u.Email = 'porteria@muelles.local' AND r.Code = 'PORTERIA');

INSERT INTO dbo.tbl_Client (Name)
VALUES
    ('Alimentos Andinos S.A.S'),
    ('Distribuciones del Norte LTDA'),
    ('Logistica Integral Centro S.A.');

INSERT INTO dbo.tbl_OperationType (Name, StandardTimeMinutes)
VALUES
    ('Descargue', 120),
    ('Cargue', 90),
    ('Cross-docking', 75);

INSERT INTO dbo.tbl_VehicleType (Name)
VALUES
    ('Camion Sencillo'),
    ('Camion Doble Troque'),
    ('Tractomula');

INSERT INTO dbo.tbl_Standard (Name, StandardTimeMinutes, ToleranceMinutes, Description)
VALUES
    ('Descargue Camion Sencillo', 110, 15, 'Tiempo estandar para descargue con camion sencillo'),
    ('Descargue Doble Troque', 135, 20, 'Tiempo estandar para descargue con camion doble troque'),
    ('Descargue Tractomula', 160, 25, 'Tiempo estandar para descargue con tractomula'),
    ('Cargue Camion Sencillo', 85, 10, 'Tiempo estandar para cargue con camion sencillo'),
    ('Cargue Doble Troque', 100, 12, 'Tiempo estandar para cargue con camion doble troque'),
    ('Cargue Tractomula', 120, 15, 'Tiempo estandar para cargue con tractomula'),
    ('Cross-docking Camion Sencillo', 70, 10, 'Tiempo estandar para cross-docking con camion sencillo'),
    ('Cross-docking Doble Troque', 80, 10, 'Tiempo estandar para cross-docking con camion doble troque'),
    ('Cross-docking Tractomula', 95, 12, 'Tiempo estandar para cross-docking con tractomula');

INSERT INTO dbo.tbl_Dock (Name) VALUES ('Muelle 1'), ('Muelle 2'), ('Muelle 3');

INSERT INTO dbo.tbl_Operator (Name, OperatorLevel) VALUES
    ('Operario Senior 1', 'SENIOR'),
    ('Operario Senior 2', 'SENIOR'),
    ('Operario Senior 3', 'SENIOR'),
    ('Operario Senior 4', 'SENIOR'),
    ('Operario Junior 1', 'JUNIOR'),
    ('Operario Junior 2', 'JUNIOR'),
    ('Operario Junior 3', 'JUNIOR'),
    ('Operario Junior 4', 'JUNIOR');

INSERT INTO dbo.tbl_DockCapability (DockId, OperationTypeId, VehicleTypeId)
SELECT d.Id, o.Id, v.Id
FROM dbo.tbl_Dock d
CROSS JOIN dbo.tbl_OperationType o
CROSS JOIN dbo.tbl_VehicleType v;

INSERT INTO dbo.tbl_BusinessRule (ClientId, VehicleTypeId, OperationTypeId, StandardId)
SELECT
    c.Id AS ClientId,
    vt.Id AS VehicleTypeId,
    ot.Id AS OperationTypeId,
    s.Id AS StandardId
FROM dbo.tbl_Client c
CROSS JOIN dbo.tbl_VehicleType vt
CROSS JOIN dbo.tbl_OperationType ot
INNER JOIN dbo.tbl_Standard s ON s.Name = CONCAT(ot.Name, ' ', vt.Name);
