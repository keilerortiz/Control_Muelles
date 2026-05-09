import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],
  pushToast: (toast) => set((state) => ({ toasts: [...state.toasts, { id: crypto.randomUUID(), ...toast }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
