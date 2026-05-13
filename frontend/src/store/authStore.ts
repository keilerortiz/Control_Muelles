import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../domain/types/auth";

interface AuthStoreState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setSession: (session: { user: AuthUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist<AuthStoreState>(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true, // nuevo: para saber si ya se restauró la sesión del storage
      setSession: ({ user, accessToken }: { user: AuthUser; accessToken: string }) =>
        set({ user, accessToken, isLoading: false }),
      setAccessToken: (accessToken: string | null) => set({ accessToken }),
      clearSession: () => set({ user: null, accessToken: null, isLoading: false }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
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
