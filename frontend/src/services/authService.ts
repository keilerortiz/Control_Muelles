import { apiClient } from "./apiClient";
import type { AuthSession, LoginPayload } from "../domain/types/auth";
import { getErrorMessage } from "../domain/appointmentsConfig";
import { parseApiData } from "../domain/apiValidation";
import { z } from "zod";

const authSessionSchema = z.object({
  user: z.object({
    name: z.string(),
    id: z.union([z.number(), z.string()]).optional(),
    email: z.string().optional(),
    roles: z.array(z.string()),
  }),
  accessToken: z.string(),
});

const refreshApiResponseSchema = z.object({
  accessToken: z.string().nullable().optional(),
});

export const authService = {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const response = await apiClient.post("/auth/login", payload);
    return parseApiData(response.data, authSessionSchema, "auth.login");
  },

  async refresh(): Promise<string | null> {
    try {
      const response = await apiClient.post("/auth/refresh", { 
        device_info: navigator.userAgent || "web" 
      });
      const payload = parseApiData(response.data, refreshApiResponseSchema, "auth.refresh");
      return payload?.accessToken ?? null;
    } catch (error: unknown) {
      console.warn("Refresh token failed:", getErrorMessage(error));
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Fallo silencioso: el backend quizás ya no reconoce el token.
    }
  },
};
