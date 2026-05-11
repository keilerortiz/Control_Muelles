import { apiClient } from "./apiClient";

export const authService = {
  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return response.data.data;
  },

  async refresh() {
    try {
      const response = await apiClient.post("/auth/refresh", { 
        device_info: navigator.userAgent || "web" 
      });
      return response.data.data?.accessToken ?? null;
    } catch (error) {
      // Solo registramos el error, no lo lanzamos
      console.warn("Refresh token failed:", error?.response?.status || error.message);
      return null;
    }
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Fallo silencioso: el backend quizás ya no reconoce el token
      console.debug("Logout error (ignored):", error);
    }
  },
};