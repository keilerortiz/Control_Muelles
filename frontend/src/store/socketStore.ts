import { create } from "zustand";

export type SocketSyncState = "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "RECONNECTING" | "ERROR";

interface SocketStoreState {
  syncState: SocketSyncState;
  lastMessageAt: number | null;
  error: string | null;
  reconnectAttempts: number;
  setSyncState: (syncState: SocketSyncState) => void;
  setError: (error: string | null) => void;
  setReconnectAttempts: (reconnectAttempts: number) => void;
  markMessageReceived: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketStoreState>((set) => ({
  // Estados posibles: "CONNECTING", "CONNECTED", "DISCONNECTED", "RECONNECTING", "ERROR"
  syncState: "DISCONNECTED",
  lastMessageAt: null,
  error: null,           // mensaje de error si ocurre
  reconnectAttempts: 0,  // contador de reintentos

  // Acciones
  setSyncState: (syncState) => set({ syncState }),
  setError: (error) => set({ error }),
  setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
  markMessageReceived: () => set({ lastMessageAt: Date.now() }),

  // Resetea todo el store a valores iniciales
  reset: () =>
    set({
      syncState: "DISCONNECTED",
      lastMessageAt: null,
      error: null,
      reconnectAttempts: 0,
    }),
}));
