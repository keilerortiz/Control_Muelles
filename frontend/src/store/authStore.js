import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true, // nuevo: para saber si ya se restauró la sesión del storage
      setSession: ({ user, accessToken }) => set({ user, accessToken, isLoading: false }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearSession: () => set({ user: null, accessToken: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        // cuando termine de hidratar (leer localStorage), marcamos loading false
        state?.setLoading(false);
      },
    }
  )
);