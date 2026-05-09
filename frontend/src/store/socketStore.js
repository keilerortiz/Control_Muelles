import { create } from "zustand";

export const useSocketStore = create((set) => ({
  syncState: "DISCONNECTED",
  lastMessageAt: null,
  setSyncState: (syncState) => set({ syncState }),
  markMessage: () => set({ lastMessageAt: Date.now() }),
}));
