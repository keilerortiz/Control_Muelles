import { apiClient } from "./apiClient";

export const appointmentsService = {
  async list(params) {
    const response = await apiClient.get("/appointments", { params });
    return response.data.data;
  },

  async detail(appointmentId) {
    const response = await apiClient.get(`/appointments/${appointmentId}`);
    return response.data.data;
  },

  async candidates(appointmentId) {
    const response = await apiClient.get(`/appointments/${appointmentId}/candidates`);
    return response.data.data;
  },

  async create(payload) {
    const response = await apiClient.post("/appointments", payload);
    return response.data.data;
  },

  async update(appointmentId, payload) {
    const response = await apiClient.put(`/appointments/${appointmentId}`, payload);
    return response.data.data;
  },

  async remove(appointmentId) {
    const response = await apiClient.delete(`/appointments/${appointmentId}`);
    return response.data;
  },

  async checkin(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/checkin`, payload);
    return response.data.data;
  },

  async assign(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/assign`, payload);
    return response.data.data;
  },

  async reassign(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/reassign`, payload);
    return response.data.data;
  },

  async startProcess(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/start-process`, payload);
    return response.data.data;
  },

  async toSign(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/to-sign`, payload);
    return response.data.data;
  },

  async finalize(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/finalize`, payload);
    return response.data.data;
  },

  async checkout(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/checkout`, payload);
    return response.data.data;
  },

  async cancel(appointmentId, payload) {
    const response = await apiClient.post(`/appointments/${appointmentId}/cancel`, payload);
    return response.data.data;
  },
};
