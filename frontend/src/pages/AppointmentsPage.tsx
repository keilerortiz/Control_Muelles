// src/pages/AppointmentsPage.jsx
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";

import {
  actionLabels,
  getAvailableActions,
  getQueryErrorMessage,
} from "../domain/appointmentsConfig";
import {
  useAppointmentCandidates,
  useAppointmentDetail,
  useAppointmentStatusLog,
  useAppointmentActions,
  useAppointments,
} from "../hooks/useAppointments";
import { useDashboard } from "../hooks/useDashboard";
import { useRealtime } from "../hooks/useRealtime";
import { useDebounce } from "../hooks/useDebounce";
import { useAuthStore } from "../store/authStore";
import { ErrorState } from "../components/ui/ErrorState";
import { Loader } from "../components/ui/Loader";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import type { RoleCode } from "../domain/types/auth";
import {
  actionIconByKey,
  candidateActions,
  createAllowedRoles,
  PAGE_SIZE,
} from "./appointments/constants";
import { buildUniqueSortedOptions, filterAppointmentsByCatalog } from "./appointments/helpers";
import { AppointmentsContent } from "./appointments/AppointmentsContent";
import { AppointmentFiltersBar } from "./appointments/AppointmentFiltersBar";
import { PlannerKpiGrid } from "./appointments/PlannerKpiGrid";
import { useAppointmentActionHandler } from "./appointments/useAppointmentActionHandler";
import type { AppointmentActionKey, AppointmentRow, AppointmentsPageProps } from "./appointments/types";
const AppointmentActionModal = lazy(() =>
  import("../components/domain/AppointmentActionModal").then((module) => ({
    default: module.AppointmentActionModal,
  })),
);
export function AppointmentsPage({
  title = "Citas operativas",
  headerContent = null,
  emptyTitle = "Sin citas",
  emptyDescription = "No hay resultados para el filtro actual.",
  readOnly = false,
}: AppointmentsPageProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<AppointmentActionKey | null>(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);

  const roles = useAuthStore((state) => state.user?.roles || []) as RoleCode[];
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);

  const appointmentsQuery = useAppointments({
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status || undefined,
    ...dateRangeParams,
  });

  const detailQuery = useAppointmentDetail(selectedAppointmentId);
  const statusLogQuery = useAppointmentStatusLog(selectedAppointmentId);

  const candidatesQuery = useAppointmentCandidates(
    selectedAppointmentId,
    Boolean(selectedAppointmentId && activeAction && candidateActions.has(activeAction)),
  );

  const { actions, pending } = useAppointmentActions();
  const { syncState } = useRealtime();
  const summaryQuery = useDashboard(dateRangeParams, {
    realtimeConnected: syncState === "CONNECTED",
  });

  useEffect(() => {
    const currentRows = appointmentsQuery.data?.items || [];
    const currentFilteredRows = filterAppointmentsByCatalog(currentRows, clientFilter, operationFilter);

    if (selectedAppointmentId && !currentFilteredRows.some((row) => row.Id === selectedAppointmentId)) {
      setSelectedAppointmentId(null);
    }
  }, [appointmentsQuery.data?.items, clientFilter, operationFilter, selectedAppointmentId]);

  const selectedAppointment = (detailQuery.data
    || (appointmentsQuery.data?.items || []).find((row) => row.Id === selectedAppointmentId)
    || null) as NonNullable<typeof detailQuery.data> | null;

  const canCreate = !readOnly && createAllowedRoles.some((role) => roles.includes(role));

  const openAction = useCallback((actionKey: AppointmentActionKey) => {
    setActionError("");
    setActiveAction(actionKey);
  }, []);

  const closeAction = useCallback(() => {
    setActionError("");
    setActiveAction(null);
  }, []);

  const selectAppointment = useCallback((appointment: AppointmentRow) => {
    if (typeof appointment.Id === "number") {
      setSelectedAppointmentId(appointment.Id);
    }
  }, []);

  const handleActionSubmit = useAppointmentActionHandler({
    activeAction,
    selectedAppointmentId,
    selectedAppointment,
    actions,
    candidatesQuery,
    closeAction,
    setSelectedAppointmentId,
    setActionError,
  });

  const rows = (appointmentsQuery.data?.items || []) as AppointmentRow[];

  const filteredRows = useMemo(
    () => filterAppointmentsByCatalog(rows, clientFilter, operationFilter),
    [rows, clientFilter, operationFilter],
  );

  const totalRows = Number(appointmentsQuery.data?.total || 0);
  const safePage = Math.min(page, Math.max(1, Math.ceil(totalRows / PAGE_SIZE)));

  const clientOptions = useMemo(() => buildUniqueSortedOptions(rows, (row) => row.ClientName), [rows]);
  const operationOptions = useMemo(
    () => buildUniqueSortedOptions(rows, (row) => row.OperationTypeName || row.OperationType),
    [rows],
  );

  const getRowActions = useCallback(
    (row: AppointmentRow) =>
      getAvailableActions(row.Status ?? "AGENDADA", roles).map((action) => ({
        key: action.key,
        label: actionLabels[action.key] || action.key,
        icon: actionIconByKey[action.key as keyof typeof actionIconByKey],
        onClick: (targetRow: AppointmentRow) => {
          selectAppointment(targetRow);
          openAction(action.key as AppointmentActionKey);
        },
      })),
    [actionIconByKey, openAction, roles, selectAppointment],
  );

  if (appointmentsQuery.isLoading && !appointmentsQuery.data) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader />
      </div>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <ErrorState
        message={getQueryErrorMessage(appointmentsQuery.error, "No se pudo cargar el módulo de citas")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-1 sm:px-2 lg:overflow-hidden">
      {headerContent}

      <PlannerKpiGrid values={summaryQuery.data as Record<string, unknown> | undefined} />
      <AppointmentFiltersBar
        search={search}
        status={status}
        clientFilter={clientFilter}
        operationFilter={operationFilter}
        canCreate={canCreate}
        clientOptions={clientOptions}
        operationOptions={operationOptions}
        onSearchChange={setSearch}
        onStatusChange={(val) => { setStatus(val); setPage(1); }}
        onClientFilterChange={(val) => { setClientFilter(val); setPage(1); }}
        onOperationFilterChange={(val) => { setOperationFilter(val); setPage(1); }}
        onResetFilters={() => {
          setSearch("");
          setStatus("");
          setClientFilter("");
          setOperationFilter("");
          setPage(1);
        }}
        onCreate={() => openAction("create")}
      />

      <AppointmentsContent
        rows={filteredRows}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        selectedAppointmentId={selectedAppointmentId}
        selectedAppointment={selectedAppointment}
        detailLoading={detailQuery.isLoading}
        statusLog={statusLogQuery.data || []}
        roles={roles}
        readOnly={readOnly}
        getRowActions={getRowActions}
        onSelect={selectAppointment}
        onOpenAction={openAction}
        page={safePage}
        total={totalRows}
        onPageChange={setPage}
      />

      <Suspense fallback={null}>
        <AppointmentActionModal
          action={activeAction}
          appointment={activeAction === "create" ? null : selectedAppointment}
          open={Boolean(activeAction)}
          onClose={closeAction}
          onSubmit={handleActionSubmit}
          isPending={activeAction ? pending[activeAction as keyof typeof pending] : false}
          errorMessage={actionError}
          candidates={candidatesQuery.data}
          candidatesLoading={candidatesQuery.isLoading}
        />
      </Suspense>
    </div>
  );
}
