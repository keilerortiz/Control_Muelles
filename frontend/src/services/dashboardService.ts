import { apiClient } from "./apiClient";
import type { DashboardParams, DashboardSummary } from "../domain/types/dashboard";
import { parseApiData } from "../domain/apiValidation";
import { dashboardSummarySchema } from "../schemas/apiSchemas";

export const dashboardService = {
  async summary(params: DashboardParams): Promise<DashboardSummary> {
    const response = await apiClient.get("/appointments/dashboard-summary", { params });
    return parseApiData(response.data, dashboardSummarySchema, "dashboard.summary");
  },
};
