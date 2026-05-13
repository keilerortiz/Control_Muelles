import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { realtimeClientId } from "../services/realtimeClientId";
import { useSocketStore } from "../store/socketStore";
import type { SocketSyncState } from "../store/socketStore";

// --- Singleton state (vive fuera del hook) ---
type TimeoutRef = ReturnType<typeof setTimeout>;
type IntervalRef = ReturnType<typeof setInterval>;
type RealtimeEventPayload = {
  appointmentId?: number | string;
  action?: string;
  originClientId?: string;
  [key: string]: unknown;
};

let globalSocket: WebSocket | null = null;
let globalHeartbeat: IntervalRef | null = null;
let globalReconnectTimeout: TimeoutRef | null = null;
let globalInvalidationTimeout: TimeoutRef | null = null;
let globalStopTimeout: TimeoutRef | null = null;
let pendingRealtimeEvents: RealtimeEventPayload[] = [];
let reconnectAttempts = 0;
let activeComponents = 0;          // cuántos componentes usan el hook
let intentionalClose = false;      // para no reconectar cuando se desmonta el último componente
let suppressSocketErrors = false;   // evita ruido al cerrar sockets intencionalmente en dev/strict-mode
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // backoff
const INVALIDATION_DEBOUNCE_MS = 250;
const STOP_SINGLETON_DELAY_MS = 250;

function shouldCloseSocket(socket: WebSocket) {
  return socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN;
}

// Función interna para limpiar la conexión actual (sin resetear el contador)
function cleanupConnection() {
  if (globalHeartbeat) {
    clearInterval(globalHeartbeat);
    globalHeartbeat = null;
  }
  if (globalReconnectTimeout) {
    clearTimeout(globalReconnectTimeout);
    globalReconnectTimeout = null;
  }
  if (globalInvalidationTimeout) {
    clearTimeout(globalInvalidationTimeout);
    globalInvalidationTimeout = null;
  }
  pendingRealtimeEvents = [];
  if (globalSocket) {
    globalSocket.onopen = null;
    globalSocket.onmessage = null;
    globalSocket.onclose = null;
    globalSocket.onerror = null;
    if (shouldCloseSocket(globalSocket)) {
      suppressSocketErrors = true;
      globalSocket.close();
    }
    globalSocket = null;
  }
}

function invalidateActiveQueries(queryClient: QueryClient, queryKey: readonly unknown[]) {
  queryClient.invalidateQueries({
    queryKey,
    refetchType: "active",
  });
}

function flushRealtimeInvalidations(queryClient: QueryClient) {
  const events = pendingRealtimeEvents;
  pendingRealtimeEvents = [];
  globalInvalidationTimeout = null;

  if (events.length === 0) return;

  const changedAppointmentIds = new Set(
    events
      .map((event) => Number(event?.appointmentId))
      .filter((appointmentId) => Number.isFinite(appointmentId) && appointmentId > 0),
  );
  const resourceAffectingActions = new Set(["ASSIGN", "REASSIGN", "FINALIZE", "CHECKOUT", "CANCEL", "DELETE"]);
  const shouldRefreshCandidates = events.some(
    (event) => typeof event?.action === "string" && resourceAffectingActions.has(event.action),
  );

  invalidateActiveQueries(queryClient, ["appointments"]);
  invalidateActiveQueries(queryClient, ["dashboard-summary"]);

  changedAppointmentIds.forEach((appointmentId) => {
    invalidateActiveQueries(queryClient, ["appointment-detail", appointmentId]);
    invalidateActiveQueries(queryClient, ["appointment-status-log", appointmentId]);
    invalidateActiveQueries(queryClient, ["appointment-candidates", appointmentId]);
  });

  if (shouldRefreshCandidates) {
    queryClient.invalidateQueries({
      queryKey: ["appointment-candidates"],
      refetchType: "active",
    });
  }
}

function scheduleRealtimeInvalidation(queryClient: QueryClient, payload: RealtimeEventPayload) {
  pendingRealtimeEvents.push(payload);
  if (globalInvalidationTimeout) return;

  globalInvalidationTimeout = setTimeout(
    () => flushRealtimeInvalidations(queryClient),
    INVALIDATION_DEBOUNCE_MS,
  );
}

// Función que establece la conexión (singleton)
function connectWebSocket(
  setSyncState: (value: SocketSyncState) => void,
  setError: (error: string | null) => void,
  markMessageReceived: () => void,
  queryClient: QueryClient,
) {
  // Si ya hay una conexión abierta o en curso, no hacer nada
  if (
    globalSocket &&
    (globalSocket.readyState === WebSocket.OPEN || globalSocket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  // Si ya hay una reconexión programada, esperar
  if (globalReconnectTimeout) return;

  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/dashboard-update`;
  
  const socket = new WebSocket(socketUrl);
  suppressSocketErrors = false;
  globalSocket = socket;
  setSyncState("CONNECTING");

  socket.onopen = () => {
    if (intentionalClose) {
      socket.close();
      return;
    }
    reconnectAttempts = 0;
    setSyncState("CONNECTED");

    // Iniciar heartbeat (ping cada 10s)
    if (globalHeartbeat) clearInterval(globalHeartbeat);
    globalHeartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send("ping");
      }
    }, 10000);
  };

  socket.onmessage = (event: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(event.data) as { channel?: string; payload?: RealtimeEventPayload };
      if (parsed?.channel === "appointment-changed") {
        const payload = parsed.payload || {};
        if (payload.originClientId !== realtimeClientId) {
          scheduleRealtimeInvalidation(queryClient, payload);
        }
      }
    } catch (err) {
      console.warn("WebSocket message parse error", err);
    }
    markMessageReceived();
    // Si el estado actual no es CONNECTED, lo actualizamos
    if (useSocketStore.getState().syncState !== "CONNECTED") {
      setSyncState("CONNECTED");
    }
  };

  socket.onclose = () => {
    if (intentionalClose || suppressSocketErrors) {
      suppressSocketErrors = false;
      return;
    }

    setSyncState("DISCONNECTED");
    if (globalHeartbeat) {
      clearInterval(globalHeartbeat);
      globalHeartbeat = null;
    }

    // Reintentar solo si hay componentes activos y no fue un cierre intencional
    if (activeComponents > 0 && !intentionalClose && reconnectAttempts < RECONNECT_DELAYS.length) {
      const delay = RECONNECT_DELAYS[reconnectAttempts];
      reconnectAttempts++;
      setSyncState("RECONNECTING");
      globalReconnectTimeout = setTimeout(() => {
        globalReconnectTimeout = null;
        connectWebSocket(setSyncState, setError, markMessageReceived, queryClient);
      }, delay);
    }
  };

  socket.onerror = (err: Event) => {
    if (intentionalClose || suppressSocketErrors) {
      return;
    }
    console.error("WebSocket error", err);
    setError("WebSocket error");
    setSyncState("ERROR");
    socket.close(); // forzar cierre para que onclose intente reconectar
  };
}

// Detener completamente el singleton (cuando no quedan componentes)
function stopSingleton() {
  intentionalClose = true;
  cleanupConnection();
  intentionalClose = false;
  reconnectAttempts = 0;
  activeComponents = 0;
  if (globalStopTimeout) {
    clearTimeout(globalStopTimeout);
    globalStopTimeout = null;
  }
}

// --- Hook principal ---
export function useRealtime() {
  const queryClient = useQueryClient();
  const setSyncState = useSocketStore((state) => state.setSyncState);
  const setError = useSocketStore((state) => state.setError);
  const markMessageReceived = useSocketStore((state) => state.markMessageReceived);
  const syncState = useSocketStore((state) => state.syncState);

  useEffect(() => {
    if (globalStopTimeout) {
      clearTimeout(globalStopTimeout);
      globalStopTimeout = null;
    }

    activeComponents++;
    // Si es el primer componente que se monta, iniciar la conexión
    if (activeComponents === 1) {
      intentionalClose = false;
      connectWebSocket(setSyncState, setError, markMessageReceived, queryClient);
    }

    return () => {
      activeComponents--;
      // Si no quedan componentes, cerrar todo
      if (activeComponents === 0) {
        globalStopTimeout = setTimeout(() => {
          if (activeComponents === 0) {
            stopSingleton();
          }
        }, STOP_SINGLETON_DELAY_MS);
      }
    };
  }, [setSyncState, setError, markMessageReceived, queryClient]);

  const badgeColor = useMemo(() => {
    switch (syncState) {
      case "CONNECTED":
        return "text-success-700";
      case "CONNECTING":
      case "RECONNECTING":
        return "text-warning-700";
      case "DISCONNECTED":
      case "ERROR":
        return "text-error-700";
      default:
        return "text-error-700";
    }
  }, [syncState]);

  return { syncState, badgeColor };
}
