import { Clock3, LogIn, LogOut, Truck } from "lucide-react";
import { useMemo, useState } from "react";

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
    <Card title={title}>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <EmptyState title="Sin vehículos" description="No hay registros para este rango de fechas." />
        ) : (
          rows.map((row) => {
            const isActionAvailable = getAvailableActions(row.Status, ["PORTERIA", "ADMIN"]).some(
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
                      <p><span className="font-medium">Cliente:</span> {row.ClientName || "-"}</p>
                      <p><span className="font-medium">Placa:</span> {row.VehiclePlate || "-"}</p>
                      <p><span className="font-medium">Programada:</span> {formatDateTime(row.ScheduledAt)}</p>
                      <p><span className="font-medium">Muelle:</span> {row.DockName || "Pendiente"}</p>
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
                      ? "Esperando finalización"
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
  const scheduledRows = rows.filter((row) => row.Status === "AGENDADA" && !row.ArrivalAt);
  const inYardRows = rows.filter(
    (row) => row.ArrivalAt && !row.CheckoutAt && row.Status !== "ATENDIDA" && row.Status !== "OPERACION_CANCELADA",
  );

  const pendingMap = {
    checkin: actions.checkin.isPending,
    checkout: actions.checkout.isPending,
  };

  const handleActionOpen = (actionKey, appointment) => {
    setActionError("");
    setSelectedAppointment(appointment);
    setActiveAction(actionKey);
  };

  const handleActionClose = () => {
    setActionError("");
    setSelectedAppointment(null);
    setActiveAction(null);
  };

  const handleActionSubmit = async (payload) => {
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
  };

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
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 md:grid-cols-3">
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
        <Card title="Rango activo">
          <div className="text-sm text-neutral-600">
            La portería usa el mismo filtro global del Topbar para cambiar de día o revisar ventanas anteriores.
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PorteriaList title="Agendados sin check-in" rows={scheduledRows} actionKey="checkin" onAction={handleActionOpen} />
        <PorteriaList title="Vehículos aún en patio" rows={inYardRows} actionKey="checkout" onAction={handleActionOpen} />
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
