# Frontend Architecture & Structure – Línea Base de Producción (SaaS Dashboard Avanzado)

## Objetivo

Definir la arquitectura visual, estructural y operacional del frontend para aplicaciones empresariales basadas en:

- React 18+
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Realtime snapshots
- Dashboards operacionales SaaS

Este documento define exclusivamente:

- UX operacional.
- Arquitectura visual.
- Layouts.
- Componentes.
- Realtime UI.
- Estados de sincronización.
- Manejo de concurrencia visual.
- Escalabilidad frontend.
- Patrones enterprise UI.

---

# 1. Principios de Diseño

## 1.1 Objetivos de UX Operativa

### Visibilidad Instantánea

El usuario debe comprender el estado operativo del sistema en menos de 2 segundos.

---

### Decisiones Rápidas

- Acciones primarias en 1 clic.
- Acciones secundarias máximo en 2 clics.

---

### Reducción de Errores

La interfaz debe minimizar errores mediante:

- Validación anticipada.
- Confirmaciones explícitas.
- Estados visuales claros.
- Feedback inmediato.

---

### Backend como Fuente de Verdad

El frontend:

- Nunca modifica datos sin confirmación backend.
- Nunca asume éxito.
- Nunca mantiene estados divergentes.

---

# 2. Jerarquía de Información

## Clasificación Visual

| Nivel | Color | Uso |
|---|---|---|
| Crítico | Rojo | Alertas, bloqueos, errores |
| Importante | Amarillo | Atención requerida |
| Informativo | Azul/Gris | Contexto y detalles |

---

# 3. Clasificación de Estados de Entidad

## Activos

Entidades:

- En ejecución.
- Realtime.
- Operacionales.

---

## Pasivos

Entidades:

- Históricas.
- Archivadas.
- Finalizadas.

---

## Regla Crítica

Nunca mezclar:

- Datos activos.
- Datos históricos.

en la misma vista realtime.

---

# 4. Arquitectura General del Frontend

## Estructura

```text
Frontend (React/Vite)
├── AppLayout
├── Contextos Globales
├── Pages
├── Components
├── Hooks
├── Services
├── Store
├── Utils
└── Routes
```

---

# 5. Arquitectura de Capas

## Pages

Responsabilidades:

- Orquestar vistas.
- Consumir hooks.
- Coordinar componentes.
- Configurar layouts.

---

## Components

Separación obligatoria:

| Carpeta | Uso |
|---|---|
| ui | Design system |
| layout | Sidebar, Topbar, Layout |
| shared | Estados compartidos |
| dashboard | Widgets operativos |
| domain | Componentes específicos |

---

## Hooks

Responsabilidades:

- Estado.
- Side effects.
- Realtime.
- Sincronización.
- Integración API.

---

## Services

Responsabilidades:

- Axios.
- WebSocket client.
- Interceptores.
- Refresh token.
- Manejo de errores.

---

## Store

Uso recomendado:

- Zustand.
- TanStack Query.

---

# 6. Estructura de Carpetas

```text
src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── shared/
│   ├── dashboard/
│   └── domain/
├── hooks/
├── pages/
├── services/
├── store/
├── routes/
├── utils/
├── styles/
├── App.jsx
└── main.jsx
```

---

# 7. Layout Principal – AppLayout

## Estructura Visual

```text
┌────────────────────────────────────────────┐
│ TOPBAR                                    │
├──────────────┬─────────────────────────────┤
│ SIDEBAR      │ CONTENIDO PRINCIPAL        │
│              │                             │
│              │                             │
├──────────────┴─────────────────────────────┤
│ NOTIFICATIONS / FOOTER                    │
└────────────────────────────────────────────┘
```

---

## Características Obligatorias

### Sidebar

- Colapsable.
- Persistente.
- Responsive.
- Navegación por roles.
- Overlay mobile.

---

### Topbar

Debe incluir:

- Breadcrumb dinámico.
- Estado realtime.
- Usuario autenticado.
- Acciones rápidas.
- Dropdown usuario.

---

### Content Outlet

Render dinámico mediante React Router.

---

# 8. Sidebar

## Características

- Ícono + texto.
- Estado activo visible.
- Colapsable.
- Persistencia localStorage.
- Responsive mobile.

---

## Navegación Condicional

Visibilidad basada en:

- Roles.
- Permisos.
- Contexto operacional.

---

# 9. Topbar

## Componentes

### Breadcrumb

Generación automática basada en ruta.

---

### Indicador Realtime

Estados:

| Estado | Color |
|---|---|
| LIVE | Verde |
| DELAYED | Amarillo |
| STALE | Rojo |
| DISCONNECTED | Rojo intermitente |

---

### User Dropdown

Debe incluir:

- Perfil.
- Cambio password.
- Logout.

---

# 10. Contextos Globales

| Contexto | Uso | Persistencia |
|---|---|---|
| AuthContext | Sesión | localStorage |
| SocketContext | Realtime | memoria |
| DateRangeContext | filtros fecha | sessionStorage |
| ToastContext | notificaciones | memoria |

---

# 11. Enrutamiento

## React Router

Estructura:

```text
/routes
├── AppRouter.jsx
├── ProtectedRoute.jsx
└── routeConfig.js
```

---

# 12. ProtectedRoute

## Validaciones

- Usuario autenticado.
- JWT válido.
- Roles permitidos.

---

## Rutas Públicas

```text
/login
```

---

## Rutas Privadas

Dentro de:

```jsx
<AppLayout />
```

---

# 13. Design System

## Objetivo

Construir componentes:

- Reutilizables.
- Escalables.
- Accesibles.
- Independientes.

---

# 14. Componentes UI Base

## Lista Obligatoria

```text
Button
Input
Select
Checkbox
Radio
Badge
Card
Modal
Tooltip
Dropdown
Table
Loader
Skeleton
EmptyState
ErrorState
ConfirmDialog
```

---

# 15. Reglas del Design System

## Prohibiciones

Componentes UI NO deben:

- Consumir API.
- Conocer roles.
- Contener lógica negocio.

---

## Requisitos

- Tailwind.
- data-testid.
- Accesibilidad.
- Dark mode ready.

---

# 16. Patrones de Página

## Estructura Base

```jsx
<PageLayout>
  <PageHeader />
  <ActionBar />
  <PageContent />
  <SidePanels />
</PageLayout>
```

---

# 17. Dashboard Operacional

## Objetivo

Vista principal realtime del sistema.

---

# 18. Componentes del Dashboard

## KPIs

Tarjetas con:

- Valor actual.
- Delta.
- Tendencia.

---

## AlertPanel

Alertas priorizadas.

---

## ResourceGrid

Visualización operacional:

- disponibilidad
- ocupación
- estado

---

## QueuePanel

Elementos pendientes ordenados por prioridad.

---

# 19. Realtime Architecture

## Regla Crítica

El backend envía:

```text
snapshots completos
```

El frontend:

```text
reemplaza estado local
```

---

## Prohibido

- Merge manual.
- Mutaciones optimistas peligrosas.
- Estados divergentes.

---

# 20. Eventos Realtime

| Evento | Uso |
|---|---|
| dashboard-update | snapshot principal |
| item-updated | actualización puntual |
| alerts-update | alertas |

---

# 21. Estados de Sincronización

| Estado | Condición |
|---|---|
| LIVE | <3 segundos |
| DELAYED | 3-10 segundos |
| STALE | >10 segundos |
| DISCONNECTED | socket caído |

---

# 22. Reglas de Concurrencia

## Flujo de Acción

1. Usuario ejecuta acción.
2. HTTP request.
3. Lock optimista temporal.
4. Espera snapshot realtime.
5. Confirmación visual.

---

# 23. Manejo de Conflictos (409)

## UI Obligatoria

Modal con:

- Motivo conflicto.
- Estado servidor.
- Alternativas.
- Botón refrescar.

---

# 24. Reconciliación

## Estrategia

Si no llega snapshot:

```text
GET puntual de entidad
```

---

## Si hay discrepancia

- Invalidar caché.
- Mostrar conflicto.
- Refrescar vista.

---

# 25. Jerarquía de Botones

| Tipo | Color |
|---|---|
| PRIMARY | Azul/Verde |
| SECONDARY | Gris |
| DANGEROUS | Rojo |

---

# 26. Reglas de Acciones

## Obligatorio

- Loading state.
- Disabled durante request.
- Confirmación acciones peligrosas.
- Tooltips explicativos.

---

# 27. Validación de Formularios

## Librerías

- React Hook Form.
- Zod.

---

## Reglas

- Validación blur.
- Validación submit.
- Mensajes específicos.

---

# 28. Errores Operativos

## Códigos Soportados

| Código | Acción UI |
|---|---|
| INVALID_STATE_TRANSITION | sugerir flujo correcto |
| RESOURCE_OCCUPIED | mostrar alternativas |
| STALE_DATA | refrescar |
| SERVER_ERROR | retry |

---

# 29. Feedback Visual

## Toasts

| Tipo | Duración |
|---|---|
| Success | 3 segundos |
| Error | persistente/retry |

---

## Loading

- Skeleton.
- Spinner.
- Progress indicators.

---

# 30. Tablas Operativas

## Requisitos

- Header sticky.
- Hover.
- Sorting.
- Paginación.
- Empty state.
- Loading state.

---

# 31. Virtualización

## Obligatoria

Para listas:

```text
>200 registros
```

Uso recomendado:

```text
react-window
```

---

# 32. Modos Operativos

| Modo | Condición |
|---|---|
| Normal | <500 entidades |
| Alta Carga | 500-2000 |
| Crítico | >2000 |

---

# 33. Comportamiento por Modo

## Normal

- Funcionalidad completa.

---

## Alta Carga

- Dashboard priorizado.
- Refresco reducido.

---

## Crítico

- Top N.
- Solo acciones críticas.
- Banner advertencia.

---

# 34. Estados Extremos

## Sin Entidades

Mostrar:

- Empty state positivo.
- KPIs período.

---

## Sobrecarga

- Modo crítico automático.
- Filtros sugeridos.

---

## Desconexión

- Últimos datos conocidos.
- Watermark obsoleto.
- Botón reconectar.

---

# 35. Rendimiento

## Estrategias Obligatorias

- Code splitting.
- Lazy loading.
- Memoización.
- Virtualización.
- Debounce.
- Cache inteligente.

---

# 36. React.lazy

Obligatorio por rutas.

---

# 37. Debounce

Mínimo:

```text
150ms
```

---

# 38. Accesibilidad

## Reglas

- HTML semántico.
- ARIA.
- Navegación teclado.
- Contraste mínimo 4.5:1.
- Focus visible.

---

# 39. Seguridad Frontend

## Reglas

- Access token memoria.
- Refresh token httpOnly.
- Validación visual permisos.
- Logout automático ante 401.

---

# 40. Instrumentación UX

## Métricas

- Tiempo acción.
- Latencia socket.
- Errores.
- Acciones frecuentes.

---

## Envío

Analytics no bloqueante hacia backend.

---

# 41. Contratos de Comunicación

## API

Axios centralizado.

---

## WebSocket

- Reconexion automática.
- Backoff exponencial.
- Solo snapshots.

---

# 42. Reglas No Negociables

- Backend es autoridad final.
- Frontend nunca asume éxito.
- Snapshot replacement obligatorio.
- Arquitectura modular obligatoria.
- UI SaaS enterprise obligatoria.
- Realtime consistente.
- Estados visuales claros.
- Virtualización obligatoria.
- Accesibilidad obligatoria.
- Código listo para producción.

Fuente base adaptada desde: fileciteturn3file0

