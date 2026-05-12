import { Clock3, LogIn, LogOut, Truck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AppointmentActionModal } from "../components/domain/AppointmentActionModal";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Button } from "../components/ui/Button";
import { Loader } from "../components/ui/Loader";
import { Badge } from "../components/ui/Badge";
import { actionLabels, formatDateTime, getAvailableActions, getErrorMessage } from "../domain/appointmentsConfig";
import { useAppointmentActions, useAppointments } from "../hooks/useAppointments";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

function PorteriaList({ title, rows, actionKey, onAction }) {
  return (
    <Card title={title} className="flex h-full min-h-0 flex-col" contentClassName="flex-1 min-h-0">
      <div className="h-full space-y-3 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <EmptyState title="Sin vehículos"/>
        ) : (
          rows.map((row) => {
            const isActionAvailable = getAvailableActions(row.Status, ["PORTERIA"]).some(
              (action) => action.key === actionKey,
            );

            return (
              <div key={row.Id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-800">#{row.Id}</p>
                      <Badge status={row.Status} />
                    </div>
                    <div className="grid gap-1 text-sm text-neutral-600">
                      <p><span className="font-bold">Hora de cita:</span> {formatDateTime(row.ScheduledAt)}</p>
                      <p><span className="font-medium">Cliente:</span> {row.ClientName || "-"}</p>
                      <p><span className="font-medium">Nombre conductor:</span> {row.DriverName || "-"}</p>
                      <p><span className="font-medium">Cédula conductor:</span> {row.DriverDocument || "-"}</p>
                      <p><span className="font-medium">Placa:</span> {row.VehiclePlate || "-"}</p>
                      <p><span className="font-medium">Observaciones:</span> {row.NonComplianceComment || row.Observations || "-"}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={actionKey === "checkout" ? "danger" : "primary"}
                    leftIcon={actionKey === "checkin" ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                    disabled={!isActionAvailable}
                    onClick={() => onAction(actionKey, row)}
                  >
                    {isActionAvailable
                      ? actionLabels[actionKey]
                      : actionKey === "checkout"
                      ? "Salida no disponible"
                      : "No disponible"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export function PorteriaPage() {
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);
  const appointmentsQuery = useAppointments({ skip: 0, take: 100, ...dateRangeParams });
  const actions = useAppointmentActions();
  const [activeAction, setActiveAction] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionError, setActionError] = useState("");

  const rows = appointmentsQuery.data?.items || [];
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
      checkin: actions.checkin.isPending,
      checkout: actions.checkout.isPending,
    }),
    [actions.checkin.isPending, actions.checkout.isPending],
  );

  const handleActionOpen = useCallback((actionKey, appointment) => {
    setActionError("");
    setSelectedAppointment(appointment);
    setActiveAction(actionKey);
  }, []);

  const handleActionClose = useCallback(() => {
    setActionError("");
    setSelectedAppointment(null);
    setActiveAction(null);
  }, []);

  const handleActionSubmit = useCallback(async (payload) => {
    if (!selectedAppointment || !activeAction) {
      return;
    }

    try {
      if (activeAction === "checkin") {
        await actions.checkin.mutateAsync({ appointmentId: selectedAppointment.Id, payload });
      }

      if (activeAction === "checkout") {
        await actions.checkout.mutateAsync({ appointmentId: selectedAppointment.Id, payload });
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
        action={activeAction}
        appointment={selectedAppointment}
        open={Boolean(activeAction)}
        onClose={handleActionClose}
        onSubmit={handleActionSubmit}
        isPending={activeAction ? pendingMap[activeAction] : false}
        errorMessage={actionError}
        candidates={null}
        candidatesLoading={false}
      />
    </div>
  );
}
