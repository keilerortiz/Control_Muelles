import axios from "axios";

import { realtimeClientId } from "./realtimeClientId";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  config.headers = config.headers || {};
  config.headers["X-Client-ID"] = realtimeClientId;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
    const isLoginRequest = originalRequest.url?.includes("/auth/login");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isLoginRequest) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = import("./authService")
          .then(({ authService }) => authService.refresh())
          .finally(() => {
            refreshPromise = null;
          });
      }

      let accessToken = null;
      try {
        accessToken = await refreshPromise;
      } catch (refreshError) {
        console.warn("Refresh token request failed", refreshError);
      }

      if (accessToken) {
        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient.request(originalRequest);
      }

      useAuthStore.getState().clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
