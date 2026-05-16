import { Clock3, Truck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AppointmentActionModal } from "../components/domain/AppointmentActionModal";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Loader } from "../components/ui/Loader";
import { getErrorMessage } from "../domain/appointmentsConfig";
import { useAppointmentActions, useAppointments } from "../hooks/useAppointments";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import type { AppointmentMutationPayload } from "../domain/types/appointments";
import type { AppointmentActionType } from "../components/domain/appointmentActionModal/formUtils";
import { PorteriaList } from "./porteria/PorteriaList";
import type { PorteriaActionKey, PorteriaAppointment } from "./porteria/types";

export function PorteriaPage() {
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);
  const appointmentsQuery = useAppointments({ skip: 0, take: 100, ...dateRangeParams });
  const { actions, pending } = useAppointmentActions();
  const [activeAction, setActiveAction] = useState<PorteriaActionKey | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<PorteriaAppointment | null>(null);
  const [actionError, setActionError] = useState("");

  const rows = (appointmentsQuery.data?.items || []) as PorteriaAppointment[];
  const scheduledRows = useMemo(
    () => rows.filter((row) => row.Status === "AGENDADA" && !row.ArrivalAt),
    [rows],
  );
  const inYardRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.ArrivalAt &&
          !row.CheckoutAt &&
          row.Status !== "ATENDIDA" &&
          row.Status !== "OPERACION_CANCELADA",
      ),
    [rows],
  );

  const pendingMap = useMemo(
    () => ({
      checkin: pending.checkin,
      checkout: pending.checkout,
    }),
    [pending.checkin, pending.checkout],
  );

  const handleActionOpen = useCallback((actionKey: PorteriaActionKey, appointment: PorteriaAppointment) => {
    setActionError("");
    setSelectedAppointment(appointment);
    setActiveAction(actionKey);
  }, []);

  const handleActionClose = useCallback(() => {
    setActionError("");
    setSelectedAppointment(null);
    setActiveAction(null);
  }, []);

  const handleActionSubmit = useCallback(async (payload: AppointmentMutationPayload) => {
    if (!selectedAppointment || !activeAction) {
      return;
    }

    const version = selectedAppointment.Version || selectedAppointment.version;

    try {
      if (activeAction === "checkin") {
        await actions.checkin({
          appointmentId: selectedAppointment.Id,
          payload: { ...payload, version },
        });
      }

      if (activeAction === "checkout") {
        await actions.checkout({
          appointmentId: selectedAppointment.Id,
          payload: { ...payload, version },
        });
      }

      handleActionClose();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }, [actions.checkin, actions.checkout, activeAction, handleActionClose, selectedAppointment]);

  if (appointmentsQuery.isLoading && !appointmentsQuery.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader />
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return <ErrorState message="No se pudo cargar la vista de portería" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-2 sm:px-3 lg:px-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Pendientes de ingreso">
          <div className="flex items-center justify-between">
            <Truck className="h-7 w-7 text-neutral-500" strokeWidth={1.75} />
            <p className="text-2xl font-bold text-neutral-800">{scheduledRows.length}</p>
          </div>
        </Card>
        <Card title="Vehículos en patio">
          <div className="flex items-center justify-between">
            <Clock3 className="h-7 w-7 text-neutral-500" strokeWidth={1.75} />
            <p className="text-2xl font-bold text-neutral-800">{inYardRows.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 xl:grid-cols-2 xl:grid-rows-1">
        <PorteriaList title="Citas agendadas" rows={scheduledRows} actionKey="checkin" onAction={handleActionOpen} />
        <PorteriaList title="Vehículos en patio" rows={inYardRows} actionKey="checkout" onAction={handleActionOpen} />
      </div>

      <AppointmentActionModal
        action={activeAction as AppointmentActionType | null}
        appointment={selectedAppointment}
        open={Boolean(activeAction)}
        onClose={handleActionClose}
        onSubmit={handleActionSubmit}
        isPending={activeAction ? pendingMap[activeAction as keyof typeof pendingMap] : false}
        errorMessage={actionError}
        candidates={undefined}
        candidatesLoading={false}
      />
    </div>
  );
}
