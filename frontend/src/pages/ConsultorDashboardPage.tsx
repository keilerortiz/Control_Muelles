import { useEffect, useMemo, useState } from "react";

import { AppointmentDetailPanel } from "../components/domain/AppointmentDetailPanel";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppointmentDetail, useAppointmentStatusLog, useAppointments } from "../hooks/useAppointments";
import { useDashboard, useDashboardKpisTimeline, useOperatorPerformance } from "../hooks/useDashboard";
import { useAuthStore } from "../store/authStore";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import { useIsMinWidth } from "../hooks/useIsMinWidth";
import { buildConsultorMetrics, type ConsultorAppointmentRow } from "./consultor/metrics";
import { ConsultorSummaryCards } from "./consultor/ConsultorSummaryCards";
import { ConsultorKpiTimelineCard } from "./consultor/ConsultorKpiTimelineCard";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const PAGE_SIZE = 10;
const METRICS_TAKE = 100;

export function ConsultorDashboardPage() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const isXl = useIsMinWidth(1280);
  const roles = useAuthStore((state) => state.user?.roles || []);
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);

  const summaryQuery = useDashboard(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });
  const timelineQuery = useDashboardKpisTimeline(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });
  const operatorPerformanceQuery = useOperatorPerformance(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });
  const appointmentsQuery = useAppointments(
    { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, ...dateRangeParams },
    { refetchInterval: REFRESH_INTERVAL_MS, refetchIntervalInBackground: false },
  );
  const metricsAppointmentsQuery = useAppointments(
    { skip: 0, take: METRICS_TAKE, ...dateRangeParams },
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
  const metricsRows = (metricsAppointmentsQuery.data?.items || []) as ConsultorAppointmentRow[];
  const selectedAppointment =
    detailQuery.data || appointments.find((row) => row.Id === selectedAppointmentId) || null;
  const metrics = useMemo(() => buildConsultorMetrics(metricsRows), [metricsRows]);
  const operatorMetrics = operatorPerformanceQuery.data?.items || [];
  const bestOperator = operatorMetrics[0];
  const bestOperario = bestOperator ? `${bestOperator.name} · ${Math.round(bestOperator.otsRate)}% OTS` : "Sin dato";
  const timelineBuckets = timelineQuery.data?.buckets || [];

  if (summaryQuery.isLoading || appointmentsQuery.isLoading || metricsAppointmentsQuery.isLoading || operatorPerformanceQuery.isLoading) {
    return (
      <div className="space-y-3 px-2 sm:px-3 lg:px-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (summaryQuery.isError || appointmentsQuery.isError || metricsAppointmentsQuery.isError || operatorPerformanceQuery.isError) {
    return <ErrorState message="No se pudo cargar el dashboard consultivo" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-2 sm:px-3 lg:px-4">
      <div className="shrink-0">
        <ConsultorSummaryCards
        totalVolume={metrics.totalVolume}
        bestOperario={bestOperario}
        nonCompliances={metrics.nonCompliances}
        otsRate={Number(summaryQuery.data?.kpis?.otsRate ?? 0)}
        otcRate={Number(summaryQuery.data?.kpis?.otcRate ?? 0)}
        inProcessCount={Number(summaryQuery.data?.en_proceso ?? 0) + Number(summaryQuery.data?.para_firmar ?? 0)}
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
        <div className="min-h-0">
          <ConsultorKpiTimelineCard
            buckets={timelineBuckets}
            rangePreset={range.preset}
            isLoading={appointmentsQuery.isLoading || timelineQuery.isLoading}
          />
        </div>

        <Card title="Desempeño por operario" className="min-h-0 h-full" contentClassName="min-h-0 h-full">
          {operatorMetrics.length === 0 ? (
            <p className="text-sm text-neutral-500">Sin datos de operarios en el rango seleccionado.</p>
          ) : (
            <div className="h-full min-h-0 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <th className="px-2 py-2 font-semibold">Nombre</th>
                    <th className="px-2 py-2 font-semibold">Cargo</th>
                    <th className="px-2 py-2 font-semibold">T. Ejecutado</th>
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
      </div>

      
    </div>
  );
}
