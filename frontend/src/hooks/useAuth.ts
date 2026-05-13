import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    retry: false, // ✅ Evita reintentos en credenciales incorrectas
    onSuccess: (data) => {
      setSession({ user: data.user, accessToken: data.accessToken });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    retry: false, // ✅ Evita reintentos en caso de error
    onSettled: () => {
      clearSession();
    },
  });

  return {
    loginMutation,
    logoutMutation,
  };
}