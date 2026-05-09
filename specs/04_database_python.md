# Database Specification – Línea Base de Producción

## Motor de Base de Datos

- SQL Server 2019+
- Compatibilidad total con SSMS.
- Optimizado para operaciones transaccionales y consultas operativas en tiempo real.
- Arquitectura orientada a encapsulamiento mediante views y stored procedures.

---

# Principios Fundamentales

## 1. Encapsulamiento Obligatorio

El backend no debe interactuar directamente con tablas de negocio.

Toda operación se realiza mediante:

- Views (`dbo.vw_*`)
- Stored Procedures (`dbo.usp_*`)

---

## 2. Prohibiciones

Prohibido:

- SQL de negocio embebido en backend.
- Queries ad-hoc complejas.
- Acceso directo a tablas desde controllers/services.
- Duplicación de lógica operacional.

---

## 3. Objetivos

- Alto rendimiento.
- Bajo acoplamiento.
- Seguridad.
- Escalabilidad.
- Consistencia transaccional.
- Observabilidad.
- Optimización centralizada.

---

# Convenciones de Nombrado

| Objeto | Convención |
|---|---|
| Tablas | `tbl_*` |
| Views | `vw_*` |
| Stored Procedures | `usp_*` |
| Índices | `IX_*` |
| Foreign Keys | `FK_*` |
| Primary Keys | `PK_*` |
| Constraints | `CK_*` |

---

# Convenciones de Tablas

## Reglas

- Singular.
- Prefijo `tbl_`.
- PK `Id INT IDENTITY(1,1)`.
- Timestamps UTC.
- `DATETIME2` obligatorio.
- Soft delete cuando aplique.

---

## Ejemplo

```sql
CREATE TABLE dbo.tbl_User (
    Id INT IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,

    CONSTRAINT PK_tbl_User PRIMARY KEY (Id)
)
```

---

# Normalización

## Obligatorio

Normalización mínima hasta 3FN.

---

## Reglas

- Evitar duplicación.
- Separar catálogos.
- Separar históricos.
- Relaciones explícitas.
- Integridad referencial estricta.

---

# Tipos de Datos

| Tipo | Uso |
|---|---|
| INT | PKs y FKs |
| BIGINT | Alto volumen |
| NVARCHAR | Texto |
| BIT | Booleanos |
| DATETIME2 | Fechas |
| DECIMAL | Valores monetarios/pesos |
| UNIQUEIDENTIFIER | UUIDs externos |

---

# Auditoría

## Campos Obligatorios

Tablas operativas deben incluir:

```sql
CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
CreatedBy INT NULL
UpdatedAt DATETIME2 NULL
UpdatedBy INT NULL
```

---

# Soft Delete

## Estrategia

Uso preferido:

```sql
IsDeleted BIT NOT NULL DEFAULT 0
DeletedAt DATETIME2 NULL
DeletedBy INT NULL
```

---

## Regla

Las views operativas no deben retornar registros eliminados.

---

# Relaciones

## Foreign Keys

Obligatorias.

Ejemplo:

```sql
ALTER TABLE dbo.tbl_Appointment
ADD CONSTRAINT FK_tbl_Appointment_tbl_User
FOREIGN KEY (CreatedBy)
REFERENCES dbo.tbl_User(Id)
```

---

# Índices

## Estrategia

Índices optimizados para:

- Dashboards.
- Filtros frecuentes.
- Consultas realtime.
- Estados operativos.
- Ordenamientos.

---

## Índices Covering

Uso obligatorio para rutas críticas.

Ejemplo:

```sql
CREATE INDEX IX_tbl_Appointment_Operational
ON dbo.tbl_Appointment(Status, ScheduledDate)
INCLUDE (ProviderId, DockId)
```

---

## Reglas

- Evitar over-indexing.
- Medir impacto.
- Priorizar consultas críticas.
- Índices alineados con views.

---

# Views

## Objetivo

Encapsular:

- Joins.
- Filtros.
- Reglas de visibilidad.
- Proyecciones operativas.

---

## Convención

```sql
dbo.vw_<Domain><Purpose>
```

Ejemplos:

- dbo.vw_AppointmentOperational
- dbo.vw_DockAvailability
- dbo.vw_OperationalSummary

---

## Reglas

- Solo lectura.
- Sin lógica mutable.
- Optimizadas.
- Compatibles con índices.
- Excluir registros eliminados.

---

## Ejemplo

```sql
CREATE VIEW dbo.vw_User
AS
SELECT
    u.Id,
    u.Name,
    u.Email,
    u.IsActive,
    u.CreatedAt
FROM dbo.tbl_User u
WHERE u.IsDeleted = 0
```

---

# Stored Procedures

## Objetivo

Encapsular:

- Mutaciones.
- Transacciones.
- Validaciones críticas.
- Auditoría.
- Operaciones complejas.

---

## Convención

```sql
dbo.usp_<Action><Domain>
```

Ejemplos:

- dbo.usp_CreateUser
- dbo.usp_UpdateAppointment
- dbo.usp_AssignDock
- dbo.usp_TransitionAppointment

---

## Reglas

- Transacciones explícitas.
- TRY/CATCH obligatorio.
- Rollback automático.
- Parámetros tipados.
- Sin SQL dinámico inseguro.

---

## Ejemplo

```sql
CREATE PROCEDURE dbo.usp_CreateUser
    @Name NVARCHAR(150),
    @Email NVARCHAR(255),
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO dbo.tbl_User (
            Name,
            Email,
            PasswordHash,
            CreatedAt
        )
        VALUES (
            @Name,
            @Email,
            @PasswordHash,
            GETUTCDATE()
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
```

---

# Máquinas de Estado

## Regla Crítica

Las transiciones de estado deben ejecutarse mediante stored procedures.

Nunca mediante updates directos.

---

## Ejemplo

```sql
EXEC dbo.usp_TransitionAppointment
```

---

## Validaciones

- Estado origen válido.
- Estado destino permitido.
- Usuario autorizado.
- Recursos disponibles.

---

# Fechas y UTC

## Regla Obligatoria

Toda fecha debe almacenarse en UTC.

Uso obligatorio:

```sql
GETUTCDATE()
```

---

# Seguridad

## Principios

- Menor privilegio.
- Acceso controlado.
- Roles SQL separados.
- Sin credenciales hardcoded.

---

## Backend

Debe consumir únicamente:

- Views.
- Stored procedures.

Permisos directos sobre tablas desaconsejados.

---

# Migraciones

## Estrategia

Uso obligatorio de:

- Alembic.
- Scripts versionados.

---

## Estructura

```text
/database
├── init.sql
├── migrations
│   ├── 001_create_users.sql
│   ├── 002_create_appointments.sql
│   └── ...
```

---

## Reglas

- Scripts idempotentes.
- Orden secuencial.
- Compatibilidad rollback.
- Probados en staging.

---

# Inicialización

## init.sql

Debe incluir:

- Tablas.
- Índices.
- Views.
- Stored procedures.
- Seeds iniciales.
- Roles básicos.

---

# Seeds

## Permitidos

- Roles.
- Estados.
- Catálogos.
- Configuraciones base.

---

## Prohibido

- Usuarios productivos.
- Datos sensibles.

---

# Concurrencia

## Estrategias

- Transacciones.
- Row locking.
- Validaciones de estado.
- Operaciones atómicas.

---

## Reglas

Evitar:

- Dirty reads.
- Lost updates.
- Race conditions.

---

# Rendimiento

## Reglas

- Views optimizadas.
- Índices alineados.
- Stored procedures eficientes.
- Evitar scans innecesarios.
- Evitar SELECT * en objetos críticos.

---

## Consultas Operativas

Objetivo:

- <200ms promedio.

---

# Backups

## Estrategia

### Producción

- Full backup diario.
- Transaction logs cada hora.
- Retención configurable.

---

## Almacenamiento

- Volumen externo.
- Cloud storage.
- Replicación opcional.

---

# Health Checks

## Validaciones

- Conectividad.
- Tiempo de respuesta.
- Disponibilidad.
- Estado de transacciones.

---

# Observabilidad

## Métricas Recomendadas

- Query duration.
- Deadlocks.
- CPU.
- IO.
- Locks.
- Waits.
- Conexiones activas.

---

# Escalabilidad

## Estrategias

- Réplicas de lectura.
- Particionado futuro.
- Índices covering.
- Caché distribuido.
- Balanceo de lectura.

---

# Integración Backend

## SQLAlchemy + pyodbc

Uso recomendado:

```python
query = text("EXEC dbo.usp_CreateUser :name")
```

---

## Reglas

- Queries parametrizadas.
- Pooling obligatorio.
- AsyncSession.
- Timeouts configurados.

---

# Reglas No Negociables

- SQL de negocio encapsulado.
- Views para lectura.
- Stored procedures para mutaciones.
- Integridad referencial obligatoria.
- UTC obligatorio.
- Índices optimizados.
- Scripts versionados.
- Seguridad desde diseño.
- Alto rendimiento obligatorio.
- Código listo para producción.

Fuente base adaptada desde: especificación original de base de datos.

