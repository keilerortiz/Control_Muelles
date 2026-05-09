import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appointmentsService } from "../services/appointmentsService";

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

export function useAppointmentActions() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["appointment-detail"] });
    await queryClient.invalidateQueries({ queryKey: ["appointment-status-log"] });
    await queryClient.invalidateQueries({ queryKey: ["appointment-candidates"] });
  };

  const makeMutation = (mutationFn) =>
    useMutation({
      mutationFn,
      onSuccess: invalidate,
    });

  return {
    create: makeMutation(appointmentsService.create),
    update: makeMutation(({ appointmentId, payload }) => appointmentsService.update(appointmentId, payload)),
    remove: makeMutation(appointmentsService.remove),
    checkin: makeMutation(({ appointmentId, payload }) => appointmentsService.checkin(appointmentId, payload)),
    assign: makeMutation(({ appointmentId, payload }) => appointmentsService.assign(appointmentId, payload)),
    reassign: makeMutation(({ appointmentId, payload }) => appointmentsService.reassign(appointmentId, payload)),
    startProcess: makeMutation(({ appointmentId, payload }) => appointmentsService.startProcess(appointmentId, payload)),
    toSign: makeMutation(({ appointmentId, payload }) => appointmentsService.toSign(appointmentId, payload)),
    finalize: makeMutation(({ appointmentId, payload }) => appointmentsService.finalize(appointmentId, payload)),
    checkout: makeMutation(({ appointmentId, payload }) => appointmentsService.checkout(appointmentId, payload)),
    cancel: makeMutation(({ appointmentId, payload }) => appointmentsService.cancel(appointmentId, payload)),
  };
}
