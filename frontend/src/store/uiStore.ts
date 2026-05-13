import { create } from "zustand";

interface UIStoreState {
  collapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  collapsed: false,
  toggleSidebar: () => set((state) => ({ collapsed: !state.collapsed })),
}));
