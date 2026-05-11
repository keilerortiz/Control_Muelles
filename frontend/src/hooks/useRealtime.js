import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../store/socketStore";

// --- Singleton state (vive fuera del hook) ---
let globalSocket = null;
let globalHeartbeat = null;
let globalReconnectTimeout = null;
let reconnectAttempts = 0;
let activeComponents = 0;          // cuántos componentes usan el hook
let intentionalClose = false;      // para no reconectar cuando se desmonta el último componente
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // backoff

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
  if (globalSocket) {
    if (globalSocket.readyState === WebSocket.OPEN) {
      globalSocket.close();
    }
    globalSocket = null;
  }
}

// Función que establece la conexión (singleton)
function connectWebSocket(setSyncState, setError, markMessageReceived, queryClient) {
  // Si ya hay una conexión abierta, no hacer nada
  if (globalSocket && globalSocket.readyState === WebSocket.OPEN) return;
  // Si ya hay una reconexión programada, esperar
  if (globalReconnectTimeout) return;

  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/dashboard-update`;
  
  const socket = new WebSocket(socketUrl);
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

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      if (parsed?.channel === "appointment-changed") {
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        queryClient.invalidateQueries({ queryKey: ["appointment-detail"] });
        queryClient.invalidateQueries({ queryKey: ["appointment-status-log"] });
        queryClient.invalidateQueries({ queryKey: ["appointment-candidates"] });
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

  socket.onerror = (err) => {
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
}

// --- Hook principal ---
export function useRealtime() {
  const queryClient = useQueryClient();
  const setSyncState = useSocketStore((state) => state.setSyncState);
  const setError = useSocketStore((state) => state.setError);
  const markMessageReceived = useSocketStore((state) => state.markMessageReceived);
  const syncState = useSocketStore((state) => state.syncState);

  useEffect(() => {
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
        stopSingleton();
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