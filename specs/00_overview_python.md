# Project Overview – Línea Base Fullstack

## Objetivo
Establecer un estándar base, repetible y optimizado para la construcción de aplicaciones empresariales fullstack con enfoque en operaciones logísticas, alta concurrencia, consistencia de datos y seguridad desde el diseño.

---

# Stack Tecnológico (OBLIGATORIO)

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| **Backend** | Python + FastAPI | Python 3.12+, FastAPI latest estable | Arquitectura ASGI de alto rendimiento |
| **Servidor ASGI** | Uvicorn + Gunicorn | latest | Workers administrados por Gunicorn |
| **Frontend** | React (Vite) | React 18+, Vite 5 | Tailwind CSS, componentes funcionales, code splitting por ruta |
| **Base de datos** | SQL Server | 2019 o superior | Instancia dedicada, compatibilidad SSMS |
| **Cliente BD** | SQLAlchemy 2.x + pyodbc | latest | Pooling, ejecución de vistas y stored procedures |
| **Autenticación** | JWT | HS256 o RS256 | Doble token (access 15 min + refresh 7 días), rotación de refresh |
| **Validación** | Pydantic v2 | latest | Schemas estrictos en routers/controllers |
| **Logging** | structlog + logging | latest | Logs estructurados JSON y requestId trazable |
| **Testing** | Pytest | latest | Cobertura > 80% en services |
| **CI/CD** | GitHub Actions o similar | - | Pipeline: lint → test → build → deploy |

---

# Principios Arquitectónicos

## 1. Arquitectura en Capas Estricta

- **Routers / Controllers**:
  - Manejo de request/response.
  - Validación con Pydantic.
  - Llamada a services.
  - Sin lógica de negocio.

- **Services**:
  - Toda la lógica de negocio.
  - Orquestación.
  - Transacciones.
  - Máquinas de estado.
  - Validaciones operativas.

- **Repositories**:
  - Acceso a datos exclusivamente mediante vistas y stored procedures.
  - Prohibido SQL crudo de negocio.

- **Middlewares**:
  - Autenticación.
  - Autorización.
  - Rate limiting.
  - Logging.
  - Request tracing.
  - Manejo global de errores.

---

## 2. Acceso a Datos Optimizado (CRÍTICO)

### Regla No Negociable

No se permite SQL de negocio escrito directamente en repositories.

Queda prohibido:

```sql
SELECT *
FROM tabla
JOIN otra_tabla
WHERE ...
```

### Estrategia Obligatoria

Toda operación debe ejecutarse mediante:

- **Views (`dbo.vw_*`)**
- **Stored Procedures (`dbo.usp_*`)**

### Beneficios

- Planes de ejecución optimizados.
- Seguridad reforzada.
- Menor acoplamiento.
- Rendimiento consistente.
- Optimización centralizada.

---

## 3. Seguridad por Diseño

- HTTPS obligatorio en producción.
- bcrypt con 12 rounds.
- JWT con access y refresh token.
- Refresh token rotativo.
- CORS estricto.
- Rate limiting.
- Validación estricta de entrada.
- Rechazo de campos inesperados.
- Trusted hosts y headers seguros.

---

## 4. Escalabilidad Horizontal

### Backend

- API completamente stateless.
- Compatible con múltiples réplicas.
- Workers ASGI mediante Gunicorn + Uvicorn.

### Frontend

- Build estático servido por Nginx.
- Cache agresivo.
- Fingerprinting.

### Base de Datos

- SQL Server centralizado.
- Replicación de lectura opcional.
- Redis opcional para caché distribuido.

---

## 5. Separación de Responsabilidades (SOLID)

### Single Responsibility
Cada módulo tiene una única responsabilidad.

### Open / Closed
La aplicación debe poder extenderse sin modificar módulos existentes.

### Liskov
Repositories intercambiables mientras mantengan contratos.

### Interface Segregation
Services específicos por dominio.

### Dependency Inversion
Dependencia de abstracciones y contratos.

---

## 6. Configuración Centralizada

Toda configuración se gestiona mediante variables de entorno.

Archivo `.env.example` obligatorio.

Variables mínimas:

```env
APP_NAME=OperationalControl
APP_ENV=development
APP_PORT=8000

DB_HOST=localhost
DB_PORT=1433
DB_NAME=ControlOperacionDb
DB_USER=sa
DB_PASSWORD=StrongPassword123

JWT_SECRET=super-secret-key
REFRESH_TOKEN_SECRET=refresh-secret-key

ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:5173
```

Carga centralizada mediante Pydantic Settings.

---

## 7. Logging y Monitoreo

### Logging Estructurado

Uso obligatorio de:

- structlog
- logging

### Niveles

- ERROR
- WARNING
- INFO
- DEBUG

### Request Tracing

Cada request debe incluir:

- requestId
- timestamp ISO8601
- usuario
- endpoint
- duración

---

## 8. Manejo de Errores Global

Middleware global para captura de excepciones.

Formato estándar:

```json
{
  "success": false,
  "message": "string",
  "errorCode": "OPTIONAL_CODE",
  "requestId": "uuid"
}
```

### Reglas

- Nunca exponer stacktrace.
- Nunca exponer queries SQL.
- Nunca exponer secretos.

---

## 9. Testing y Calidad

### Backend

- pytest
- pytest-asyncio
- httpx

### Cobertura

- >80% en services.
- >80% en lógica crítica.

### Calidad

Herramientas obligatorias:

- Ruff
- Black
- isort
- mypy

---

## 10. Estructura de Módulos por Dominio

```text
/backend
├── app
│   ├── api
│   │   └── v1
│   │       ├── auth
│   │       ├── appointments
│   │       ├── users
│   │       └── ...
│   ├── core
│   ├── db
│   ├── middleware
│   ├── services
│   ├── utils
│   └── main.py
├── tests
├── alembic
└── requirements.txt
```

---

# Línea Base de Ejecución

Al iniciar un nuevo proyecto con esta línea base, se debe garantizar:

1. Backend Python con FastAPI estructurado por capas.
2. React frontend con Vite y Tailwind.
3. SQL Server usando vistas y stored procedures.
4. JWT con doble token y rotación.
5. Seguridad desde el día 1.
6. Configuración por entorno.
7. Logging estructurado.
8. Tests automatizados desde el inicio.
9. Dockerización lista para despliegue.
10. Escalabilidad horizontal preparada desde arquitectura.

Fuente base adaptada desde: fileciteturn0file0