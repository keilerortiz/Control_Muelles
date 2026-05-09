import { apiClient } from "./apiClient";

export const dashboardService = {
  async summary() {
    const response = await apiClient.get("/appointments/dashboard-summary");
    return response.data.data;
  },
};
