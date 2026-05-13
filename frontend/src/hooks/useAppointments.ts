import { useMemo } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointmentsService";
import type {
  Appointment,
  AppointmentCandidates,
  AppointmentDetail,
  AppointmentListResponse,
  AppointmentListParams,
  AppointmentMutationPayload,
  AppointmentMutationVars,
  AppointmentStatusLog,
} from "../domain/types/appointments";

type QueryOptions<T> = Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">;

// ============================================
// QUERIES
// ============================================

export function useAppointments(params: AppointmentListParams, options: QueryOptions<AppointmentListResponse> = {}) {
  return useQuery<AppointmentListResponse>({
    queryKey: ["appointments", params],
    queryFn: () => appointmentsService.list(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    ...options,
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}

export function useAppointmentDetail(appointmentId: number | null | undefined, options: QueryOptions<AppointmentDetail> = {}) {
  return useQuery<AppointmentDetail>({
    queryKey: ["appointment-detail", appointmentId],
    queryFn: () => appointmentsService.detail(appointmentId as number),
    enabled: Boolean(appointmentId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}

export function useAppointmentStatusLog(appointmentId: number | null | undefined, options: QueryOptions<AppointmentStatusLog[]> = {}) {
  return useQuery<AppointmentStatusLog[]>({
    queryKey: ["appointment-status-log", appointmentId],
    queryFn: () => appointmentsService.statusLog(appointmentId as number),
    enabled: Boolean(appointmentId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}

export function useAppointmentCandidates(appointmentId: number | null | undefined, enabled = true) {
  return useQuery<AppointmentCandidates>({
    queryKey: ["appointment-candidates", appointmentId],
    queryFn: () => appointmentsService.candidates(appointmentId as number),
    enabled: Boolean(appointmentId) && enabled,
    staleTime: 5_000,
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}

// ============================================
// MUTATIONS (individuales)
// ============================================

// Helper para invalidar queries comunes después de una mutación
function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateListAndDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"], refetchType: "active" });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"], refetchType: "active" });
  };

  const invalidateAppointment = (appointmentId: number) => {
    queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId], refetchType: "active" });
    queryClient.invalidateQueries({ queryKey: ["appointment-status-log", appointmentId], refetchType: "active" });
    queryClient.invalidateQueries({ queryKey: ["appointment-candidates", appointmentId], refetchType: "active" });
  };

  return { invalidateListAndDashboard, invalidateAppointment };
}

export function useCreateAppointment() {
  const { invalidateListAndDashboard } = useInvalidateQueries();

  return useMutation<Appointment, Error, AppointmentMutationPayload>({
    mutationFn: appointmentsService.create,
    onSuccess: () => {
      invalidateListAndDashboard();
    },
  });
}

export function useUpdateAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<Appointment, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.update(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useRemoveAppointment() {
  const { invalidateListAndDashboard } = useInvalidateQueries();

  return useMutation<unknown, Error, number>({
    mutationFn: appointmentsService.remove,
    onSuccess: () => {
      invalidateListAndDashboard();
    },
  });
}

export function useCheckinAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.checkin(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useAssignAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.assign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useReassignAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.reassign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useStartProcessAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.startProcess(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useToSignAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.toSign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useFinalizeAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.finalize(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useCheckoutAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.checkout(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useCancelAppointment() {
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation<unknown, Error, AppointmentMutationVars>({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.cancel(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useAppointmentActions() {
  const create = useCreateAppointment();
  const update = useUpdateAppointment();
  const remove = useRemoveAppointment();
  const checkin = useCheckinAppointment();
  const assign = useAssignAppointment();
  const reassign = useReassignAppointment();
  const startProcess = useStartProcessAppointment();
  const toSign = useToSignAppointment();
  const finalize = useFinalizeAppointment();
  const checkout = useCheckoutAppointment();
  const cancel = useCancelAppointment();

  return useMemo(() => ({
    create,
    update,
    remove,
    checkin,
    assign,
    reassign,
    startProcess,
    toSign,
    finalize,
    checkout,
    cancel,
  }), [create, update, remove, checkin, assign, reassign, startProcess, toSign, finalize, checkout, cancel]);
}
