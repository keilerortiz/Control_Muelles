# Business Logic Master Spec – Gestión de Muelles (Python Enterprise Edition)

## Objetivo

Definir la lógica de negocio oficial y única fuente de verdad funcional para el sistema de gestión operativa de muelles basado en:

- FastAPI
- SQL Server
- React/Vite
- Arquitectura SaaS enterprise
- Realtime operational dashboards
- Control transaccional estricto
- Concurrencia operativa

Este documento reemplaza y consolida todas las reglas operativas anteriores.

---

# 0. Alcance y Fuente de Verdad

## Prioridad Oficial

1. Backend services + state machine.
2. Este documento funcional.
3. Frontend únicamente consume el contrato.
4. Base de datos garantiza integridad.
5. UI nunca redefine negocio.

---

# 1. Principios No Negociables

## Reglas Fundamentales

1. Toda lógica de negocio vive en backend.
2. Toda transición ocurre mediante máquina de estados.
3. No existen cambios directos de estado.
4. Toda mutación es transaccional.
5. Toda transición genera auditoría.
6. Frontend nunca toma decisiones de negocio.
7. Backend es autoridad final.
8. Toda validación retorna error explícito y tipado.
9. Realtime opera mediante snapshots consistentes.
10. Toda operación debe ser trazable.

---

# 2. Roles Oficiales del Sistema

## Roles Operativos

| Rol | Descripción |
|---|---|
| PLANEADOR | Planeación operativa |
| PORTERIA | Control ingreso/salida |
| SUPERVISOR | Asignación y supervisión |

---

## Roles Complementarios

| Rol | Descripción |
|---|---|
| CONSULTOR | Solo lectura |
| ADMIN | Configuración y parametrización |

---

# 3. Estados Oficiales

## Estados de Cita

| Estado | Final |
|---|---|
| AGENDADA | No |
| EN_PATIO | No |
| ENTREGA_DOCUMENTOS | No |
| EN_PROCESO | No |
| PARA_FIRMAR | No |
| FINALIZADO | No |
| ATENDIDA | Sí |
| OPERACION_CANCELADA | Sí |

---

# 4. Estados Operativos de Recursos

## ACTIVE_RESOURCE_STATUSES

```text
EN_PATIO
ENTREGA_DOCUMENTOS
EN_PROCESO
```

---

## ACTIVE_OPERATIONAL_STATUSES

```text
EN_PATIO
ENTREGA_DOCUMENTOS
EN_PROCESO
PARA_FIRMAR
```

---

# 5. Máquina de Estados Oficial

## Flujo Principal

```text
AGENDADA
→ EN_PATIO
→ ENTREGA_DOCUMENTOS
→ EN_PROCESO
→ PARA_FIRMAR
→ FINALIZADO
→ ATENDIDA
```

---

## Flujo de Cancelación

```text
EN_PATIO → OPERACION_CANCELADA
EN_PROCESO → OPERACION_CANCELADA
```

---

## Reasignación

```text
EN_PROCESO → EN_PROCESO
```

---

# 6. Tabla Oficial de Transiciones

| Acción | From | To | Actor |
|---|---|---|---|
| checkIn | AGENDADA | EN_PATIO | PORTERIA |
| assignResources | EN_PATIO | ENTREGA_DOCUMENTOS | SUPERVISOR |
| reassignResources | EN_PROCESO | EN_PROCESO | SUPERVISOR |
| startProcess | ENTREGA_DOCUMENTOS | EN_PROCESO | PLANEADOR |
| toSign | EN_PROCESO | PARA_FIRMAR | PLANEADOR |
| finalize | PARA_FIRMAR | FINALIZADO | SUPERVISOR |
| checkout | FINALIZADO | ATENDIDA | PORTERIA |
| cancel | EN_PATIO / EN_PROCESO | OPERACION_CANCELADA | SUPERVISOR |

---

# 7. Contrato HTTP Oficial

## Base URL

```text
/api/v1/appointments
```

---

# 8. Endpoints de Lectura

| Endpoint | Descripción |
|---|---|
| GET /dashboard-summary | Dashboard operativo |
| GET / | Listado |
| GET /:id | Detalle |
| GET /:id/status-log | Historial |
| GET /:id/candidates | Candidatos |

---

# 9. Endpoints de Mutación

| Endpoint | Acción |
|---|---|
| POST / | Crear |
| PUT /:id | Editar |
| DELETE /:id | Eliminar |
| POST /:id/checkin | Check-in |
| POST /:id/assign | Asignar |
| POST /:id/reassign | Reasignar |
| POST /:id/start-process | Iniciar proceso |
| POST /:id/to-sign | Pasar a firmar |
| POST /:id/finalize | Finalizar |
| POST /:id/checkout | Checkout |
| POST /:id/cancel | Cancelar |

---

# 10. Matriz Oficial de Roles

| Endpoint | Roles |
|---|---|
| GET /appointments* | Todos autenticados |
| GET /:id/candidates | SUPERVISOR |
| POST / | PLANEADOR |
| PUT /:id | PLANEADOR |
| DELETE /:id | PLANEADOR |
| POST /:id/checkin | PORTERIA |
| POST /:id/assign | SUPERVISOR |
| POST /:id/reassign | SUPERVISOR |
| POST /:id/start-process | PLANEADOR |
| POST /:id/to-sign | PLANEADOR |
| POST /:id/finalize | SUPERVISOR |
| POST /:id/checkout | PORTERIA |
| POST /:id/cancel | SUPERVISOR |

---

# 11. Contrato Estándar API

## Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

---

## Error Controlado

```json
{
  "success": false,
  "message": "Error",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  },
  "correlationId": "uuid"
}
```

---

# 12. Modelo de Datos Funcional

## tbl_Appointment

| Campo | Tipo |
|---|---|
| Id | int |
| ClientId | int |
| OperationTypeId | int |
| VehicleTypeId | int |
| DriverName | string |
| DriverDocument | string |
| VehiclePlate | string |
| EstimatedTons | decimal |
| DockId | int |
| Status | string |
| scheduled_at | datetime |
| arrival_at | datetime |
| document_delivery_at | datetime |
| process_start_at | datetime |
| process_end_at | datetime |
| finalized_at | datetime |
| checkout_at | datetime |
| cancelled_at | datetime |
| Remissions | string |
| Precincts | string |
| MovedWeightKg | decimal |
| NonComplianceComment | string |
| CancellationReason | string |

---

# 13. Tablas Operativas Obligatorias

| Tabla | Uso |
|---|---|
| tbl_AppointmentStatusLog | Trazabilidad estados |
| tbl_AppointmentOperator | Operarios activos |
| tbl_AssignmentLog | Historial asignación |
| tbl_AppointmentEvent | Eventos operativos |
| tbl_AppointmentAudit | Auditoría granular |

---

# 14. Flujo – Crear Cita

## Endpoint

```text
POST /appointments
```

---

## Actor

```text
PLANEADOR
```

---

## Campos Requeridos

- clientId
- operationTypeId
- vehicleTypeId
- scheduledAt
- estimatedTons

---

## Validaciones

1. scheduledAt futura.
2. estimatedTons > 0.
3. Configuración cliente-operación-vehículo válida.
4. Usuario autenticado.
5. Rol válido.

---

## Efectos

1. Estado inicial AGENDADA.
2. Status log inicial.
3. Evento CREATE_APPOINTMENT.
4. Auditoría inicial.

---

# 15. Flujo – Editar Cita

## Endpoint

```text
PUT /appointments/:id
```

---

## Restricciones

1. Solo AGENDADA.
2. Debe existir cambio real.
3. Fecha sigue siendo futura.
4. Validación parametrización.

---

# 16. Flujo – Eliminar Cita

## Endpoint

```text
DELETE /appointments/:id
```

---

## Restricción

Solo AGENDADA.

---

# 17. Flujo – Check-In

## Endpoint

```text
POST /appointments/:id/checkin
```

---

## Actor

```text
PORTERIA
```

---

## Validaciones

1. Estado AGENDADA.
2. driverName obligatorio final.
3. driverDocument obligatorio final.
4. vehiclePlate obligatorio final.

---

## Transición

```text
AGENDADA → EN_PATIO
```

---

## Efectos

1. Guarda arrival_at.
2. Completa datos conductor.
3. Status log.
4. Evento CHECKIN.

---

# 18. Flujo – Obtener Candidatos

## Endpoint

```text
GET /appointments/:id/candidates
```

---

## Actor

```text
SUPERVISOR
```

---

## Reglas

1. TTL = 30 segundos.
2. Versionado obligatorio.
3. strict_candidates opcional.

---

# 19. Flujo – Asignar Recursos

## Endpoint

```text
POST /appointments/:id/assign
```

---

## Payload Requerido

- dockId
- seniorIds[]

---

## Payload Opcional

- juniorIds[]
- candidatesVersion

---

## Reglas Críticas

1. Estado EN_PATIO.
2. Muelle disponible.
3. Operarios disponibles.
4. Al menos un SENIOR.
5. Sin IDs repetidos.
6. Concurrencia validada.

---

## Transición

```text
EN_PATIO → ENTREGA_DOCUMENTOS
```

---

## Efectos

1. Asignación operadores.
2. AssignmentLog.
3. Status log.
4. Operadores ocupados.
5. Evento ASSIGN.

---

# 20. Flujo – Reasignar Recursos

## Endpoint

```text
POST /appointments/:id/reassign
```

---

## Reglas

1. Solo EN_PROCESO.
2. Cierra asignaciones activas.
3. Libera recursos previos.
4. Valida concurrencia nuevamente.

---

## Transición

```text
EN_PROCESO → EN_PROCESO
```

---

## Efectos

1. Cierre AssignmentLog.
2. Nuevas asignaciones.
3. Nuevo status log.
4. Evento REASSIGN.

---

# 21. Flujo – Iniciar Proceso

## Endpoint

```text
POST /appointments/:id/start-process
```

---

## Validaciones

1. Estado ENTREGA_DOCUMENTOS.
2. processStartAt >= documentDeliveryAt.
3. documentDeliveryAt >= arrivalAt.

---

## Transición

```text
ENTREGA_DOCUMENTOS → EN_PROCESO
```

---

# 22. Flujo – Pasar a Firmar

## Endpoint

```text
POST /appointments/:id/to-sign
```

---

## Efectos

1. Libera operadores.
2. Mantiene DockId.
3. Guarda process_end_at.
4. Cierra AssignmentLog.

---

## Nota Operativa

PARA_FIRMAR no bloquea muelle.

---

# 23. Flujo – Finalizar

## Endpoint

```text
POST /appointments/:id/finalize
```

---

## Validaciones KPI

### OTC

- Obligatorio causal si incumple.
- Prohibido causal si cumple.

---

### OTS

- Obligatorio causal si incumple.
- Prohibido causal si cumple.

---

### Comentarios

nonComplianceComment obligatorio cuando existan causales.

---

## Transición

```text
PARA_FIRMAR → FINALIZADO
```

---

# 24. Flujo – Checkout

## Endpoint

```text
POST /appointments/:id/checkout
```

---

## Transición

```text
FINALIZADO → ATENDIDA
```

---

# 25. Flujo – Cancelación

## Endpoint

```text
POST /appointments/:id/cancel
```

---

## Restricciones

1. Solo EN_PATIO o EN_PROCESO.
2. cancellationReason obligatorio.

---

## Efectos

1. Libera operadores.
2. Cierra AssignmentLog.
3. Guarda motivo.
4. Evento CANCEL.

---

# 26. KPIs Oficiales

## Cumple Cita

```text
arrivalAt <= scheduledAt + 15 minutos
```

---

# 27. KPI OTC

## Fórmula

```text
baseTime = max(arrivalAt, scheduledAt)
otcLimitAt = baseTime + 35 minutos
```

---

## Resultado

```text
documentDeliveryAt <= otcLimitAt
```

---

## Restricción

Si cumpleCita = false:

```text
OTC = null
```

---

# 28. KPI OTS

## Fórmula

```text
ceil(processEndAt - processStartAt)
<= standardTimeMinutes
```

---

# 29. SLA Extendidos

## Indicadores

| KPI | Fórmula |
|---|---|
| assignmentDelay | assignTime - arrivalAt |
| startDelay | processStartAt - documentDeliveryAt |
| checkoutDelay | checkoutAt - finalizedAt |

---

# 30. Prioridad Operativa

## PriorityLevel

| Nivel | Valor |
|---|---|
| BAJA | 1 |
| MEDIA | 2 |
| ALTA | 3 |
| CRITICA | 4 |

---

# 31. Motor de Cola

## QueueScore

```text
PriorityLevel
+ SLA breach
+ arrivalAt
+ scheduledAt
```

---

# 32. No-Show y Tardanza

## Campos

| Campo | Uso |
|---|---|
| IsNoShow | No presentación |
| IsLateArrival | Llegada tardía |
| LateArrivalMinutes | Minutos retraso |

---

# 33. Capacidad de Muelles

## tbl_DockCapability

Validación por:

- OperationTypeId
- VehicleTypeId

---

# 34. Capacidad de Operarios

## Campo

```text
MaxConcurrentOperations
```

Preparado para multi-asignación futura.

---

# 35. Auditoría

## tbl_AppointmentAudit

Campos:

- FieldName
- OldValue
- NewValue
- ChangedByUserId
- ChangedAt

---

# 36. Eventos Operativos

## tbl_AppointmentEvent

Eventos:

- CHECKIN
- ASSIGN
- REASSIGN
- START_PROCESS
- TO_SIGN
- FINALIZE
- CHECKOUT
- CANCEL
- UPDATE_APPOINTMENT
- NO_SHOW_MARK
- LATE_ARRIVAL

---

# 37. Reglas de Concurrencia

## Operarios

No pueden existir:

```text
IsActive = 1
```

en múltiples citas simultáneas.

---

## Muelles

No pueden existir duplicados en:

```text
EN_PATIO
ENTREGA_DOCUMENTOS
EN_PROCESO
```

---

# 38. Dashboard Operativo

## dashboard-summary

Debe retornar:

- KPIs.
- Alertas.
- Queue pressure.
- SLA metrics.
- Estado operacional.

---

# 39. Alertas Operativas

| Alerta | Regla |
|---|---|
| Retrasada | > standardTimeMinutes |
| En riesgo | >= 80% SLA |
| Esperando asignación | EN_PATIO sin operadores |
| Sin operadores | recurso activo sin operadores |

---

# 40. Realtime

## Evento Socket

```text
appointment-changed
```

---

## Payload

```json
{
  "action": "ASSIGN",
  "appointmentId": 1,
  "status": "EN_PROCESO",
  "correlationId": "uuid"
}
```

---

# 41. Reglas Frontend

## Obligatorio

1. Solicitar candidates antes de assign/reassign.
2. Mostrar solo acciones válidas.
3. No renderizar botones inválidos.
4. Renderizar errores backend exactos.
5. Backend como autoridad final.

---

# 42. Estados Visuales

| Estado | Color |
|---|---|
| AGENDADA | Gris |
| EN_PATIO | Amarillo |
| ENTREGA_DOCUMENTOS | Azul |
| EN_PROCESO | Azul intenso |
| PARA_FIRMAR | Naranja |
| FINALIZADO | Verde |
| ATENDIDA | Verde oscuro |
| OPERACION_CANCELADA | Rojo |

---

# 43. Errores de Negocio Oficiales

## Validación

- VALIDATION_ERROR
- INVALID_DATE
- INVALID_PROCESS_START_AT
- INVALID_PROCESS_END_AT
- INVALID_FINALIZED_AT
- INVALID_CHECKOUT_AT

---

## Concurrencia

- DOCK_BUSY
- OPERATORS_BUSY
- CANDIDATES_EXPIRED

---

## Estado

- INVALID_STATE_TRANSITION
- INVALID_STATUS_FOR_UPDATE
- INVALID_STATUS_FOR_DELETE

---

# 44. Reglas Técnicas Obligatorias

1. Toda mutación mediante service layer.
2. Toda mutación transaccional.
3. Rollback obligatorio.
4. Logging estructurado.
5. Async obligatorio.
6. Backend stateless.
7. SQL encapsulado.
8. Realtime snapshot-based.

---

# 45. Checklist de Auditoría

## Validaciones

1. Trazabilidad completa.
2. Sin operarios duplicados.
3. Sin muelles duplicados.
4. KPIs auditables.
5. Cancelaciones justificadas.
6. Checkout obligatorio.

---

# 46. Reglas No Negociables

- Máquina de estados estricta.
- Backend como autoridad final.
- Frontend sin lógica de negocio.
- Concurrencia obligatoria.
- Auditoría obligatoria.
- Realtime consistente.
- SQL transaccional obligatorio.
- Seguridad enterprise obligatoria.
- Arquitectura modular obligatoria.
- Código listo para producción.

Fuente base adaptada desde: business-logic-muelles.md

