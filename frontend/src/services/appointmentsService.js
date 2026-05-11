import { apiClient } from "./apiClient";

const BASE = "/appointments";

export const appointmentsService = {
  async list(params) {
    const response = await apiClient.get(BASE, { params });
    return response.data.data;
  },

  async detail(appointmentId) {
    const response = await apiClient.get(`${BASE}/${appointmentId}`);
    return response.data.data;
  },

  async statusLog(appointmentId) {
    const response = await apiClient.get(`${BASE}/${appointmentId}/status-log`);
    return response.data.data;
  },

  async candidates(appointmentId) {
    const response = await apiClient.get(`${BASE}/${appointmentId}/candidates`);
    return response.data.data;
  },

  async create(payload) {
    const response = await apiClient.post(BASE, payload);
    return response.data.data;
  },

  async update(appointmentId, payload) {
    const response = await apiClient.put(`${BASE}/${appointmentId}`, payload);
    return response.data.data;
  },

  async remove(appointmentId) {
    const response = await apiClient.delete(`${BASE}/${appointmentId}`);
    return response.data.data; // unificado
  },

  async checkin(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/checkin`, payload);
    return response.data.data;
  },

  async assign(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/assign`, payload);
    return response.data.data;
  },

  async reassign(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/reassign`, payload);
    return response.data.data;
  },

  async startProcess(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/start-process`, payload);
    return response.data.data;
  },

  async toSign(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/to-sign`, payload);
    return response.data.data;
  },

  async finalize(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/finalize`, payload);
    return response.data.data;
  },

  async checkout(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/checkout`, payload);
    return response.data.data;
  },

  async cancel(appointmentId, payload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/cancel`, payload);
    return response.data.data;
  },
};