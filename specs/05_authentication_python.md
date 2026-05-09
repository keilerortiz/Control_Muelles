# Authentication & Security Specification – Línea Base de Producción

## Objetivo

Definir la estrategia estándar de autenticación, autorización y seguridad para aplicaciones empresariales basadas en:

- FastAPI
- JWT
- SQL Server
- Arquitectura stateless
- Frontend React/Vite

La seguridad debe considerarse un requisito base y no una mejora posterior.

---

# Principios Fundamentales

## 1. Seguridad por Diseño

Toda funcionalidad debe desarrollarse bajo el principio:

```text
secure by default
```

---

## 2. Backend Stateless

El backend no mantiene sesiones en memoria.

Toda autenticación se basa en:

- JWT access tokens.
- Refresh tokens persistidos.

---

## 3. Menor Privilegio

Cada usuario solo puede acceder a:

- Recursos autorizados.
- Acciones permitidas.
- Información necesaria.

---

## 4. Defensa en Profundidad

La seguridad se implementa en múltiples capas:

- HTTP.
- JWT.
- Roles.
- Validaciones.
- Base de datos.
- Infraestructura.

---

# Arquitectura de Autenticación

## Flujo General

```text
Frontend
    ↓
POST /auth/login
    ↓
Backend valida credenciales
    ↓
Genera Access Token + Refresh Token
    ↓
Access Token → frontend
Refresh Token → cookie httpOnly
    ↓
Requests autenticadas con Bearer Token
    ↓
Token expirado → refresh automático
```

---

# JWT

## Access Token

### Objetivo

Autenticar requests.

---

## Características

| Propiedad | Valor |
|---|---|
| Tipo | JWT |
| Expiración | 15 minutos |
| Transporte | Authorization Bearer |
| Persistencia | Memoria frontend |
| Firma | HS256 o RS256 |

---

## Claims Recomendados

```json
{
  "sub": "123",
  "email": "user@email.com",
  "roles": ["ADMIN"],
  "exp": 123456789,
  "iat": 123456789,
  "jti": "uuid"
}
```

---

## Reglas

- Vida corta obligatoria.
- Nunca almacenar en cookies inseguras.
- Nunca almacenar refresh token en localStorage.

---

# Refresh Token

## Objetivo

Renovar access tokens sin relogin.

---

## Características

| Propiedad | Valor |
|---|---|
| Expiración | 7 días |
| Persistencia | SQL Server |
| Transporte | Cookie httpOnly |
| Rotación | Obligatoria |
| Revocación | Obligatoria |

---

## Reglas

- Cada refresh genera uno nuevo.
- El anterior queda invalidado.
- Debe poder revocarse.
- Asociado a usuario y dispositivo.

---

# Flujo de Login

## Endpoint

```http
POST /api/v1/auth/login
```

---

## Request

```json
{
  "email": "user@email.com",
  "password": "password"
}
```

---

## Validaciones

- Usuario existe.
- Usuario activo.
- Password válida.
- Cuenta no bloqueada.

---

## Response

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "accessToken": "jwt",
    "user": {
      "id": 1,
      "name": "Admin",
      "roles": ["ADMIN"]
    }
  }
}
```

---

## Cookie Refresh Token

Configuración obligatoria:

```text
httpOnly=true
secure=true
sameSite=strict
```

---

# Flujo de Refresh Token

## Endpoint

```http
POST /api/v1/auth/refresh
```

---

## Flujo

1. Backend recibe cookie.
2. Valida refresh token.
3. Verifica revocación.
4. Genera nuevo access token.
5. Genera nuevo refresh token.
6. Invalida refresh anterior.

---

## Response

```json
{
  "success": true,
  "message": "Token renovado",
  "data": {
    "accessToken": "jwt"
  }
}
```

---

# Logout

## Endpoint

```http
POST /api/v1/auth/logout
```

---

## Flujo

- Revoca refresh token.
- Limpia cookie.
- Invalida sesión lógica.

---

## Response

```json
{
  "success": true,
  "message": "Sesión cerrada"
}
```

---

# Password Hashing

## Librería

Uso obligatorio:

```python
passlib[bcrypt]
```

---

## Configuración

```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)
```

---

## Reglas

- 12 rounds mínimo.
- Nunca guardar passwords planas.
- Nunca loguear passwords.

---

# Autorización (RBAC)

## Estrategia

Role-Based Access Control.

---

## Roles Típicos

| Rol | Descripción |
|---|---|
| ADMIN | Acceso completo |
| SUPERVISOR | Gestión operativa |
| PLANEADOR | Planeación |
| PORTERIA | Validación acceso |
| CONSULTOR | Solo lectura |

---

## Validación

Middleware/dependency obligatorio.

Ejemplo:

```python
@router.get(
    "/users",
    dependencies=[Depends(require_roles("ADMIN"))]
)
```

---

## Reglas

- Validar en backend.
- Frontend solo oculta UI.
- Backend es autoridad final.

---

# Middleware Authentication

## Responsabilidades

- Leer Authorization header.
- Validar JWT.
- Verificar expiración.
- Adjuntar usuario autenticado.

---

## Header Obligatorio

```http
Authorization: Bearer <token>
```

---

## Errores

| Código | Uso |
|---|---|
| 401 | Token inválido |
| 401 | Token expirado |
| 403 | Rol insuficiente |

---

# Seguridad HTTP

## HTTPS

Obligatorio en producción.

---

## Headers Obligatorios

| Header | Uso |
|---|---|
| X-Frame-Options | Protección clickjacking |
| X-Content-Type-Options | Protección MIME |
| Referrer-Policy | Control referrer |
| Content-Security-Policy | Restricción scripts |
| Strict-Transport-Security | HTTPS obligatorio |

---

# CORS

## Configuración

Whitelist explícita.

Prohibido:

```python
allow_origins=["*"]
```

---

## Producción

Solo dominios autorizados.

---

# Rate Limiting

## Objetivo

Mitigar:

- Fuerza bruta.
- Abuse.
- Flooding.

---

## Librería

Recomendado:

```text
slowapi
```

---

## Límites Recomendados

| Endpoint | Límite |
|---|---|
| Login | 5/min |
| Refresh | 10/min |
| API general | 100/min |

---

# Validación de Entrada

## Pydantic v2

Uso obligatorio.

---

## Reglas

- `extra="forbid"`
- Tipado explícito.
- Sanitización.
- Rechazo de payloads inválidos.

---

## Ejemplo

```python
class LoginSchema(BaseModel):
    email: EmailStr
    password: str

    model_config = ConfigDict(extra="forbid")
```

---

# Protección contra Ataques

## SQL Injection

Mitigación:

- Queries parametrizadas.
- Stored procedures.
- SQLAlchemy.

---

## XSS

Mitigación:

- CSP.
- Sanitización.
- React escaping.

---

## CSRF

Mitigación:

- sameSite=strict.
- JWT Bearer.
- Cookies httpOnly.

---

## Brute Force

Mitigación:

- Rate limiting.
- Delays progresivos.
- Bloqueo temporal opcional.

---

# Gestión de Tokens

## Revocación

Refresh tokens deben poder:

- Revocarse manualmente.
- Revocarse por logout.
- Revocarse por expiración.
- Revocarse por cambio de password.

---

## Base de Datos

Tabla recomendada:

```text
tbl_RefreshToken
```

Campos mínimos:

- Id
- UserId
- TokenHash
- ExpiresAt
- RevokedAt
- DeviceInfo
- CreatedAt

---

# Gestión de Sesiones

## Estrategia

Backend stateless.

La persistencia ocurre únicamente para refresh tokens.

---

## Sesiones Concurrentes

Configurables:

- Permitidas.
- Limitadas.
- Revocables.

---

# Logging de Seguridad

## Eventos Obligatorios

- Login exitoso.
- Login fallido.
- Logout.
- Refresh token.
- Revocación.
- Acceso denegado.
- Rate limiting.

---

## Reglas

Nunca loguear:

- Passwords.
- Tokens completos.
- Datos sensibles.

---

# Manejo de Errores

## Formato Estándar

```json
{
  "success": false,
  "message": "No autorizado",
  "errorCode": "UNAUTHORIZED",
  "requestId": "uuid"
}
```

---

## Errores Típicos

| Código | Error |
|---|---|
| INVALID_CREDENTIALS | Credenciales inválidas |
| TOKEN_EXPIRED | JWT expirado |
| INVALID_TOKEN | Token inválido |
| ACCESS_DENIED | Rol insuficiente |
| REFRESH_REVOKED | Refresh inválido |

---

# Frontend Security

## Reglas

- Access token en memoria.
- Refresh token httpOnly.
- Nunca almacenar refresh token en localStorage.
- Validación visual de permisos.
- Logout automático ante 401.

---

# Testing de Seguridad

## Casos Obligatorios

- Login válido.
- Login inválido.
- JWT expirado.
- Refresh válido.
- Refresh revocado.
- RBAC.
- Rate limiting.
- Logout.

---

# Infraestructura

## Producción

Obligatorio:

- HTTPS.
- Secrets manager.
- Variables de entorno.
- Firewall.
- Docker no root.

---

# Reglas No Negociables

- JWT obligatorio.
- Refresh token rotativo obligatorio.
- bcrypt obligatorio.
- HTTPS obligatorio.
- RBAC obligatorio.
- Rate limiting obligatorio.
- Backend stateless.
- Seguridad desde diseño.
- Validación estricta.
- Código listo para producción.

Fuente base adaptada desde: especificación original de autenticación y seguridad.

