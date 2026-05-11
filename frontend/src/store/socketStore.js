import { create } from "zustand";

export const useSocketStore = create((set) => ({
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