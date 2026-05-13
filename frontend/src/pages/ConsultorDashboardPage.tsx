import { useEffect, useMemo, useState } from "react";

import { AppointmentDetailPanel } from "../components/domain/AppointmentDetailPanel";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppointmentDetail, useAppointmentStatusLog, useAppointments } from "../hooks/useAppointments";
import { useDashboard } from "../hooks/useDashboard";
import { useAuthStore } from "../store/authStore";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import { useIsMinWidth } from "../hooks/useIsMinWidth";
import { buildConsultorMetrics, type ConsultorAppointmentRow } from "./consultor/metrics";
import { ConsultorSummaryCards } from "./consultor/ConsultorSummaryCards";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const PAGE_SIZE = 10;

export function ConsultorDashboardPage() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isXl = useIsMinWidth(1280);
  const roles = useAuthStore((state) => state.user?.roles || []);
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);

  const summaryQuery = useDashboard(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });
  const appointmentsQuery = useAppointments(
    { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, ...dateRangeParams },
    { refetchInterval: REFRESH_INTERVAL_MS, refetchIntervalInBackground: false },
  );
  const detailQuery = useAppointmentDetail(selectedAppointmentId, {
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
  const statusLogQuery = useAppointmentStatusLog(selectedAppointmentId, {
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    setPage(1);
  }, [dateRangeParams.date_from, dateRangeParams.date_to]);

  const appointments = (appointmentsQuery.data?.items || []) as ConsultorAppointmentRow[];
  const selectedAppointment =
    detailQuery.data || appointments.find((row) => row.Id === selectedAppointmentId) || null;
  const metrics = useMemo(() => buildConsultorMetrics(appointments), [appointments]);
  const operatorMetrics = metrics.operatorMetrics || [];

  if (summaryQuery.isLoading || appointmentsQuery.isLoading) {
    return (
      <div className="space-y-3 px-2 sm:px-3 lg:px-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (summaryQuery.isError || appointmentsQuery.isError) {
    return <ErrorState message="No se pudo cargar el dashboard consultivo" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden px-2 sm:px-3 lg:px-4">
      <ConsultorSummaryCards
        totalVolume={metrics.totalVolume}
        bestOperario={metrics.bestOperario}
        nonCompliances={metrics.nonCompliances}
        otsRate={Number(summaryQuery.data?.kpis?.otsRate ?? 0)}
        otcRate={Number(summaryQuery.data?.kpis?.otcRate ?? 0)}
        inProcessCount={Number(summaryQuery.data?.en_proceso ?? 0) + Number(summaryQuery.data?.para_firmar ?? 0)}
      />

      <Card title="Desempeño por operario" className="min-h-0">
        {operatorMetrics.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin datos de operarios en el rango seleccionado.</p>
        ) : (
          <div className="max-h-[34vh] overflow-auto xl:max-h-[40vh]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-2 py-2 font-semibold">Nombre</th>
                  <th className="px-2 py-2 font-semibold">Cargo</th>
                  <th className="px-2 py-2 font-semibold">Tiempo ejecutado</th>
                  <th className="px-2 py-2 font-semibold">OTS</th>
                </tr>
              </thead>
              <tbody>
                {operatorMetrics.map((operator) => (
                  <tr key={`${operator.role}-${operator.name}`} className="border-b border-neutral-100 last:border-b-0">
                    <td className="px-2 py-2 text-neutral-800">{operator.name}</td>
                    <td className="px-2 py-2 text-neutral-700">{operator.role}</td>
                    <td className="px-2 py-2 text-neutral-700">{operator.executedMinutes} min</td>
                    <td className="px-2 py-2 font-semibold text-neutral-900">{operator.otsRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isXl ? (
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-0">
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            statusLog={statusLogQuery.data || []}
            roles={roles}
            onAction={() => {}}
          />
        </div>
      </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-auto">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.9fr)] gap-4">
        <Card title="Cumple cita">
          <p className="text-3xl font-semibold text-neutral-900">
            {summaryQuery.data?.kpis?.cumpleCitaRate ?? 0}%
          </p>
          <p className="mt-1 text-sm text-neutral-500">Llegadas dentro de objetivo</p>
        </Card>

        <Card title="OTS">
          <p className="text-3xl font-semibold text-neutral-900">
            {summaryQuery.data?.kpis?.otsRate ?? 0}%
          </p>
          <p className="mt-1 text-sm text-neutral-500">Operaciones dentro del estándar</p>
        </Card>
      </div>
      </div>
      )}
    </div>
  );
}
