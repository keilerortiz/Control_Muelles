import { create } from "zustand";

export const useUIStore = create((set) => ({
  collapsed: false,
  toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
}));
