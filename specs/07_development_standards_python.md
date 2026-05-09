# Development Standards – Línea Base de Producción

## Objetivo

Definir los estándares obligatorios de desarrollo para aplicaciones empresariales basadas en:

- Python + FastAPI
- React + Vite
- SQL Server
- Docker
- Arquitectura modular escalable

La prioridad es:

- Mantenibilidad.
- Escalabilidad.
- Rendimiento.
- Seguridad.
- Consistencia.
- Calidad de código.

---

# Entorno de Desarrollo

## Backend

### Requisitos

| Herramienta | Versión |
|---|---|
| Python | 3.12+ |
| pip | latest |
| virtualenv | recomendado |
| SQL Server | 2019+ |
| Docker | latest |

---

## Frontend

| Herramienta | Versión |
|---|---|
| Node.js | 20+ |
| npm | latest |
| Vite | latest |

---

## Editor Recomendado

- Visual Studio Code.

---

## Extensiones Recomendadas

### Backend

- Python
- Ruff
- Black Formatter
- Pylance

### Frontend

- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

# Configuración Inicial

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

# Calidad de Código

## Principios

- Código limpio.
- DRY.
- SOLID.
- KISS.
- Alta cohesión.
- Bajo acoplamiento.

---

# Formateo y Linting Backend

## Herramientas Obligatorias

| Herramienta | Uso |
|---|---|
| Ruff | Linting |
| Black | Formateo |
| isort | Orden imports |
| mypy | Tipado estático |

---

## Ruff

### pyproject.toml

```toml
[tool.ruff]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]
```

---

## Black

```toml
[tool.black]
line-length = 100
```

---

## isort

```toml
[tool.isort]
profile = "black"
line_length = 100
```

---

## mypy

Uso obligatorio en lógica crítica.

---

# Formateo y Linting Frontend

## Herramientas

- ESLint
- Prettier

---

## Reglas Obligatorias

| Regla | Estado |
|---|---|
| no-unused-vars | error |
| eqeqeq | error |
| prefer-const | error |
| no-var | error |

---

# Convenciones de Nombrado

## Backend Python

| Elemento | Convención |
|---|---|
| Variables | snake_case |
| Funciones | snake_case |
| Clases | PascalCase |
| Constantes | UPPER_SNAKE_CASE |
| Archivos | snake_case.py |

---

## Frontend React

| Elemento | Convención |
|---|---|
| Componentes | PascalCase |
| Hooks | useCamelCase |
| Variables | camelCase |
| Archivos UI | PascalCase.jsx |

---

# Estructura de Backend

## Separación Obligatoria

```text
router → service → repository
```

---

## Reglas

| Capa | Prohibiciones |
|---|---|
| Router | SQL, lógica negocio |
| Service | HTTP, FastAPI |
| Repository | reglas negocio |

---

# Estructura Frontend

## Separación

```text
pages → hooks → services
components → solo UI
```

---

## Reglas

- Components sin lógica negocio.
- Requests HTTP centralizados.
- Backend como fuente de verdad.

---

# Tipado

## Backend

Tipado obligatorio:

```python
def create_user(payload: CreateUserSchema) -> UserResponse:
```

---

## Frontend

Tipado mediante:

- Zod.
- PropTypes opcional.
- TypeScript opcional.

---

# Comentarios

## Regla

Comentar únicamente:

- Decisiones complejas.
- Reglas no obvias.
- Casos especiales.

---

## Prohibido

Comentarios redundantes.

Incorrecto:

```python
# Incrementa contador
counter += 1
```

---

# Imports

## Orden Backend

1. Standard library.
2. Third party.
3. Local imports.

---

## Orden Frontend

1. React.
2. Librerías.
3. Services/hooks.
4. Components.
5. Styles.

---

# Prohibiciones

## Backend

- SQL crudo de negocio.
- print().
- lógica en routers.
- try/except genéricos.
- secretos hardcoded.

---

## Frontend

- Requests HTTP en componentes.
- Lógica de negocio en UI.
- Estado inconsistente.
- CSS desorganizado.

---

# Manejo de Configuración

## Variables de Entorno

Toda configuración sensible debe venir de:

```text
.env
```

---

## Prohibido

```python
SECRET_KEY = "123456"
```

---

# Git y Control de Versiones

## Estrategia de Ramas

| Rama | Uso |
|---|---|
| main | producción |
| develop | integración |
| feature/* | nuevas features |
| fix/* | correcciones |
| release/* | releases |

---

# Conventional Commits

## Formato

```text
<type>(scope): description
```

---

## Tipos

| Tipo | Uso |
|---|---|
| feat | nueva feature |
| fix | bug |
| refactor | refactor |
| docs | documentación |
| test | testing |
| chore | mantenimiento |

---

## Ejemplos

```text
feat(auth): add refresh token rotation
fix(api): validate appointment transitions
refactor(users): extract password service
```

---

# Pull Requests

## Requisitos

- Descripción clara.
- Cómo probar.
- Impacto.
- Screenshots si aplica.

---

## Checklist Obligatorio

- Lint OK.
- Tests OK.
- Sin secretos.
- Documentación actualizada.
- Sin regresiones.

---

# Testing Backend

## Frameworks

- pytest
- pytest-asyncio
- httpx

---

## Tipos

### Unit Tests

- Services.
- Utils.
- Validaciones.

---

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

# Testing Frontend

## Frameworks

- Vitest.
- React Testing Library.

---

## Validar

- Hooks.
- Formularios.
- Estados.
- Rutas protegidas.

---

# Logging

## Backend

Uso obligatorio:

- structlog
- logging

---

## Niveles

| Nivel | Uso |
|---|---|
| ERROR | fallos críticos |
| WARNING | anomalías |
| INFO | eventos importantes |
| DEBUG | desarrollo |

---

## Campos Obligatorios

- request_id
- endpoint
- status_code
- duration
- user_id

---

## Prohibido

Loguear:

- passwords
- tokens completos
- secretos

---

# Manejo de Errores

## Backend

Uso obligatorio de excepciones tipadas.

Ejemplo:

```python
class AppError(Exception):
    pass
```

---

## Frontend

- ErrorState.
- Toasts.
- Retry controlado.
- Sin stack traces visibles.

---

# Seguridad

## Backend

Obligatorio:

- JWT.
- bcrypt.
- HTTPS.
- Rate limiting.
- Validación estricta.

---

## Frontend

- Refresh token httpOnly.
- Access token en memoria.
- Validación visual de permisos.

---

# Performance

## Backend

- Async obligatorio.
- Pooling SQL.
- Timeouts.
- Queries optimizadas.
- Stored procedures.

---

## Frontend

- Lazy loading.
- Memoización.
- Virtualización.
- Debounce.
- Cache controlado.

---

# Docker

## Backend

Imagen mínima.

Uso recomendado:

- python:3.12-slim

---

## Frontend

Build estático:

- Node builder.
- Nginx runtime.

---

# CI/CD

## Pipeline Básico

1. Lint.
2. Test.
3. Build.
4. Deploy.

---

## Reglas

- No merge sin tests.
- No merge sin review.
- No deploy con fallos.

---

# Observabilidad

## Preparado para

- Grafana.
- Loki.
- ELK.
- Prometheus.
- OpenTelemetry.

---

## Métricas

- Latencia.
- Throughput.
- Errores.
- Requests activas.
- Tiempo respuesta.

---

# Documentación

## Backend

Documentar:

- endpoints
- schemas
- reglas negocio
- estados

---

## Frontend

Documentar:

- componentes críticos
- hooks complejos
- flujos operativos

---

# Reglas No Negociables

- Arquitectura modular obligatoria.
- SQL encapsulado obligatorio.
- Backend stateless.
- Logging estructurado.
- Validación estricta.
- Tests obligatorios.
- Seguridad desde diseño.
- Código limpio obligatorio.
- Alto rendimiento obligatorio.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn0file7

