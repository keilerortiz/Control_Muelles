// src/pages/AppointmentsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSignature,
  FilterX,
  LogIn,
  LogOut,
  Pencil,
  Play,
  RefreshCw,
  Timer,
  Trash2,
  Wrench,
} from "lucide-react";

import { AppointmentActionModal } from "../components/domain/AppointmentActionModal";
import { AppointmentDetailPanel } from "../components/domain/AppointmentDetailPanel";
import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import {
  actionLabels,
  appointmentStatuses,
  getAvailableActions,
  getErrorMessage,
  statusLabels,
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
import { Input } from "../components/ui/Input";
import { Loader } from "../components/ui/Loader";
import { Select } from "../components/ui/Select";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

const createAllowedRoles = ["PLANEADOR"];
const candidateActions = new Set(["assign", "reassign"]);
const PAGE_SIZE = 10;

const plannerKpiTemplate = [
  {
    key: "agendada",
    label: "Agendadas",
    tone: "border-sky-200/80 bg-sky-50/80 text-sky-700",
    iconBox: "border-sky-200 bg-sky-100/70 text-sky-700",
    icon: CalendarDays,
  },
  {
    key: "en_patio",
    label: "En patio",
    tone: "border-amber-200/80 bg-amber-50/80 text-amber-700",
    iconBox: "border-amber-200 bg-amber-100/70 text-amber-700",
    icon: Timer,
  },
  {
    key: "entrega_documentos",
    label: "Documentos",
    tone: "border-indigo-200/80 bg-indigo-50/80 text-indigo-700",
    iconBox: "border-indigo-200 bg-indigo-100/70 text-indigo-700",
    icon: ClipboardCheck,
  },
  {
    key: "en_proceso",
    label: "En proceso",
    tone: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700",
    iconBox: "border-emerald-200 bg-emerald-100/70 text-emerald-700",
    icon: Play,
  },
  {
    key: "para_firmar",
    label: "Para firmar",
    tone: "border-violet-200/80 bg-violet-50/80 text-violet-700",
    iconBox: "border-violet-200 bg-violet-100/70 text-violet-700",
    icon: FileSignature,
  },
  {
    key: "retrasada",
    label: "Alertas",
    tone: "border-rose-200/80 bg-rose-50/80 text-rose-700",
    iconBox: "border-rose-200 bg-rose-100/70 text-rose-700",
    icon: AlertTriangle,
  },
];

export function AppointmentsPage({
  title = "Citas operativas",
  headerContent = null,
  emptyTitle = "Sin citas",
  emptyDescription = "No hay resultados para el filtro actual.",
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);

  const roles = useAuthStore((state) => state.user?.roles || []);
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

  const plannerKpis = useMemo(
    () =>
      plannerKpiTemplate.map((kpi) => ({
        ...kpi,
        value: Number(summaryQuery.data?.[kpi.key] ?? 0),
      })),
    [summaryQuery.data],
  );

  useEffect(() => {
    const firstAppointmentId = appointmentsQuery.data?.items?.[0]?.Id;
    if (!selectedAppointmentId && firstAppointmentId) {
      setSelectedAppointmentId(firstAppointmentId);
    }
  }, [appointmentsQuery.data?.items, selectedAppointmentId]);

  useEffect(() => {
    const currentRows = appointmentsQuery.data?.items || [];
    const currentFilteredRows = currentRows.filter((row) => {
      const matchesClient = !clientFilter || row.ClientName === clientFilter;
      const matchesOperation =
        !operationFilter || (row.OperationTypeName || row.OperationType) === operationFilter;

      return matchesClient && matchesOperation;
    });

    if (selectedAppointmentId && !currentFilteredRows.some((row) => row.Id === selectedAppointmentId)) {
      setSelectedAppointmentId(currentFilteredRows[0]?.Id || null);
    }
  }, [appointmentsQuery.data?.items, clientFilter, operationFilter, selectedAppointmentId]);

  const selectedAppointment =
    detailQuery.data ||
    appointmentsQuery.data?.items?.find((row) => row.Id === selectedAppointmentId) ||
    null;

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

  const openAction = useCallback((actionKey) => {
    setActionError("");
    setActiveAction(actionKey);
  }, []);

  const closeAction = useCallback(() => {
    setActionError("");
    setActiveAction(null);
  }, []);

  const selectAppointment = useCallback((appointment) => {
    setSelectedAppointmentId(appointment.Id);
  }, []);

  const isCandidatesExpiredError = (error) => {
    const status = error?.response?.status;
    const errorCode = error?.response?.data?.errorCode;
    const message = error?.response?.data?.message;

    return (
      status === 409 &&
      (errorCode === "CANDIDATES_EXPIRED" || message === "Candidatos expirados")
    );
  };

  const retryWithFreshCandidates = async (payload, mutationFn) => {
    const refreshed = await candidatesQuery.refetch();
    const freshVersion = refreshed?.data?.version;

    if (!freshVersion) {
      throw new Error("No fue posible refrescar candidatos.");
    }

    await mutationFn({
      appointmentId: selectedAppointmentId,
      payload: { ...payload, candidatesVersion: freshVersion },
    });
  };

  const handleActionSubmit = async (payload) => {
    try {
      if (activeAction === "create") {
        const created = await actions.create.mutateAsync(payload);
        setSelectedAppointmentId(created.Id);
      } else if (activeAction === "edit") {
        const updated = await actions.update.mutateAsync({
          appointmentId: selectedAppointmentId,
          payload,
        });
        setSelectedAppointmentId(updated.Id);
      } else if (activeAction === "remove") {
        await actions.remove.mutateAsync(selectedAppointmentId);
        setSelectedAppointmentId(null);
      } else if (activeAction === "checkin") {
        await actions.checkin.mutateAsync({ appointmentId: selectedAppointmentId, payload });
      } else if (activeAction === "assign") {
        try {
          await actions.assign.mutateAsync({ appointmentId: selectedAppointmentId, payload });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) {
            throw error;
          }

          await retryWithFreshCandidates(payload, actions.assign.mutateAsync);
        }
      } else if (activeAction === "reassign") {
        try {
          await actions.reassign.mutateAsync({ appointmentId: selectedAppointmentId, payload });
        } catch (error) {
          if (!isCandidatesExpiredError(error)) {
            throw error;
          }

          await retryWithFreshCandidates(payload, actions.reassign.mutateAsync);
        }
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
      if (isCandidatesExpiredError(error) && (activeAction === "assign" || activeAction === "reassign")) {
        setActionError("Los candidatos expiraron. Se recargó la disponibilidad, verifica y confirma nuevamente.");
        return;
      }

      setActionError(getErrorMessage(error));
    }
  };

  const rows = appointmentsQuery.data?.items || [];

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesClient = !clientFilter || row.ClientName === clientFilter;
        const matchesOperation =
          !operationFilter || (row.OperationTypeName || row.OperationType) === operationFilter;

        return matchesClient && matchesOperation;
      }),
    [rows, clientFilter, operationFilter],
  );

  const totalRows = appointmentsQuery.data?.total || 0;

  const clientOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.ClientName).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [rows],
  );

  const operationOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.OperationTypeName || row.OperationType).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [rows],
  );

  const actionIconByKey = useMemo(
    () => ({
      edit: <Pencil className="h-4 w-4" />,
      remove: <Trash2 className="h-4 w-4" />,
      checkin: <LogIn className="h-4 w-4" />,
      assign: <Wrench className="h-4 w-4" />,
      reassign: <RefreshCw className="h-4 w-4" />,
      startProcess: <Play className="h-4 w-4" />,
      toSign: <FileSignature className="h-4 w-4" />,
      finalize: <CheckCircle2 className="h-4 w-4" />,
      checkout: <LogOut className="h-4 w-4" />,
      cancel: <Ban className="h-4 w-4" />,
    }),
    [],
  );

  const getRowActions = useCallback(
    (row) =>
      getAvailableActions(row.Status, roles).map((action) => ({
        key: action.key,
        label: actionLabels[action.key] || action.key,
        icon: actionIconByKey[action.key],
        onClick: (targetRow) => {
          selectAppointment(targetRow);
          openAction(action.key);
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
    return <ErrorState message="No se pudo cargar el módulo de citas" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto px-1 sm:px-2 lg:overflow-hidden">
      {headerContent}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {plannerKpis.map((kpi) => (
          <div
            key={kpi.key}
            className={`rounded-xl border px-3 py-3 shadow-sm transition hover:shadow-md ${kpi.tone}`}
          >
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${kpi.iconBox}`}>
                <kpi.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {kpi.label}
                </p>
                <p className="mt-0.5 text-2xl font-semibold leading-none text-slate-900">
                  {kpi.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card padding="sm" className="rounded-xl border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <Input
            aria-label="Buscar por cliente o placa"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setDebouncedSearch(search);
              }
            }}
            placeholder="Buscar..."
            className="min-h-10 min-w-[220px] flex-1 rounded-lg border-slate-200 bg-white lg:min-w-[280px]"
          />

          <Select
            aria-label="Estado"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-10 min-w-[130px] rounded-lg border-slate-200 bg-white lg:w-[150px] lg:min-w-0 lg:flex-none"
          >
            <option value="">Todos</option>
            {appointmentStatuses.map((statusItem) => (
              <option key={statusItem} value={statusItem}>
                {statusLabels[statusItem] || statusItem}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Cliente"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            className="min-h-10 min-w-[170px] rounded-lg border-slate-200 bg-white lg:w-[210px] lg:min-w-0 lg:flex-none"
          >
            <option value="">Cliente: Todos</option>
            {clientOptions.map((clientName) => (
              <option key={clientName} value={clientName}>
                {clientName}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Operación"
            value={operationFilter}
            onChange={(event) => setOperationFilter(event.target.value)}
            className="min-h-10 min-w-[150px] rounded-lg border-slate-200 bg-white lg:w-[170px] lg:min-w-0 lg:flex-none"
          >
            <option value="">Operación: Todas</option>
            {operationOptions.map((operationName) => (
              <option key={operationName} value={operationName}>
                {operationName}
              </option>
            ))}
          </Select>

          <Button
            type="button"
            variant="secondary"
            className="min-h-10 justify-center gap-2 rounded-lg border-slate-200 bg-white px-3 text-slate-600 shadow-sm hover:bg-slate-50 lg:flex-none"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setStatus("");
              setClientFilter("");
              setOperationFilter("");
              setPage(1);
            }}
          >
            <FilterX className="h-4 w-4" strokeWidth={1.75} />
          </Button>

          {canCreate ? (
            <Button
              className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 lg:flex-none"
              onClick={() => openAction("create")}
            >
              {actionLabels.create}
            </Button>
          ) : null}
        </div>
      </Card>

      {filteredRows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:hidden">
            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <AppointmentsTable
                  rows={filteredRows}
                  selectedAppointmentId={selectedAppointmentId}
                  onSelect={selectAppointment}
                  getRowActions={getRowActions}
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
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    showActions={false}
                    showHistory={false}
                  />
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
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <AppointmentDetailPanel
                    appointment={selectedAppointment}
                    statusLog={statusLogQuery.data || []}
                    roles={roles}
                    onAction={openAction}
                    showDetail={false}
                    showActions={false}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1.95fr)_minmax(280px,0.62fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:gap-2">
            <div className="contents">
                <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-start-1 lg:row-start-1">
                <AppointmentsTable
                  rows={filteredRows}
                  selectedAppointmentId={selectedAppointmentId}
                  onSelect={selectAppointment}
                  getRowActions={getRowActions}
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={totalRows}
                  onPageChange={setPage}
                  maxVisibleRows={8}
                  fullHeight
                />
              </div>

                <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-start-2 lg:row-start-1 lg:row-span-2">
                <div className="h-full overflow-y-auto">
                  {detailQuery.isLoading && selectedAppointmentId ? (
                    <Card title="Detalle de cita" className="h-full">
                      <div className="flex items-center justify-center py-8">
                        <Loader />
                      </div>
                    </Card>
                  ) : (
                <AppointmentDetailPanel
                  appointment={selectedAppointment}
                  roles={roles}
                  onAction={openAction}
                  showActions={false}
                  showHistory={false}
                  historyFullHeight
                  detailFullHeight
                />
              )}
            </div>
              </div>
            </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-start-1 lg:row-start-2">
              {detailQuery.isLoading && selectedAppointmentId ? (
                <Card>
                  <div className="flex items-center justify-center py-4">
                    <Loader />
                  </div>
                </Card>
              ) : (
                <AppointmentDetailPanel
                  appointment={selectedAppointment}
                  statusLog={statusLogQuery.data || []}
                  roles={roles}
                  onAction={openAction}
                  showDetail={false}
                  showActions={false}
                  historyVariant="horizontal-compact"
                  historyHideTitle
                />
              )}
            </div>
          </div>
        </>
      )}

      <AppointmentActionModal
        action={activeAction}
        appointment={activeAction === "create" ? null : selectedAppointment}
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
