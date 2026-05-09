import { useEffect, useMemo, useState } from "react";

import { AppointmentActionModal } from "../components/domain/AppointmentActionModal";
import { AppointmentDetailPanel } from "../components/domain/AppointmentDetailPanel";
import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import {
  actionLabels,
  appointmentStatuses,
  getErrorMessage,
} from "../domain/appointmentsConfig";
import {
  useAppointmentCandidates,
  useAppointmentDetail,
  useAppointmentStatusLog,
  useAppointmentActions,
  useAppointments,
} from "../hooks/useAppointments";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";

const createAllowedRoles = ["PLANEADOR", "ADMIN"];
const candidateActions = new Set(["assign", "reassign"]);

export function AppointmentsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionError, setActionError] = useState("");

  const roles = useAuthStore((state) => state.user?.roles || []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(timer);
  }, [search]);

  const appointmentsQuery = useAppointments({
    skip: 0,
    take: 50,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });
  const detailQuery = useAppointmentDetail(selectedAppointmentId);
  const statusLogQuery = useAppointmentStatusLog(selectedAppointmentId);
  const candidatesQuery = useAppointmentCandidates(
    selectedAppointmentId,
    Boolean(selectedAppointmentId && activeAction && candidateActions.has(activeAction)),
  );
  const actions = useAppointmentActions();

  useEffect(() => {
    const firstAppointmentId = appointmentsQuery.data?.items?.[0]?.Id;
    if (!selectedAppointmentId && firstAppointmentId) {
      setSelectedAppointmentId(firstAppointmentId);
    }
  }, [appointmentsQuery.data?.items, selectedAppointmentId]);

  const selectedAppointment = detailQuery.data || appointmentsQuery.data?.items?.find((row) => row.Id === selectedAppointmentId) || null;
  const canCreate = createAllowedRoles.some((role) => roles.includes(role));

  const pendingMap = useMemo(
    () => ({
      create: actions.create.isPending,
      edit: actions.update.isPending,
      remove: actions.remove.isPending,
      checkin: actions.checkin.isPending,
      assign: actions.assign.isPending,
      reassign: actions.reassign.isPending,
      startProcess: actions.startProcess.isPending,
      toSign: actions.toSign.isPending,
      finalize: actions.finalize.isPending,
      checkout: actions.checkout.isPending,
      cancel: actions.cancel.isPending,
    }),
    [actions],
  );

  const openAction = (actionKey) => {
    setActionError("");
    setActiveAction(actionKey);
  };

  const closeAction = () => {
    setActionError("");
    setActiveAction(null);
  };

  const handleActionSubmit = async (payload) => {
    try {
      if (activeAction === "create") {
        const created = await actions.create.mutateAsync(payload);
        setSelectedAppointmentId(created.Id);
      } else if (activeAction === "edit") {
        const updated = await actions.update.mutateAsync({ appointmentId: selectedAppointmentId, payload });
        setSelectedAppointmentId(updated.Id);
      } else if (activeAction === "remove") {
        await actions.remove.mutateAsync(selectedAppointmentId);
        setSelectedAppointmentId(null);
      } else if (activeAction === "checkin") {
        await actions.checkin.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "assign") {
        await actions.assign.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "reassign") {
        await actions.reassign.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "startProcess") {
        await actions.startProcess.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "toSign") {
        await actions.toSign.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "finalize") {
        await actions.finalize.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "checkout") {
        await actions.checkout.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "cancel") {
        await actions.cancel.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      }

      closeAction();
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
    return <ErrorState message="No se pudo cargar el módulo de citas" onRetry={() => window.location.reload()} />;
  }

  const rows = appointmentsQuery.data?.items || [];

  return (
    <div className="space-y-4">
      <Card
        title="Citas operativas"
        actions={
          canCreate ? (
            <Button onClick={() => openAction("create")}>{actionLabels.create}</Button>
          ) : null
        }
      >
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <Input
            label="Buscar por cliente o placa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
          />
          <Select label="Estado" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {appointmentStatuses.map((statusItem) => (
              <option key={statusItem} value={statusItem}>
                {statusItem}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Sin citas" description="No hay resultados para el filtro actual." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <AppointmentsTable
              rows={rows}
              selectedAppointmentId={selectedAppointmentId}
              onSelect={(appointment) => setSelectedAppointmentId(appointment.Id)}
            />
          </div>

          <div className="space-y-4">
            {detailQuery.isLoading && selectedAppointmentId ? (
              <Card title="Detalle de cita">
                <div className="flex items-center justify-center py-8">
                  <Loader />
                </div>
              </Card>
            ) : (
              <AppointmentDetailPanel
                appointment={selectedAppointment}
                statusLog={statusLogQuery.data || []}
                roles={roles}
                onAction={openAction}
              />
            )}
          </div>
        </div>
      )}

      <AppointmentActionModal
        action={activeAction}
        appointment={selectedAppointment}
        open={Boolean(activeAction)}
        onClose={closeAction}
        onSubmit={handleActionSubmit}
        isPending={activeAction ? pendingMap[activeAction] : false}
        errorMessage={actionError}
        candidates={candidatesQuery.data}
        candidatesLoading={candidatesQuery.isLoading}
      />
    </div>
  );
}
