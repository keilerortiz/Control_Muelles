import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appointmentsService } from "../services/appointmentsService";

export function useAppointments(params) {
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: () => appointmentsService.list(params),
  });
}

export function useAppointmentActions() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
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
