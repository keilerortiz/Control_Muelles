# Arquitectura General – Línea Base de Producción

## 1. Estilo Arquitectónico

Se adopta una arquitectura en capas estricta con separación física por dominio funcional. El principio fundamental es que cada capa solo se comunica con la inmediatamente inferior, evitando dependencias ocultas y acoplamiento innecesario.

```text
[Cliente]
    ↓
[FastAPI REST API / WebSocket]
    ↓
[Router / Controller]
    ↓
[Service]
    ↓
[Repository]
    ↓
[Views / Stored Procedures SQL Server]
```

---

# 2. Backend (Python + FastAPI)

## 2.1 Estructura de Capas

### Routers / Controllers

Responsabilidades:

- Manejo exclusivo de HTTP.
- Validación de entrada con Pydantic v2.
- Parseo de parámetros.
- Llamada a services.
- Serialización de respuestas.

Prohibido:

- Lógica de negocio.
- Acceso a base de datos.
- Transacciones.
- Reglas operativas.

Respuesta estándar:

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

---

### Services

Responsabilidades:

- Toda la lógica de negocio.
- Orquestación de operaciones.
- Validaciones complejas.
- Máquinas de estado.
- Control de concurrencia.
- Coordinación entre repositories.
- Manejo transaccional.

Características:

- Stateless.
- Independientes de FastAPI.
- Testeables de forma aislada.
- Inyectados mediante dependencias.

Prohibido:

- SQL.
- Objetos HTTP.
- Objetos Request/Response.

---

### Repositories

Única capa autorizada para interactuar con SQL Server.

Restricción crítica:

No se permite SQL de negocio embebido.

Toda operación se ejecuta mediante:

- Views (`dbo.vw_*`)
- Stored Procedures (`dbo.usp_*`)

Ejemplo permitido:

```python
await session.execute(
    text("EXEC dbo.usp_AssignAppointmentResource :appointment_id, :dock_id, :user_id"),
    params
)
```

Ejemplo prohibido:

```sql
SELECT *
FROM tbl_Appointment
JOIN tbl_Dock
WHERE ...
```

Características:

- Métodos atómicos.
- Sin lógica de negocio.
- Tipado explícito.
- Reutilizables.

---

### Middlewares

Middlewares globales:

| Middleware | Responsabilidad |
|---|---|
| Authentication | Validación JWT |
| Authorization | Validación RBAC |
| Request ID | Correlation ID |
| Logging | Trazabilidad |
| Error Handler | Manejo global de errores |
| CORS | Restricción de dominios |
| GZip | Compresión |
| Rate Limiter | Protección por IP |
| Security Headers | Headers seguros |

---

## 2.2 Organización Modular

Cada dominio se agrupa en módulos desacoplados:

```text
/backend
├── app
│   ├── api
│   │   └── v1
│   │       ├── auth
│   │       │   ├── router.py
│   │       │   ├── service.py
│   │       │   ├── repository.py
│   │       │   ├── schemas.py
│   │       │   └── dependencies.py
│   │       ├── appointments
│   │       ├── users
│   │       └── ...
│   ├── core
│   │   ├── config.py
│   │   ├── logging.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   └── constants.py
│   ├── db
│   │   ├── session.py
│   │   └── repositories
│   ├── middleware
│   ├── websocket
│   ├── utils
│   └── main.py
├── tests
├── alembic
└── requirements.txt
```

---

## 2.3 Flujo de una Solicitud Típica

### Ejemplo: Asignar Muelle

1. Cliente envía:

```http
POST /api/v1/appointments/:id/assign
```

2. Middleware JWT valida token.

3. Middleware RBAC valida roles.

4. Router valida payload con Pydantic.

5. Service:
   - Verifica disponibilidad.
   - Valida transición de estado.
   - Ejecuta reglas operativas.

6. Repository ejecuta:

```sql
EXEC dbo.usp_AssignAppointmentResource
```

7. Service emite evento realtime.

8. Router responde:

```json
{
  "success": true,
  "message": "Recurso asignado",
  "data": {}
}
```

---

# 3. Frontend (React + Vite)

## 3.1 Arquitectura General

La interfaz se construye sobre un layout persistente tipo SaaS:

- Sidebar colapsable.
- Topbar persistente.
- Área dinámica mediante React Router.

Estructura:

```text
AppLayout
├── Sidebar
├── Topbar
└── Content Outlet
```

---

## 3.2 Capas del Frontend

### Pages

- Representan rutas completas.
- Orquestan componentes.
- Consumen hooks.
- No contienen lógica de negocio.

### Components

Separación:

| Carpeta | Uso |
|---|---|
| ui | Design system reutilizable |
| layout | Layout principal |
| shared | Estados compartidos |
| dashboard | Widgets operativos |
| domain | Componentes de negocio |

---

### Hooks

Responsabilidades:

- Estado.
- Side effects.
- Integración API.
- WebSockets.

Ejemplos:

- useAuth
- useRealtime
- useSocket
- useOperationalData

---

### Services

Cliente HTTP centralizado con Axios:

- Interceptores JWT.
- Manejo de errores.
- Refresh token.
- Reintentos.

---

### Estado Global

Preferencia:

- Zustand.
- TanStack Query.

Stores típicos:

| Store | Uso |
|---|---|
| AuthStore | Usuario y sesión |
| UIStore | Sidebar y modales |
| SocketStore | Realtime |

---

## 3.3 Comunicación en Tiempo Real

FastAPI implementa WebSockets ASGI nativos.

Canal principal:

```text
dashboard-update
```

El backend envía snapshots completos.

Regla crítica:

El frontend reemplaza completamente el estado local.

Nunca hacer merge manual.

Estados de sincronización:

- LIVE
- DELAYED
- STALE
- DISCONNECTED

---

## 3.4 Enrutamiento y Seguridad

React Router con ProtectedRoute.

Validaciones:

- JWT válido.
- Roles autorizados.
- Rutas protegidas.

Roles típicos:

- PLANEADOR
- PORTERIA
- SUPERVISOR
- CONSULTOR
- ADMIN

---

# 4. Base de Datos (SQL Server)

## 4.1 Principio de Encapsulamiento

El backend Python no interactúa directamente con tablas.

Toda operación ocurre mediante:

- Views.
- Stored Procedures.

Beneficios:

- Seguridad.
- Bajo acoplamiento.
- Optimización centralizada.
- Rendimiento consistente.

---

## 4.2 Views

Definen:

- Proyecciones.
- Joins.
- Filtros operativos.

Ejemplos:

- dbo.vw_AppointmentOperational
- dbo.vw_DockAvailability
- dbo.vw_OperationalSummary

---

## 4.3 Stored Procedures

Encapsulan:

- Mutaciones.
- Transacciones.
- Auditoría.
- Operaciones críticas.

Ejemplos:

- dbo.usp_AssignAppointmentResource
- dbo.usp_TransitionAppointment
- dbo.usp_CalculateKPIs

---

## 4.4 Índices

Índices covering obligatorios para:

- Consultas realtime.
- Dashboards.
- Estados operativos.
- Filtros frecuentes.

Ejemplo:

```sql
IX_tbl_Appointment_OperationalHotPath
```

---

## 4.5 Convenciones

- Tablas con prefijo `tbl_`
- Views con prefijo `vw_`
- Stored procedures con prefijo `usp_`
- PKs tipo `Id INT IDENTITY`
- Normalización hasta 3FN

---

# 5. Contratos de Comunicación

## 5.1 REST API

Base URL:

```text
/api/v1
```

Formato estándar:

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

Códigos HTTP semánticos:

| Código | Uso |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 409 | Conflict |
| 500 | Internal Error |

---

## 5.2 WebSocket

Canal:

```text
dashboard-update
```

Payload:

```json
{
  "kpis": {},
  "appointments": [],
  "alerts": []
}
```

Frecuencia:

- 1-5 segundos.
- Heartbeat cada 10 segundos.

---

# 6. Seguridad Transversal

## Componentes Obligatorios

- JWT access token.
- Refresh token rotativo.
- bcrypt.
- HTTPS.
- CORS estricto.
- Rate limiting.
- Trusted hosts.
- Security headers.
- Validación estricta.
- Sanitización.

---

# 7. Principios y Buenas Prácticas

## DRY

Toda lógica repetida debe abstraerse.

---

## SOLID

Aplicación estricta en:

- Services.
- Repositories.
- Dependencias.
- Arquitectura modular.

---

## Backend Stateless

Cada request es independiente.

JWT elimina dependencias de sesión en memoria.

---

## Inmutabilidad Frontend

El estado local se reemplaza.

No se muta manualmente.

---

## Separación Estricta

| Capa | No Debe Conocer |
|---|---|
| Router | SQL |
| Service | HTTP |
| Repository | Reglas de negocio |

---

# 8. Despliegue y Escalabilidad

## Backend

- Gunicorn + Uvicorn workers.
- Docker.
- Kubernetes ready.
- Stateless.

---

## Frontend

- Nginx.
- Cache agresivo.
- CDN ready.

---

## SQL Server

- Réplicas de lectura.
- Backups automáticos.
- Failover opcional.

---

## WebSockets

Escalado horizontal mediante:

- Redis Pub/Sub.
- Sticky sessions opcionales.

---

# 9. Observabilidad

Preparado para:

- OpenTelemetry.
- Prometheus.
- Grafana.
- Loki.
- ELK.
- Datadog.

Métricas críticas:

- Latencia.
- Throughput.
- Errores.
- Saturación.
- Requests activas.
- Tiempo de respuesta.

---

# 10. Diagrama Conceptual

```text
┌───────────────────────────────┐
│ FRONTEND                      │
│ Pages → Components → Hooks    │
│ Services → Zustand/Query      │
│ WebSocket Client              │
└───────────────┬───────────────┘
                │ HTTPS
┌───────────────▼───────────────┐
│ BACKEND                       │
│ FastAPI                       │
│ Routers → Services            │
│ Services → Repositories       │
│ Middleware + WebSockets       │
└───────────────┬───────────────┘
                │ SQLAlchemy
┌───────────────▼───────────────┐
│ SQL SERVER                    │
│ Views                         │
│ Stored Procedures             │
│ Tablas                        │
└───────────────────────────────┘
```

Fuente base adaptada desde: fileciteturn0file1

