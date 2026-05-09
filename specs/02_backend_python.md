# Backend Specification – Línea Base de Producción

## Framework

- **Python 3.12+ + FastAPI** (obligatorio).
- Arquitectura ASGI de alto rendimiento.
- Prohibido usar frameworks monolíticos u opinionados adicionales.
- La aplicación debe permanecer desacoplada del framework mediante separación estricta por capas.

---

# Estructura de Carpetas (Modular y Escalable)

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
│   │       ├── users
│   │       │   ├── router.py
│   │       │   ├── service.py
│   │       │   ├── repository.py
│   │       │   ├── schemas.py
│   │       │   └── dependencies.py
│   │       └── ...
│   ├── core
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── logging.py
│   │   ├── exceptions.py
│   │   ├── constants.py
│   │   └── responses.py
│   ├── db
│   │   ├── session.py
│   │   ├── base.py
│   │   └── repositories
│   ├── middleware
│   │   ├── request_context.py
│   │   ├── logging.py
│   │   ├── error_handler.py
│   │   └── auth.py
│   ├── websocket
│   ├── utils
│   └── main.py
├── tests
├── alembic
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

# Dependencias Clave

## requirements.txt

```txt
fastapi
uvicorn[standard]
gunicorn
sqlalchemy
pyodbc
pydantic
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
structlog
python-json-logger
slowapi
redis
python-dotenv
alembic
pytest
pytest-asyncio
httpx
ruff
black
isort
mypy
```

---

# Configuración

Toda configuración debe centralizarse mediante Pydantic Settings.

## Archivo `.env.example`

```env
APP_NAME=OperationalControl
APP_ENV=development
APP_PORT=8000
APP_DEBUG=true

DB_HOST=localhost
DB_PORT=1433
DB_NAME=ControlOperacionDb
DB_USER=sa
DB_PASSWORD=StrongPassword123
DB_DRIVER=ODBC Driver 18 for SQL Server

JWT_SECRET=super-secret-key
REFRESH_TOKEN_SECRET=refresh-secret-key

ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:5173
```

---

## Configuración Centralizada

### `app/core/config.py`

```python
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    app_name: str = "OperationalControl"
    app_env: str = "development"
    app_port: int = 8000
    app_debug: bool = True

    db_host: str
    db_port: int = 1433
    db_name: str
    db_user: str
    db_password: str
    db_driver: str = "ODBC Driver 18 for SQL Server"

    jwt_secret: str
    refresh_token_secret: str

    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: str

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

---

# Configuración de FastAPI

## `app/main.py`

Orden obligatorio de middlewares:

1. Request Context.
2. Logging.
3. Trusted Hosts.
4. CORS.
5. GZip.
6. Rate Limiting.
7. Rutas.
8. Error Handler.

---

## Inicialización Base

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

# Organización Modular

Cada dominio encapsula:

- Router.
- Service.
- Repository.
- Schemas.
- Dependencies.

Separación obligatoria.

---

# Convenciones de Nombrado

| Elemento | Convención |
|---|---|
| Variables | snake_case |
| Funciones | snake_case |
| Clases | PascalCase |
| Constantes | UPPER_SNAKE_CASE |
| Archivos | snake_case.py |
|
| Routers | `<domain>/router.py` |
| Services | `<domain>/service.py` |
| Repositories | `<domain>/repository.py` |

---

# Routers / Controllers

## Responsabilidades

- Manejo HTTP.
- Validación con Pydantic.
- Llamada a services.
- Respuesta estándar.

## Prohibiciones

- SQL.
- Lógica de negocio.
- Transacciones.
- try/except genéricos.

---

## Ejemplo

```python
@router.post("/users", status_code=201)
async def create_user(
    payload: CreateUserSchema,
    service: UserService = Depends(get_user_service),
):
    result = await service.create_user(payload)

    return {
        "success": True,
        "message": "Usuario creado",
        "data": result,
    }
```

---

# Services (Lógica de Negocio)

## Responsabilidades

- Reglas operativas.
- Validaciones.
- Máquinas de estado.
- Coordinación.
- Transacciones.
- Concurrencia.

## Reglas

- Stateless.
- Sin objetos HTTP.
- Sin SQL.
- Sin dependencias de FastAPI.

---

## Ejemplo

```python
class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def create_user(self, payload: CreateUserSchema):
        existing_user = await self.repository.find_by_email(payload.email)

        if existing_user:
            raise ConflictError("El correo ya existe")

        password_hash = hash_password(payload.password)

        return await self.repository.create_user(
            payload,
            password_hash,
        )
```

---

# Repositories (Acceso a Datos)

## Restricción Crítica

No se permite SQL de negocio embebido.

Toda operación se ejecuta mediante:

- Views.
- Stored Procedures.

---

## SQLAlchemy 2.x

Uso obligatorio:

- AsyncSession.
- Connection pooling.
- Ejecución parametrizada.

---

## Ejemplo de Lectura

```python
from sqlalchemy import text


query = text("SELECT * FROM dbo.vw_User WHERE Id = :id")

result = await session.execute(query, {"id": user_id})
```

---

## Ejemplo de Stored Procedure

```python
query = text(
    "EXEC dbo.usp_CreateUser :name, :email, :password_hash"
)

await session.execute(
    query,
    {
        "name": payload.name,
        "email": payload.email,
        "password_hash": password_hash,
    },
)
```

---

## Reglas Obligatorias

- Sin lógica de negocio.
- Métodos atómicos.
- Sin dependencias HTTP.
- Reutilizables.
- Tipados.

---

# Transacciones

## Estrategia

Las transacciones se controlan desde services.

Ejemplo:

```python
async with session.begin():
    await repository.operation_one()
    await repository.operation_two()
```

---

# Schemas (Pydantic)

## Uso Obligatorio

- Validación de request.
- Validación de response.
- Contratos internos.

---

## Reglas

- `extra="forbid"`
- Tipado explícito.
- Validaciones estrictas.

---

## Ejemplo

```python
from pydantic import BaseModel, ConfigDict, EmailStr


class CreateUserSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    model_config = ConfigDict(extra="forbid")
```

---

# Dependency Injection

Uso obligatorio de Depends.

## Ejemplo

```python
from fastapi import Depends


def get_user_service(
    repository: UserRepository = Depends(get_user_repository),
):
    return UserService(repository)
```

---

# Middlewares

## Authentication

- Extrae Bearer token.
- Verifica JWT.
- Adjunta usuario autenticado.

---

## Authorization

- RBAC.
- Validación de roles.

---

## Request Context

Cada request debe incluir:

- request_id
- usuario
- endpoint
- timestamp

---

## Logging Middleware

Captura:

- Método.
- URL.
- Status.
- Duración.
- RequestId.

---

## Error Handler

Captura cualquier excepción.

Formato estándar:

```json
{
  "success": false,
  "message": "Error interno",
  "requestId": "uuid"
}
```

---

# Autenticación y Seguridad

## JWT

### Access Token

- 15 minutos.
- Bearer Token.

### Refresh Token

- 7 días.
- Rotación obligatoria.
- Persistido en BD.

---

## Password Hashing

Uso obligatorio de bcrypt.

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

---

## Seguridad HTTP

Obligatorio:

- HTTPS.
- Trusted Hosts.
- CORS estricto.
- Rate limiting.
- Security headers.

---

# Manejo de Errores

## Excepciones de Dominio

```python
class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
```

---

## Errores Típicos

| Código | Uso |
|---|---|
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Error |

---

# Logging

## Librerías

- structlog
- logging

---

## Formato

JSON estructurado en producción.

---

## Campos Obligatorios

- timestamp
- request_id
- level
- endpoint
- user_id
- duration

---

## Reglas

No loguear:

- Passwords.
- Tokens completos.
- Información sensible.

---

# Conexión SQL Server

## SQLAlchemy Async Engine

```python
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    connection_string,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
```

---

## Reglas

- Pooling obligatorio.
- Timeout configurado.
- Reintentos controlados.
- Sesiones por request.

---

# Testing

## Frameworks

- pytest
- pytest-asyncio
- httpx

---

## Estrategia

### Unit Tests

- Services.
- Utils.
- Validaciones.

### Integration Tests

- Endpoints.
- Middleware.
- Seguridad.

---

## Cobertura

Mínimo:

- 80% services.
- 80% lógica crítica.

---

# Health Checks

## Endpoint Obligatorio

```http
GET /health
```

Respuesta:

```json
{
  "status": "UP",
  "database": "CONNECTED"
}
```

---

# WebSockets

## Implementación

FastAPI WebSockets ASGI.

Canales:

- dashboard-update
- notifications

---

## Reglas

- Reconexión automática.
- Heartbeats.
- Estado consistente.
- Snapshots completos.

---

# Despliegue

## Producción

- Gunicorn + Uvicorn Workers.
- Docker.
- Kubernetes Ready.
- Stateless.

---

## Workers

Ejemplo:

```bash
gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w 4 \
  --bind 0.0.0.0:8000
```

---

# Reglas No Negociables

- No SQL de negocio embebido.
- Services sin FastAPI.
- Repositories sin lógica.
- Validación obligatoria.
- Logging estructurado.
- Arquitectura modular.
- Stateless obligatorio.
- Seguridad desde el diseño.
- Testing desde el inicio.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn0file2

