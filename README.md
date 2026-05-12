# Control Muelles

Aplicación fullstack empresarial para gestión operativa de muelles basada en FastAPI, React/Vite y SQL Server.

## Stack

- Backend: FastAPI + SQLAlchemy async + JWT + RBAC + WebSocket
- Frontend: React 18 + Vite + Tailwind + Zustand + TanStack Query + RHF/Zod
- Database: SQL Server con views y stored procedures
- Deployment: Docker + Nginx + docker-compose

## Estructura

- `database/init.sql`: esquema, reglas de estado, auditoría y SPs
- `backend`: API versionada `/api/v1`
- `frontend`: dashboard SaaS operativo
- `docker-compose.yml`: entorno local completo

## Flujo de capas implementado

1. Capa de negocio y datos: máquina de estados y transiciones en SPs.
2. Capa backend: `router -> service -> repository`, mutaciones transaccionales, RBAC, auth.
3. Capa frontend: layout SaaS, vistas operativas, estado sincronizado con backend.
4. Capa deployment: contenedores, proxy Nginx, variables de entorno.

## Endpoints principales

- Auth:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
- Appointments:
  - `GET /api/v1/appointments/dashboard-summary`
  - `GET /api/v1/appointments`
  - `GET /api/v1/appointments/{id}`
  - `POST /api/v1/appointments`
  - `PUT /api/v1/appointments/{id}`
  - `DELETE /api/v1/appointments/{id}`
  - `POST /api/v1/appointments/{id}/checkin`
  - `POST /api/v1/appointments/{id}/assign`
  - `POST /api/v1/appointments/{id}/reassign`
  - `POST /api/v1/appointments/{id}/start-process`
  - `POST /api/v1/appointments/{id}/to-sign`
  - `POST /api/v1/appointments/{id}/finalize`
  - `POST /api/v1/appointments/{id}/checkout`
  - `POST /api/v1/appointments/{id}/cancel`

## Desarrollo local

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python run_dev.py
```

### Nota de resiliencia en desarrollo

Si la base SQL Server local no está disponible, la app en `APP_ENV=development` activa fallback controlado:

- Login: permite credencial semilla (`admin@muelles.local` / `Admin123!`).
- Citas y dashboard: usa store en memoria para evitar `500` y mantener operación de UI.

En ambientes no `development`, este fallback no aplica.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Compartir en red local (IP + puerto)

1. Backend:
   - Verifica `backend/.env` con `APP_HOST=0.0.0.0` y `APP_PORT=8000`.
2. Frontend:
   - Verifica `frontend/.env` con `VITE_HOST=0.0.0.0` y `VITE_PORT=5173`.
3. Ejecuta ambos servicios y abre desde otra máquina:
   - `http://<IP_DE_TU_PC>:5173`
4. Si hay bloqueo, habilita reglas de firewall para puertos `5173` (frontend) y `8000` (backend).

### Docker (todo el stack)

```bash
docker compose --env-file .env.example up --build
```

Para validacion productiva, revisar [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

## Credenciales semilla

- Email: `admin@muelles.local`
- Password: `Admin123!`

Si ya tenías la base creada con versiones anteriores, el primer login exitoso con esa credencial semilla migra automáticamente el hash legacy. También puedes aplicar `database/hotfix_fix_admin_password.sql`.

## Reglas aplicadas

- Backend como autoridad final.
- Estados mutables solo por endpoints de acción.
- Frontend sin lógica de negocio.
- SQL de negocio encapsulado en views/SPs.
- Auditoría de transiciones y eventos.
