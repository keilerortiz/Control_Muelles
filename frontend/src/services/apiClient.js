import axios from "axios";

import { authService } from "./authService";
import { useAuthStore } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const accessToken = await authService.refresh();
      if (accessToken) {
        useAuthStore.getState().setAccessToken(accessToken);
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient.request(error.config);
      }
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
