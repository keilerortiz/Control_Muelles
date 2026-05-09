# Frontend Architecture & Structure – Línea Base de Producción

## Framework

- React 18+
- Vite 5+
- Tailwind CSS
- React Router
- Zustand
- TanStack Query
- React Hook Form
- Zod

La interfaz debe construirse como una aplicación SaaS empresarial moderna, optimizada para operaciones en tiempo real, alta densidad de información y navegación rápida.

---

# Objetivos de UX Operativa

## 1. Visibilidad Instantánea

El usuario debe comprender el estado operativo del sistema en menos de 2 segundos.

---

## 2. Acciones Rápidas

- Acciones primarias en 1 clic.
- Acciones secundarias máximo en 2 clics.

---

## 3. Reducción de Errores

- Validaciones tempranas.
- Estados visuales claros.
- Confirmaciones explícitas.
- Acciones peligrosas protegidas.

---

## 4. Backend como Fuente de Verdad

El frontend nunca modifica el estado local de forma optimista sin confirmación del backend.

Toda mutación debe esperar respuesta del servidor.

---

# Arquitectura General

## Estructura Base

```text
Frontend (React/Vite)
├── AppLayout
├── Pages
├── Components
├── Hooks
├── Services
├── Store
├── Routes
└── Utils
```

---

# Estructura de Carpetas

```text
/frontend
├── src
│   ├── components
│   │   ├── ui
│   │   ├── layout
│   │   ├── shared
│   │   ├── dashboard
│   │   └── domain
│   ├── hooks
│   ├── pages
│   ├── services
│   ├── store
│   ├── routes
│   ├── utils
│   ├── styles
│   ├── App.jsx
│   └── main.jsx
├── public
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

---

# Layout Principal

## AppLayout

Estructura visual obligatoria:

```text
┌────────────────────────────────────┐
│ Topbar                             │
├──────────────┬─────────────────────┤
│ Sidebar      │ Main Content        │
│              │                     │
│              │                     │
├──────────────┴─────────────────────┤
│ Notifications / Footer             │
└────────────────────────────────────┘
```

---

## Sidebar

Características:

- Colapsable.
- Persistencia en localStorage.
- Navegación basada en roles.
- Estado activo visible.
- Responsive.
- Overlay móvil.

---

## Topbar

Debe incluir:

- Breadcrumb dinámico.
- Estado realtime.
- Usuario autenticado.
- Menú de sesión.
- Acciones contextuales.
- Indicador de sincronización.

---

# Arquitectura por Capas

## Pages

Responsabilidades:

- Orquestar vistas.
- Consumir hooks.
- Gestionar layouts.
- Coordinar componentes.

Prohibido:

- Lógica de negocio compleja.
- Requests HTTP directos.

---

## Components

Separación:

| Carpeta | Uso |
|---|---|
| ui | Design system reutilizable |
| layout | Sidebar, Topbar, Layout |
| shared | Loader, EmptyState, ErrorState |
| dashboard | KPIs, grids, alertas |
| domain | Componentes específicos |

---

## Hooks

Responsabilidades:

- Estado.
- Side effects.
- Realtime.
- Integración API.
- Coordinación UI.

Ejemplos:

- useAuth
- useRealtime
- useSocket
- useAppointments
- useDashboard

---

## Services

Toda comunicación HTTP debe centralizarse.

Responsabilidades:

- Axios instance.
- Interceptores.
- Refresh token.
- Manejo de errores.
- Serialización.

Prohibido:

- Requests HTTP en componentes.

---

## Store

Estado global mediante:

- Zustand.
- TanStack Query.

Separación:

| Store | Uso |
|---|---|
| AuthStore | Sesión |
| UIStore | Sidebar, modales |
| SocketStore | Estado realtime |
| ToastStore | Notificaciones |

---

# Design System

## Componentes Base Obligatorios

```text
/components/ui
```

Lista mínima:

- Button
- Input
- Select
- Checkbox
- Radio
- Badge
- Card
- Modal
- Tooltip
- Dropdown
- Table
- Loader
- Skeleton
- EmptyState
- ErrorState

---

## Reglas

- Reutilizables.
- Accesibles.
- Sin lógica de negocio.
- Compatibles con dark mode futuro.
- Tipados mediante props.

---

# Estilo Visual

## Diseño SaaS Profesional

Características:

- Minimalista.
- Alta legibilidad.
- Espaciado consistente.
- Bordes suaves.
- Sombras ligeras.
- Jerarquía visual clara.

Inspiración:

- Stripe.
- Linear.
- Notion.
- Vercel.

---

## Tailwind CSS

Uso obligatorio.

Prohibido:

- CSS inline excesivo.
- Estilos desorganizados.
- CSS global sin control.

---

# Routing

## React Router

Separación:

```text
/routes
├── AppRouter.jsx
├── ProtectedRoute.jsx
└── routeConfig.js
```

---

## ProtectedRoute

Validaciones:

- Usuario autenticado.
- Roles permitidos.
- Token válido.

---

## Rutas Públicas

- /login

---

## Rutas Privadas

Dentro de:

```text
<AppLayout />
```

---

# Manejo de Estado

## Zustand

Uso:

- Estado UI.
- Estado de sesión.
- Estado realtime.

---

## TanStack Query

Uso:

- Caché de API.
- Invalidaciones.
- Refetch.
- Sincronización.

---

## Reglas

- Backend como única fuente de verdad.
- Invalidación tras mutaciones.
- Sin mutaciones optimistas peligrosas.

---

# Consumo de API

## Axios Centralizado

Archivo:

```text
/services/apiClient.js
```

Responsabilidades:

- Base URL.
- Interceptores.
- JWT.
- Refresh token.
- Manejo de errores.

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

# Formularios

## React Hook Form + Zod

Uso obligatorio.

---

## Reglas

- Validación en blur.
- Validación en submit.
- Mensajes específicos.
- Tipado estricto.

---

## Ejemplo

```javascript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
```

---

# Dashboard Operacional

## Objetivo

Proporcionar una vista operativa central en tiempo real.

---

## Componentes

- KPIs.
- Alertas.
- Grid operativo.
- Cola priorizada.
- Indicadores realtime.

---

## Estados Visuales

| Estado | Color |
|---|---|
| Crítico | Rojo |
| Advertencia | Amarillo |
| Operativo | Verde |
| Informativo | Azul/Gris |

---

# Tiempo Real

## WebSocket

Cliente Socket.IO o WebSocket nativo.

Canal principal:

```text
dashboard-update
```

---

## Reglas

El backend envía snapshots completos.

El frontend:

- Reemplaza el estado local.
- Nunca hace merge manual.

---

## Estados de Sincronización

| Estado | Descripción |
|---|---|
| LIVE | <3s |
| DELAYED | 3-10s |
| STALE | >10s |
| DISCONNECTED | Sin conexión |

---

# Tablas Operativas

## Características Obligatorias

- Header sticky.
- Hover.
- Paginación.
- Sorting.
- Filtros.
- Empty state.
- Loading state.

---

## Virtualización

Obligatoria para listas >200 registros.

Uso recomendado:

- react-window

---

# Manejo de Errores

## Estados Compartidos

Componentes:

- ErrorState
- EmptyState
- Loader
- Skeleton

---

## Manejo de Conflictos

Errores 409 deben mostrar:

- Motivo.
- Estado actual.
- Opciones de refresco.

---

# Acciones

## Jerarquía

| Tipo | Color |
|---|---|
| Primary | Azul/Verde |
| Secondary | Gris |
| Dangerous | Rojo |

---

## Reglas

- Disabled durante requests.
- Tooltip si no está permitido.
- Confirmación obligatoria en acciones peligrosas.

---

# Rendimiento

## Estrategias Obligatorias

- Code splitting.
- Lazy loading.
- Memoización.
- Debounce.
- Virtualización.
- Cache controlado.
- Tailwind purge.

---

## React.lazy

Obligatorio por rutas.

---

## Debounce

150ms mínimo en filtros de búsqueda.

---

# Accesibilidad

## Reglas

- HTML semántico.
- Navegación por teclado.
- Contraste mínimo 4.5:1.
- Focus visible.
- Atributos ARIA.

---

# Seguridad Frontend

## JWT

- Access token en memoria.
- Refresh token httpOnly.

---

## Reglas

- Nunca almacenar refresh token en localStorage.
- Sanitizar inputs.
- Validar roles en frontend.
- Validar permisos visuales.

---

# Testing

## Frameworks

- Vitest.
- React Testing Library.

---

## Cobertura

Mínimo:

- Hooks críticos.
- Components críticos.
- Flujos operativos.

---

# Build y Deploy

## Producción

- Build estático.
- Nginx.
- Compresión gzip.
- Cache headers.

---

## Variables de Entorno

Archivo:

```env
VITE_API_BASE_URL=/api/v1
VITE_SOCKET_URL=/socket.io
```

---

# Reglas No Negociables

- Backend es la única fuente de verdad.
- Sin lógica de negocio en componentes.
- Sin requests HTTP directos en páginas.
- Design system reutilizable obligatorio.
- Arquitectura modular obligatoria.
- Responsive obligatorio.
- Realtime consistente.
- Estados visuales claros.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn0file10

