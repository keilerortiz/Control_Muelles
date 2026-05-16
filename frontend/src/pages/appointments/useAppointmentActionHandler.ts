import { useCallback } from "react";

import { getErrorMessage } from "../../domain/appointmentsConfig";
import type { AppointmentMutationPayload } from "../../domain/types/appointments";
import type { AppointmentActionType } from "../../components/domain/appointmentActionModal/formUtils";
import type { useAppointmentActions, useAppointmentCandidates } from "../../hooks/useAppointments";

type AppointmentActions = ReturnType<typeof useAppointmentActions>["actions"];
type CandidatesQuery = ReturnType<typeof useAppointmentCandidates>;

interface ActionHandlerArgs {
  activeAction: AppointmentActionType | null;
  selectedAppointmentId: number | null;
  selectedAppointment: any | null;
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
  selectedAppointment,
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

    const getVersion = () => {
      return selectedAppointment?.Version || selectedAppointment?.version;
    };

    const retryWithFreshCandidates = async (
      mutationFn: (args: { appointmentId: number; payload: AppointmentMutationPayload }) => Promise<unknown>,
    ) => {
      const refreshed = await candidatesQuery.refetch();
      const freshVersion = refreshed?.data?.version;
      if (!freshVersion) throw new Error("No fue posible refrescar candidatos.");
      await mutationFn({
        appointmentId: requireSelectedAppointmentId(),
        payload: { ...payload, candidatesVersion: freshVersion, version: getVersion() },
      });
    };

    try {
      if (activeAction === "create") {
        const created = await actions.create(payload);
        setSelectedAppointmentId(created.Id);
      } else if (activeAction === "edit") {
        const updated = await actions.update({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
        setSelectedAppointmentId(updated.Id);
      } else if (activeAction === "remove") {
        await actions.remove({
          appointmentId: requireSelectedAppointmentId(),
          version: getVersion(),
        });
        setSelectedAppointmentId(null);
      } else if (activeAction === "checkin") {
        await actions.checkin({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
      } else if (activeAction === "assign") {
        try {
          await actions.assign({
            appointmentId: requireSelectedAppointmentId(),
            payload: { ...payload, version: getVersion() },
          });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) throw error;
          await retryWithFreshCandidates(actions.assign);
        }
      } else if (activeAction === "reassign") {
        try {
          await actions.reassign({
            appointmentId: requireSelectedAppointmentId(),
            payload: { ...payload, version: getVersion() },
          });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) throw error;
          await retryWithFreshCandidates(actions.reassign);
        }
      } else if (activeAction === "startProcess") {
        await actions.startProcess({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
      } else if (activeAction === "toSign") {
        await actions.toSign({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
      } else if (activeAction === "finalize") {
        await actions.finalize({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
      } else if (activeAction === "checkout") {
        await actions.checkout({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
      } else if (activeAction === "cancel") {
        await actions.cancel({
          appointmentId: requireSelectedAppointmentId(),
          payload: { ...payload, version: getVersion() },
        });
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
