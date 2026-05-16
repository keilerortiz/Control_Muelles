import { apiClient } from "./apiClient";
import type {
  AppointmentCandidates,
  AppointmentDetail,
  Appointment,
  AppointmentListResponse,
  AppointmentListParams,
  AppointmentMutationPayload,
  AppointmentStatusLog,
} from "../domain/types/appointments";
import { parseApiData, parseApiDataArray } from "../domain/apiValidation";
import {
  appointmentCandidatesSchema,
  appointmentListResponseSchema,
  appointmentSchema,
  appointmentStatusLogSchema,
} from "../schemas/apiSchemas";
import { z } from "zod";

const BASE = "/appointments";

export const appointmentsService = {
  async list(params: AppointmentListParams): Promise<AppointmentListResponse> {
    const response = await apiClient.get(BASE, { params });
    return parseApiData(response.data, appointmentListResponseSchema, "appointments.list");
  },

  async detail(appointmentId: number): Promise<AppointmentDetail> {
    const response = await apiClient.get(`${BASE}/${appointmentId}`);
    return parseApiData(response.data, appointmentSchema, "appointments.detail") as AppointmentDetail;
  },

  async statusLog(appointmentId: number): Promise<AppointmentStatusLog[]> {
    const response = await apiClient.get(`${BASE}/${appointmentId}/status-log`);
    return parseApiDataArray(response.data, appointmentStatusLogSchema, "appointments.statusLog");
  },

  async candidates(appointmentId: number): Promise<AppointmentCandidates> {
    const response = await apiClient.get(`${BASE}/${appointmentId}/candidates`);
    return parseApiData(response.data, appointmentCandidatesSchema, "appointments.candidates");
  },

  async create(payload: AppointmentMutationPayload): Promise<Appointment> {
    const response = await apiClient.post(BASE, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.create");
  },

  async update(appointmentId: number, payload: AppointmentMutationPayload): Promise<Appointment> {
    const response = await apiClient.put(`${BASE}/${appointmentId}`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.update");
  },

  async remove(appointmentId: number, version?: number) {
    const response = await apiClient.delete(`${BASE}/${appointmentId}`, {
      params: { version },
    });
    return parseApiData(response.data, z.unknown(), "appointments.remove");
  },

  async checkin(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/checkin`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.checkin");
  },

  async assign(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/assign`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.assign");
  },

  async reassign(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/reassign`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.reassign");
  },

  async startProcess(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/start-process`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.startProcess");
  },

  async toSign(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/to-sign`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.toSign");
  },

  async finalize(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/finalize`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.finalize");
  },

  async checkout(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/checkout`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.checkout");
  },

  async cancel(appointmentId: number, payload: AppointmentMutationPayload) {
    const response = await apiClient.post(`${BASE}/${appointmentId}/cancel`, payload);
    return parseApiData(response.data, appointmentSchema, "appointments.cancel");
  },
};
