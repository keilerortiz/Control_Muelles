# Business Logic Specification – Línea Base de Producción

## Objetivo

Definir la lógica de negocio como única fuente de verdad funcional para la aplicación.

Este documento tiene prioridad sobre cualquier otra especificación técnica.

Toda implementación de:

- Base de datos.
- Backend.
- Frontend.
- APIs.
- Seguridad.
- Realtime.

Debe alinearse estrictamente con las reglas definidas aquí.

---

# Principios Fundamentales

## 1. Fuente de Verdad

La lógica de negocio gobierna:

- Estados.
- Transiciones.
- Validaciones.
- Restricciones.
- Roles.
- Acciones.
- Auditoría.

---

## 2. Backend como Autoridad Final

El frontend nunca toma decisiones de negocio.

Toda validación crítica ocurre en backend.

---

## 3. Máquinas de Estado Obligatorias

Todo flujo operacional debe modelarse mediante:

- Estados.
- Transiciones válidas.
- Acciones explícitas.

---

## 4. Trazabilidad

Toda operación crítica debe:

- Registrar auditoría.
- Identificar usuario.
- Registrar timestamp UTC.

---

# Estructura del Documento

Cada módulo debe documentarse usando la siguiente estructura.

---

# 1. Dominio

## Nombre

```text
Appointments
```

---

## Objetivo

Descripción funcional del dominio.

Ejemplo:

```text
Gestionar el ciclo de vida operativo de las citas logísticas.
```

---

# 2. Roles

## Definición

Cada rol debe especificar:

- Responsabilidades.
- Acciones permitidas.
- Restricciones.

---

## Estructura

| Rol | Descripción | Restricciones |
|---|---|---|
| ADMIN | Acceso total | Ninguna |
| SUPERVISOR | Gestión operativa | Sin configuración crítica |
| PLANEADOR | Planeación | Sin cierre operativo |
| CONSULTOR | Solo lectura | Sin mutaciones |

---

## Reglas

- Backend valida permisos.
- Frontend solo oculta UI.
- RBAC obligatorio.

---

# 3. Estados

## Definición

Todo recurso operacional debe tener estados explícitos.

---

## Estructura

| Código | Nombre | Final |
|---|---|---|
| PENDING | Pendiente | No |
| ACTIVE | Activo | No |
| COMPLETED | Completado | Sí |
| CANCELLED | Cancelado | Sí |

---

## Reglas

- Estados finales no pueden mutarse.
- Estados deben ser consistentes en:
  - Backend.
  - Frontend.
  - Base de datos.
  - APIs.

---

# 4. Transiciones de Estado

## Regla Crítica

Nunca modificar estados mediante:

```http
PATCH /resource/:id
```

---

## Estrategia

Endpoints de acción.

Ejemplo:

```http
POST /appointments/:id/start
POST /appointments/:id/complete
POST /appointments/:id/cancel
```

---

## Estructura

| Acción | Estado Origen | Estado Destino | Roles |
|---|---|---|---|
| start | PENDING | ACTIVE | SUPERVISOR |
| complete | ACTIVE | COMPLETED | SUPERVISOR |
| cancel | PENDING, ACTIVE | CANCELLED | ADMIN |

---

## Validaciones Obligatorias

Antes de cualquier transición validar:

- Estado origen válido.
- Estado destino permitido.
- Usuario autorizado.
- Recurso disponible.
- Restricciones operativas.

---

# 5. Validaciones de Negocio

## Regla

Toda validación debe documentarse explícitamente.

---

## Estructura

| Código | Regla | Error |
|---|---|---|
| APPT_001 | No duplicar código | DUPLICATE_CODE |
| APPT_002 | Fecha no puede ser pasada | INVALID_DATE |
| APPT_003 | Muelle debe estar libre | DOCK_OCCUPIED |

---

## Reglas

- Backend implementa.
- Frontend replica visualmente.
- Base de datos protege integridad.

---

# 6. Restricciones Operativas

## Definición

Condiciones obligatorias para ejecutar acciones.

---

## Ejemplo

```text
No se puede iniciar una operación si el recurso asignado está ocupado.
```

---

## Estructura

| Código | Restricción |
|---|---|
| OPS_001 | Máximo una operación activa por recurso |
| OPS_002 | No cerrar operación sin validación |

---

# 7. Entidades

## Objetivo

Definir entidades funcionales.

---

## Estructura

### Nombre

```text
Appointment
```

---

## Campos

| Campo | Tipo | Obligatorio |
|---|---|---|
| Id | int | Sí |
| Code | string | Sí |
| Status | string | Sí |
| ScheduledDate | datetime | Sí |

---

## Reglas

- Campos obligatorios.
- Restricciones.
- Valores únicos.
- Relaciones.

---

# 8. Relaciones

## Definición

Relaciones entre entidades.

---

## Ejemplo

| Origen | Relación | Destino |
|---|---|---|
| Appointment | belongsTo | User |
| Appointment | belongsTo | Dock |
| User | hasMany | Appointment |

---

# 9. Acciones Permitidas

## Objetivo

Definir acciones visibles y permitidas.

---

## Estructura

| Estado | Rol | Acción |
|---|---|---|
| PENDING | SUPERVISOR | Start |
| ACTIVE | SUPERVISOR | Complete |
| ACTIVE | ADMIN | Cancel |

---

## Reglas

- Backend valida.
- Frontend refleja visualmente.
- Acciones inválidas ocultas/deshabilitadas.

---

# 10. Reglas Realtime

## Objetivo

Definir comportamiento de sincronización.

---

## Reglas

- Backend emite snapshots completos.
- Frontend reemplaza estado local.
- No merge manual.
- Estados consistentes.

---

## Eventos

| Evento | Descripción |
|---|---|
| dashboard-update | Snapshot operacional |
| item-updated | Cambio individual |
| alerts-update | Alertas operativas |

---

# 11. Auditoría

## Operaciones Auditables

| Operación | Obligatoria |
|---|---|
| Login | Sí |
| Logout | Sí |
| Cambio estado | Sí |
| Creación | Sí |
| Eliminación | Sí |

---

## Campos de Auditoría

- usuario
- timestamp UTC
- acción
- valores anteriores
- valores nuevos

---

# 12. Reglas de UI

## Estados Visuales

| Estado | Color |
|---|---|
| PENDING | Amarillo |
| ACTIVE | Azul |
| COMPLETED | Verde |
| CANCELLED | Rojo |

---

## Reglas

- Colores consistentes.
- Badges reutilizables.
- Feedback inmediato.

---

# 13. Reglas API

## Endpoints

Toda transición debe exponerse mediante:

```http
POST /resource/:id/action
```

---

## Respuesta Estándar

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

---

# 14. Manejo de Errores

## Errores de Negocio

Formato:

```json
{
  "success": false,
  "message": "Transición inválida",
  "errorCode": "INVALID_STATE_TRANSITION"
}
```

---

## Reglas

- Errores semánticos.
- requestId obligatorio.
- Sin stacktrace.

---

# 15. Performance Rules

## Backend

- Validaciones eficientes.
- Operaciones atómicas.
- Stored procedures.
- Pooling SQL.

---

## Frontend

- Debounce.
- Lazy loading.
- Virtualización.

---

# 16. Seguridad

## Reglas

- RBAC obligatorio.
- Validación backend obligatoria.
- JWT obligatorio.
- Auditoría obligatoria.

---

# 17. Consistencia

## Base de Datos

Debe reflejar exactamente:

- Estados.
- Transiciones.
- Restricciones.

---

## Backend

Debe implementar:

- Máquinas de estado.
- Validaciones.
- Roles.
- Auditoría.

---

## Frontend

Debe reflejar:

- Acciones válidas.
- Estados visuales.
- Restricciones.
- Roles.

---

# 18. Checklist por Módulo

Cada módulo debe incluir:

- Roles.
- Estados.
- Transiciones.
- Validaciones.
- Restricciones.
- Entidades.
- Relaciones.
- Acciones.
- Auditoría.
- Eventos realtime.

---

# Reglas No Negociables

- Lógica de negocio tiene prioridad máxima.
- Backend es autoridad final.
- Máquinas de estado obligatorias.
- Auditoría obligatoria.
- Estados consistentes entre capas.
- Frontend no toma decisiones de negocio.
- Validaciones obligatorias.
- Seguridad obligatoria.
- Realtime consistente.
- Código listo para producción.

Fuente base adaptada desde la estructura de especificaciones empresariales y línea base operacional.

