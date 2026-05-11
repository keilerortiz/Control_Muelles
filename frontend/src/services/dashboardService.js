import { apiClient } from "./apiClient";

export const dashboardService = {
  async summary(params) {
    const response = await apiClient.get("/appointments/dashboard-summary", { params });
    return response.data.data;
  },
};
