// src/pages/AppointmentsPage.jsx
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";

import { AppointmentsTable } from "../components/domain/AppointmentsTable";
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
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Loader } from "../components/ui/Loader";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import type { RoleCode } from "../domain/types/auth";
import { useIsMinWidth } from "../hooks/useIsMinWidth";
import {
  actionIconByKey,
  candidateActions,
  createAllowedRoles,
  PAGE_SIZE,
} from "./appointments/constants";
import { buildUniqueSortedOptions, filterAppointmentsByCatalog } from "./appointments/helpers";
import { AppointmentFiltersBar } from "./appointments/AppointmentFiltersBar";
import { PlannerKpiGrid } from "./appointments/PlannerKpiGrid";
import { useAppointmentActionHandler } from "./appointments/useAppointmentActionHandler";
import type { AppointmentActionKey, AppointmentRow, AppointmentsPageProps } from "./appointments/types";
const AppointmentActionModal = lazy(() =>
  import("../components/domain/AppointmentActionModal").then((module) => ({
    default: module.AppointmentActionModal,
  })),
);
const AppointmentDetailPanel = lazy(() =>
  import("../components/domain/AppointmentDetailPanel").then((module) => ({
    default: module.AppointmentDetailPanel,
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<AppointmentActionKey | null>(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);
  const isDesktop = useIsMinWidth(1024);

  const roles = useAuthStore((state) => state.user?.roles || []) as RoleCode[];
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateRangeParams.date_from, dateRangeParams.date_to]);

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

  const actions = useAppointmentActions();
  const summaryQuery = useDashboard(dateRangeParams);

  useEffect(() => {
    const currentRows = appointmentsQuery.data?.items || [];
    const currentFilteredRows = filterAppointmentsByCatalog(currentRows, clientFilter, operationFilter);

    if (selectedAppointmentId && !currentFilteredRows.some((row) => row.Id === selectedAppointmentId)) {
      setSelectedAppointmentId(null);
    }
  }, [appointmentsQuery.data?.items, clientFilter, operationFilter, selectedAppointmentId]);

  const selectedAppointment = detailQuery.data
    || (appointmentsQuery.data?.items || []).find((row) => row.Id === selectedAppointmentId)
    || null;

  const canCreate = !readOnly && createAllowedRoles.some((role) => roles.includes(role));

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
    [
      actions.create.isPending,
      actions.update.isPending,
      actions.remove.isPending,
      actions.checkin.isPending,
      actions.assign.isPending,
      actions.reassign.isPending,
      actions.startProcess.isPending,
      actions.toSign.isPending,
      actions.finalize.isPending,
      actions.checkout.isPending,
      actions.cancel.isPending,
    ],
  );

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
        onSearchSubmit={() => setDebouncedSearch(search)}
        onStatusChange={setStatus}
        onClientFilterChange={setClientFilter}
        onOperationFilterChange={setOperationFilter}
        onResetFilters={() => {
          setSearch("");
          setDebouncedSearch("");
          setStatus("");
          setClientFilter("");
          setOperationFilter("");
          setPage(1);
        }}
        onCreate={() => openAction("create")}
      />

      {filteredRows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : !isDesktop ? (
          <div className="flex flex-col gap-4">
            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <AppointmentsTable
                  rows={filteredRows}
                  selectedAppointmentId={selectedAppointmentId}
                  onSelect={selectAppointment}
                  getRowActions={readOnly ? undefined : getRowActions}
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={totalRows}
                  onPageChange={setPage}
                />
              </div>

              {detailQuery.isLoading && selectedAppointmentId ? (
                <Card title="Detalle de cita">
                  <div className="flex items-center justify-center py-8">
                    <Loader />
                  </div>
                </Card>
              ) : (
                <div className="max-h-[38vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando detalle...</div>}>
                    <AppointmentDetailPanel
                      appointment={selectedAppointment}
                      onAction={() => {}}
                      showActions={false}
                      showHistory={false}
                    />
                  </Suspense>
                </div>
              )}
            </div>

            <div className="min-w-0">
              {detailQuery.isLoading && selectedAppointmentId ? (
                <Card title="Historial de estados">
                  <div className="flex items-center justify-center py-8">
                    <Loader />
                  </div>
                </Card>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                  <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando historial...</div>}>
                    <AppointmentDetailPanel
                      appointment={selectedAppointment}
                      statusLog={statusLogQuery.data || []}
                      roles={roles}
                      onAction={(key) => openAction(key as AppointmentActionKey)}
                      showDetail={false}
                      showActions={false}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
      ) : (
          <div className="min-h-0 flex-1 grid grid-cols-[minmax(0,1.95fr)_minmax(280px,0.62fr)] grid-rows-[minmax(0,1fr)_auto] gap-2">
            <div className="contents">
              <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-1 row-start-1">
                <AppointmentsTable
                  rows={filteredRows}
                  selectedAppointmentId={selectedAppointmentId}
                  onSelect={selectAppointment}
                  getRowActions={readOnly ? undefined : getRowActions}
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={totalRows}
                  onPageChange={setPage}
                  maxVisibleRows={8}
                  fullHeight
                />
              </div>

              <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-2 row-start-1 row-span-2">
                <div className="h-full overflow-y-auto">
                  {detailQuery.isLoading && selectedAppointmentId ? (
                    <Card title="Detalle de cita" className="h-full">
                      <div className="flex items-center justify-center py-8">
                        <Loader />
                      </div>
                    </Card>
                  ) : (
                <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando detalle...</div>}>
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    roles={roles}
                    onAction={(key) => openAction(key as AppointmentActionKey)}
                    showActions={false}
                    showHistory={false}
                    historyFullHeight
                    detailFullHeight
                  />
                </Suspense>
              )}
                </div>
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-1 row-start-2">
              {detailQuery.isLoading && selectedAppointmentId ? (
                <Card>
                  <div className="flex items-center justify-center py-4">
                    <Loader />
                  </div>
                </Card>
              ) : (
                <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando historial...</div>}>
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    statusLog={statusLogQuery.data || []}
                    roles={roles}
                    onAction={(key) => openAction(key as AppointmentActionKey)}
                    showDetail={false}
                    showActions={false}
                    historyVariant="horizontal-compact"
                    historyHideTitle
                  />
                </Suspense>
              )}
            </div>
          </div>
      )}

      <Suspense fallback={null}>
        <AppointmentActionModal
          action={activeAction}
          appointment={activeAction === "create" ? null : selectedAppointment}
          open={Boolean(activeAction)}
          onClose={closeAction}
          onSubmit={handleActionSubmit}
          isPending={activeAction ? pendingMap[activeAction as keyof typeof pendingMap] : false}
          errorMessage={actionError}
          candidates={candidatesQuery.data}
          candidatesLoading={candidatesQuery.isLoading}
        />
      </Suspense>
    </div>
  );
}
