import { apiClient } from "./apiClient";
import type {
  DashboardKpisTimeline,
  DashboardParams,
  DashboardSummary,
  OperatorPerformanceResponse,
} from "../domain/types/dashboard";
import { parseApiData } from "../domain/apiValidation";
import { dashboardKpisTimelineSchema, dashboardSummarySchema, operatorPerformanceSchema } from "../schemas/apiSchemas";

export const dashboardService = {
  async summary(params: DashboardParams): Promise<DashboardSummary> {
    const response = await apiClient.get("/appointments/dashboard-summary", { params });
    return parseApiData(response.data, dashboardSummarySchema, "dashboard.summary");
  },
  async kpisTimeline(params: DashboardParams): Promise<DashboardKpisTimeline> {
    const response = await apiClient.get("/appointments/kpis/timeline", { params });
    return parseApiData(response.data, dashboardKpisTimelineSchema, "dashboard.kpisTimeline");
  },
  async operatorPerformance(params: DashboardParams): Promise<OperatorPerformanceResponse> {
    const response = await apiClient.get("/appointments/operators/performance", { params });
    return parseApiData(response.data, operatorPerformanceSchema, "dashboard.operatorPerformance");
  },
};
