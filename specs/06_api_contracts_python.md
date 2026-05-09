# API Contracts – Línea Base de Producción

## Base URL y Versionado

### URL Base

```text
/api/v1
```

---

## Estrategia de Versionado

El versionado se implementa en la ruta.

Ejemplos:

```text
/api/v1
/api/v2
```

---

## Reglas

- Cambios incompatibles requieren nueva versión.
- Cambios retrocompatibles permanecen en la misma versión.
- Endpoints deprecated deben anunciarse previamente.

---

# Principios Generales

## RESTful

La API debe seguir convenciones REST.

---

## Stateless

Cada request debe ser independiente.

---

## Backend como Fuente de Verdad

La API siempre retorna el estado oficial.

---

## JSON Obligatorio

Todas las requests y responses usan:

```http
Content-Type: application/json
```

---

# Formato Estándar de Respuesta

## Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operación completada",
  "data": {}
}
```

---

## Respuesta de Error

```json
{
  "success": false,
  "message": "Error de validación",
  "errorCode": "VALIDATION_ERROR",
  "requestId": "uuid",
  "data": {}
}
```

---

## Reglas

| Campo | Obligatorio |
|---|---|
| success | Sí |
| message | Sí |
| data | Sí |
| errorCode | Solo errores |
| requestId | Solo errores |

---

# Autenticación

## Authorization Header

Formato obligatorio:

```http
Authorization: Bearer <access_token>
```

---

## Endpoints Públicos

Solo:

```text
POST /auth/login
POST /auth/refresh
```

---

## Endpoints Protegidos

Todos los demás requieren JWT válido.

---

# Roles y Permisos

## RBAC

Cada endpoint debe declarar:

- Roles permitidos.
- Acciones autorizadas.

---

## Ejemplo

```text
[ADMIN, SUPERVISOR]
```

---

## Errores

| Código | Uso |
|---|---|
| 401 | Token inválido |
| 403 | Rol insuficiente |

---

# Códigos HTTP

| Código | Uso |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Business Error |
| 429 | Rate Limited |
| 500 | Internal Error |

---

# Convenciones REST

## Recursos

- Plural.
- Inglés.
- snake_case prohibido.
- kebab-case opcional.

---

## Ejemplos

Correcto:

```text
/users
/appointments
/refresh-tokens
```

Incorrecto:

```text
/getUsers
/user_list
```

---

# Endpoints CRUD

## Listado

```http
GET /api/v1/items
```

---

## Parámetros Estándar

| Parámetro | Tipo | Default |
|---|---|---|
| skip | int | 0 |
| take | int | 20 |
| sortBy | string | null |
| search | string | null |

---

## Response

```json
{
  "success": true,
  "message": "Listado obtenido",
  "data": {
    "items": [],
    "total": 100,
    "skip": 0,
    "take": 20
  }
}
```

---

## Obtener Detalle

```http
GET /api/v1/items/:id
```

---

## Crear Recurso

```http
POST /api/v1/items
```

---

## Actualización Completa

```http
PUT /api/v1/items/:id
```

---

## Actualización Parcial

```http
PATCH /api/v1/items/:id
```

---

## Eliminación

```http
DELETE /api/v1/items/:id
```

---

# Paginación

## Estrategia

Paginación basada en:

- skip
- take

---

## Reglas

| Parámetro | Regla |
|---|---|
| skip | >= 0 |
| take | máximo 100 |

---

## Ejemplo

```http
GET /items?skip=0&take=20
```

---

# Ordenamiento

## Parámetro

```text
sortBy
```

---

## Orden Descendente

Prefijo:

```text
-
```

Ejemplo:

```http
GET /items?sortBy=-createdAt
```

---

## Reglas

Solo campos whitelisted.

---

# Filtrado

## Igualdad

```http
GET /items?filter[status]=ACTIVE
```

---

## Rangos

```http
GET /items?filter[createdAt][gte]=2025-01-01
```

---

## Operadores Permitidos

| Operador | Uso |
|---|---|
| eq | Igualdad |
| gte | Mayor o igual |
| lte | Menor o igual |
| gt | Mayor |
| lt | Menor |

---

# Búsqueda

## Parámetro

```text
search
```

---

## Ejemplo

```http
GET /items?search=ABC
```

---

# Validación

## Pydantic v2

Uso obligatorio.

---

## Reglas

- Tipado estricto.
- `extra="forbid"`
- Payloads inválidos rechazados.

---

## Error de Validación

```json
{
  "success": false,
  "message": "Error de validación",
  "errorCode": "VALIDATION_ERROR",
  "data": {
    "errors": [
      {
        "field": "email",
        "message": "Correo inválido"
      }
    ]
  }
}
```

---

# Transiciones de Estado

## Regla Crítica

Los estados no deben modificarse mediante PATCH genérico.

---

## Estrategia

Endpoints de acción.

Ejemplos:

```http
POST /appointments/:id/check-in
POST /appointments/:id/start
POST /appointments/:id/complete
POST /appointments/:id/cancel
```

---

## Beneficios

- Validación explícita.
- Reglas centralizadas.
- Auditoría.
- Seguridad.

---

# Máquina de Estados

## Validaciones Obligatorias

- Estado origen válido.
- Estado destino permitido.
- Usuario autorizado.
- Recursos disponibles.

---

## Error de Estado

```json
{
  "success": false,
  "message": "Transición inválida",
  "errorCode": "INVALID_STATE_TRANSITION"
}
```

---

# Idempotencia

## Recomendación

Endpoints críticos deben soportar idempotencia.

Ejemplo:

```http
Idempotency-Key: uuid
```

---

# Timeouts

## Recomendaciones

| Tipo | Tiempo |
|---|---|
| Requests normales | 30s |
| Login | 15s |
| Reportes | 120s |

---

# Rate Limiting

## Estrategia

Limitación por:

- IP.
- Usuario.
- Endpoint.

---

## Headers Recomendados

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

---

# Headers Estándar

## Recomendados

| Header | Uso |
|---|---|
| Authorization | JWT |
| Content-Type | JSON |
| X-Request-ID | Trazabilidad |
| Idempotency-Key | Requests críticas |

---

# Trazabilidad

## Request ID

Cada request debe incluir:

```text
requestId
```

---

## Uso

- Logging.
- Debugging.
- Auditoría.
- Correlación.

---

# Versionado

## Estrategia

Versionado por URL.

---

## Deprecación

Headers recomendados:

```http
Deprecation: true
Sunset: 2026-12-31
```

---

# Realtime Contracts

## Canal Principal

```text
dashboard-update
```

---

## Payload

```json
{
  "kpis": {},
  "items": [],
  "alerts": []
}
```

---

## Reglas

- Snapshot completo.
- Estado consistente.
- Frontend reemplaza estado local.

---

# Manejo de Errores

## Formato Estándar

```json
{
  "success": false,
  "message": "Error",
  "errorCode": "ERROR_CODE",
  "requestId": "uuid"
}
```

---

## Error Codes Recomendados

| Código | Uso |
|---|---|
| VALIDATION_ERROR | Payload inválido |
| INVALID_TOKEN | JWT inválido |
| TOKEN_EXPIRED | JWT expirado |
| ACCESS_DENIED | Rol insuficiente |
| RESOURCE_NOT_FOUND | Recurso inexistente |
| INVALID_STATE_TRANSITION | Estado inválido |
| RESOURCE_OCCUPIED | Recurso ocupado |
| SERVER_ERROR | Error interno |

---

# Contratos de Seguridad

## Reglas

- HTTPS obligatorio.
- JWT obligatorio.
- RBAC obligatorio.
- Validación estricta.
- Sanitización.
- Rate limiting.

---

# Contratos Frontend

## Backend como Fuente de Verdad

El frontend:

- Nunca modifica estado sin confirmación.
- Nunca asume éxito.
- Debe refrescar tras conflictos.

---

## Estados Realtime

| Estado | Uso |
|---|---|
| LIVE | Datos frescos |
| DELAYED | Latencia moderada |
| STALE | Datos obsoletos |
| DISCONNECTED | Sin conexión |

---

# Reglas No Negociables

- Formato estándar obligatorio.
- REST obligatorio.
- JWT obligatorio.
- Endpoints versionados.
- Estados mediante acciones.
- Validación estricta.
- Backend como autoridad final.
- Snapshot realtime obligatorio.
- Error handling consistente.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn0file6

