import { apiClient } from "./apiClient";

export const mastersService = {
  async catalogs() {
    const response = await apiClient.get("/masters/catalogs");
    return response.data.data;
  },

  async create(resource, payload) {
    const response = await apiClient.post(`/masters/${resource}`, payload);
    return response.data.data;
  },

  async update(resource, id, payload) {
    const response = await apiClient.put(`/masters/${resource}/${id}`, payload);
    return response.data.data;
  },

  async remove(resource, id) {
    const response = await apiClient.delete(`/masters/${resource}/${id}`);
    return response.data.data;
  },
};
