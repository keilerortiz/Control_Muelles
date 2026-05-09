# Deployment Specification – Línea Base de Producción

## Objetivo

Definir la estrategia estándar de despliegue para aplicaciones empresariales basadas en:

- FastAPI
- React + Vite
- SQL Server
- Docker
- Nginx
- Arquitectura stateless escalable

La infraestructura debe priorizar:

- Escalabilidad.
- Seguridad.
- Portabilidad.
- Observabilidad.
- Reproducibilidad.
- Alta disponibilidad.

---

# Arquitectura General de Despliegue

## Componentes Principales

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Backend | FastAPI + Gunicorn/Uvicorn | API REST + WebSocket |
| Frontend | React/Vite + Nginx | UI SaaS |
| Base de Datos | SQL Server 2019+ | Persistencia |
| Reverse Proxy | Nginx | SSL + Routing |
| Cache (Opcional) | Redis | Rate limit + realtime |

---

# Estrategia General

Cada componente debe ejecutarse:

- En contenedor independiente.
- Desacoplado.
- Escalable horizontalmente.
- Configurable mediante variables de entorno.

---

# Estructura de Archivos

```text
/project-root
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env
├── backend
│   ├── Dockerfile
│   └── .dockerignore
├── frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── database
│   ├── init.sql
│   └── migrations
└── README.md
```

---

# Backend Deployment

## Dockerfile Backend

### Objetivos

- Imagen mínima.
- Alto rendimiento.
- Seguridad.
- Inicio rápido.

---

## Dockerfile

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD [
  "gunicorn",
  "app.main:app",
  "-k",
  "uvicorn.workers.UvicornWorker",
  "-w",
  "4",
  "--bind",
  "0.0.0.0:8000"
]
```

---

## Reglas

- Imagen slim obligatoria.
- Sin dependencias innecesarias.
- Sin herramientas de desarrollo.
- Variables por entorno.

---

# Frontend Deployment

## Estrategia

- Build estático.
- Nginx como runtime.
- Cache agresivo.
- Proxy reverso hacia backend.

---

## Dockerfile Frontend

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
```

---

## Reglas

- Build separado.
- Imagen final mínima.
- Sin Node.js en runtime.

---

# Configuración Nginx

## Objetivos

- Reverse proxy.
- Compresión.
- Cache.
- SSL.
- Seguridad.

---

## nginx.conf

```nginx
server {
    listen 80;

    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://backend:8000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin" always;
}
```

---

# Docker Compose

## Objetivo

Orquestación local, desarrollo y staging.

---

## docker-compose.yml

```yaml
version: '3.9'

services:
  db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      ACCEPT_EULA: Y
      SA_PASSWORD: ${DB_PASSWORD}
      MSSQL_PID: Developer
    ports:
      - "1433:1433"
    volumes:
      - db-data:/var/opt/mssql
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "${DB_PASSWORD}", "-Q", "SELECT 1"]
      interval: 10s
      retries: 5

  backend:
    build: ./backend
    environment:
      APP_ENV: production
      DB_HOST: db
      DB_NAME: ${DB_NAME}
      DB_USER: sa
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  db-data:
```

---

# Variables de Entorno

## Archivo `.env.example`

```env
# Database
DB_PASSWORD=StrongPassword123!
DB_NAME=OperationalControlDb

# Backend
APP_ENV=production
APP_PORT=8000
JWT_SECRET=super-secret-key
REFRESH_TOKEN_SECRET=refresh-secret-key
CORS_ORIGINS=http://localhost

# Frontend
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=/ws
```

---

## Reglas

- Nunca commitear `.env`.
- Secrets gestionados por orchestrator.
- Variables por entorno.

---

# Estrategia de Base de Datos

## Inicialización

`init.sql` debe crear:

- Tablas.
- Índices.
- Views.
- Stored procedures.
- Seeds.

---

## Migraciones

Uso obligatorio de:

- Alembic.
- Scripts versionados.

---

## Reglas

- Scripts secuenciales.
- Rollback posible.
- Probados en staging.

---

# Health Checks

## Backend

Endpoint obligatorio:

```http
GET /health
```

---

## Response

```json
{
  "status": "UP",
  "database": "CONNECTED",
  "uptime": 3600
}
```

---

## Docker Healthcheck

Recomendado:

```dockerfile
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1
```

---

# Logging y Observabilidad

## Backend

Logs:

- stdout/stderr.
- JSON estructurado.
- RequestId.

---

## Frontend

Logs de acceso Nginx.

---

## Integraciones Recomendadas

- ELK.
- Loki.
- Grafana.
- Datadog.
- OpenTelemetry.

---

# CI/CD

## Pipeline Básico

```yaml
stages:
  - lint
  - test
  - build
  - deploy
```

---

## Flujo

### Lint

- Ruff.
- Black.
- ESLint.

---

### Tests

- pytest.
- Vitest.

---

### Build

- Frontend.
- Backend.
- Docker images.

---

### Deploy

- Staging automático.
- Producción manual/aprobada.

---

# SSL/TLS

## Producción

HTTPS obligatorio.

Opciones:

- Let's Encrypt.
- Cloudflare.
- Certificados corporativos.

---

## Headers Obligatorios

- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- CSP

---

# Escalabilidad

## Backend

Escalamiento horizontal mediante:

- Gunicorn workers.
- Múltiples instancias.
- Load balancer.

---

## WebSockets

Escalado mediante:

- Redis Pub/Sub.
- Sticky sessions opcionales.

---

## SQL Server

Opcional:

- Réplicas lectura.
- Failover.
- Always On.

---

# Seguridad Infraestructura

## Reglas

- Contenedores no root.
- Puertos mínimos expuestos.
- Secrets fuera del código.
- Firewall.
- Segmentación de red.

---

# Backup Strategy

## Producción

- Full backup diario.
- Transaction logs cada hora.
- Retención configurable.

---

## Almacenamiento

- Cloud.
- Volumen externo.
- Replicación opcional.

---

# Producción

## Requisitos Obligatorios

- HTTPS.
- Variables seguras.
- Monitoring.
- Alertas.
- Logs centralizados.
- Health checks.
- Backups.

---

# Reglas No Negociables

- Docker obligatorio.
- Backend stateless.
- HTTPS obligatorio.
- Variables de entorno obligatorias.
- Logging estructurado.
- Health checks obligatorios.
- Escalabilidad horizontal preparada.
- Secrets fuera del código.
- Imágenes mínimas.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn1file9turn1file12

