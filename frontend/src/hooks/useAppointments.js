import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsService } from "../services/appointmentsService";

// ============================================
// QUERIES
// ============================================

export function useAppointments(params) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => appointmentsService.list(params),
  });
}

export function useAppointmentDetail(appointmentId) {
  return useQuery({
    queryKey: ["appointment-detail", appointmentId],
    queryFn: () => appointmentsService.detail(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useAppointmentStatusLog(appointmentId) {
  return useQuery({
    queryKey: ["appointment-status-log", appointmentId],
    queryFn: () => appointmentsService.statusLog(appointmentId),
    enabled: Boolean(appointmentId),
  });
}

export function useAppointmentCandidates(appointmentId, enabled = true) {
  return useQuery({
    queryKey: ["appointment-candidates", appointmentId],
    queryFn: () => appointmentsService.candidates(appointmentId),
    enabled: Boolean(appointmentId) && enabled,
    staleTime: 5_000,
  });
}

// ============================================
// MUTATIONS (individuales)
// ============================================

// Helper para invalidar queries comunes después de una mutación
function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateListAndDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const invalidateAppointment = (appointmentId) => {
    queryClient.invalidateQueries({ queryKey: ["appointment-detail", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-status-log", appointmentId] });
    queryClient.invalidateQueries({ queryKey: ["appointment-candidates", appointmentId] });
  };

  return { invalidateListAndDashboard, invalidateAppointment };
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard } = useInvalidateQueries();

  return useMutation({
    mutationFn: appointmentsService.create,
    onSuccess: () => {
      invalidateListAndDashboard();
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.update(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useRemoveAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard } = useInvalidateQueries();

  return useMutation({
    mutationFn: appointmentsService.remove,
    onSuccess: () => {
      invalidateListAndDashboard();
    },
  });
}

export function useCheckinAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.checkin(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useAssignAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.assign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useReassignAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.reassign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useStartProcessAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.startProcess(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useToSignAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.toSign(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useFinalizeAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.finalize(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useCheckoutAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
    mutationFn: ({ appointmentId, payload }) =>
      appointmentsService.checkout(appointmentId, payload),
    onSuccess: (_, { appointmentId }) => {
      invalidateListAndDashboard();
      invalidateAppointment(appointmentId);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { invalidateListAndDashboard, invalidateAppointment } = useInvalidateQueries();

  return useMutation({
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

  return {
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
  };
}
