import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { realtimeClientId } from "./realtimeClientId";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;
const AUTH_STORAGE_KEY = "auth-storage";

function getPersistedAccessToken() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown } };
    return typeof parsed.state?.accessToken === "string" ? parsed.state.accessToken : null;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (!config.headers) {
    return config;
  }

  config.headers.set("X-Client-ID", realtimeClientId);
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as RetryableRequestConfig | undefined;
    if (!originalRequest) return Promise.reject(error);

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
    const isLoginRequest = originalRequest.url?.includes("/auth/login");

    if (axiosError.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isLoginRequest) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = import("./authService")
          .then(({ authService }) => authService.refresh())
          .finally(() => {
            refreshPromise = null;
          });
      }

      let accessToken: string | null = null;
      try {
        accessToken = await refreshPromise;
      } catch (refreshError) {
        console.warn("Refresh token request failed", refreshError);
      }

      if (accessToken) {
        useAuthStore.getState().setAccessToken(accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return apiClient.request(originalRequest);
      }

      const persistedAccessToken = getPersistedAccessToken();
      if (persistedAccessToken && persistedAccessToken !== useAuthStore.getState().accessToken) {
        useAuthStore.getState().setAccessToken(persistedAccessToken);
        if (originalRequest.headers) {
          originalRequest.headers.set("Authorization", `Bearer ${persistedAccessToken}`);
        }
        return apiClient.request(originalRequest);
      }

      useAuthStore.getState().clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
