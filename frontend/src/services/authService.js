import { apiClient } from "./apiClient";

export const authService = {
  async login(payload) {
    const response = await apiClient.post("/auth/login", payload);
    return response.data.data;
  },

  async refresh() {
    try {
      const response = await apiClient.post("/auth/refresh", { device_info: "web" });
      return response.data.data.accessToken;
    } catch {
      return null;
    }
  },

  async logout() {
    await apiClient.post("/auth/logout");
  },
};
