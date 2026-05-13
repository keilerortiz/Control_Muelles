import { useCallback } from "react";

import { getErrorMessage } from "../../domain/appointmentsConfig";
import type { AppointmentMutationPayload } from "../../domain/types/appointments";
import type { AppointmentActionType } from "../../components/domain/appointmentActionModal/formUtils";
import type { useAppointmentActions, useAppointmentCandidates } from "../../hooks/useAppointments";

type AppointmentActions = ReturnType<typeof useAppointmentActions>;
type CandidatesQuery = ReturnType<typeof useAppointmentCandidates>;

interface ActionHandlerArgs {
  activeAction: AppointmentActionType | null;
  selectedAppointmentId: number | null;
  actions: AppointmentActions;
  candidatesQuery: CandidatesQuery;
  closeAction: () => void;
  setSelectedAppointmentId: (id: number | null) => void;
  setActionError: (value: string) => void;
}

function isCandidatesExpiredError(error: unknown) {
  const typedError = error as {
    response?: { status?: number; data?: { errorCode?: string; message?: string } };
  };
  return (
    typedError?.response?.status === 409 &&
    (typedError?.response?.data?.errorCode === "CANDIDATES_EXPIRED" ||
      typedError?.response?.data?.message === "Candidatos expirados")
  );
}

export function useAppointmentActionHandler({
  activeAction,
  selectedAppointmentId,
  actions,
  candidatesQuery,
  closeAction,
  setSelectedAppointmentId,
  setActionError,
}: ActionHandlerArgs) {
  return useCallback(async (payload: AppointmentMutationPayload) => {
    const requireSelectedAppointmentId = () => {
      if (!selectedAppointmentId) throw new Error("No hay cita seleccionada para esta acción.");
      return selectedAppointmentId;
    };

    const retryWithFreshCandidates = async (
      mutationFn: (args: { appointmentId: number; payload: AppointmentMutationPayload }) => Promise<unknown>,
    ) => {
      const refreshed = await candidatesQuery.refetch();
      const freshVersion = refreshed?.data?.version;
      if (!freshVersion) throw new Error("No fue posible refrescar candidatos.");
      await mutationFn({
        appointmentId: requireSelectedAppointmentId(),
        payload: { ...payload, candidatesVersion: freshVersion },
      });
    };

    try {
      if (activeAction === "create") {
        const created = await actions.create.mutateAsync(payload);
        setSelectedAppointmentId(created.Id);
      } else if (activeAction === "edit") {
        const updated = await actions.update.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
        setSelectedAppointmentId(updated.Id);
      } else if (activeAction === "remove") {
        await actions.remove.mutateAsync(requireSelectedAppointmentId());
        setSelectedAppointmentId(null);
      } else if (activeAction === "checkin") {
        await actions.checkin.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      } else if (activeAction === "assign") {
        try {
          await actions.assign.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) throw error;
          await retryWithFreshCandidates(actions.assign.mutateAsync);
        }
      } else if (activeAction === "reassign") {
        try {
          await actions.reassign.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) throw error;
          await retryWithFreshCandidates(actions.reassign.mutateAsync);
        }
      } else if (activeAction === "startProcess") {
        await actions.startProcess.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      } else if (activeAction === "toSign") {
        await actions.toSign.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      } else if (activeAction === "finalize") {
        await actions.finalize.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      } else if (activeAction === "checkout") {
        await actions.checkout.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      } else if (activeAction === "cancel") {
        await actions.cancel.mutateAsync({ appointmentId: requireSelectedAppointmentId(), payload });
      }
      closeAction();
    } catch (error) {
      if (isCandidatesExpiredError(error) && (activeAction === "assign" || activeAction === "reassign")) {
        setActionError("Los candidatos expiraron. Se recargó la disponibilidad, verifica y confirma nuevamente.");
        return;
      }
      setActionError(getErrorMessage(error));
    }
  }, [activeAction, actions, candidatesQuery, closeAction, selectedAppointmentId, setActionError, setSelectedAppointmentId]);
}
