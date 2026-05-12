import { Activity, Gauge, OctagonAlert, PackageCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppointmentDetailPanel } from "../components/domain/AppointmentDetailPanel";
import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppointmentDetail, useAppointmentStatusLog, useAppointments } from "../hooks/useAppointments";
import { useDashboard } from "../hooks/useDashboard";
import { useAuthStore } from "../store/authStore";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;
const PAGE_SIZE = 10;

function buildConsultorMetrics(rows = []) {
  const totalVolume = rows.reduce(
    (accumulator, row) => accumulator + Number(row.MovedWeightKg || row.EstimatedTons || 0),
    0,
  );

  const nonCompliances = rows.filter((row) => {
    if (row.OtcNonComplianceReason || row.OtsNonComplianceReason || row.NonComplianceComment) {
      return true;
    }

    if (!row.ProcessStartAt || !row.ProcessEndAt || !row.StandardTimeMinutes) {
      return false;
    }

    const startedAt = new Date(row.ProcessStartAt);
    const endedAt = new Date(row.ProcessEndAt);
    const elapsedMinutes = Math.max((endedAt.getTime() - startedAt.getTime()) / 60000, 0);
    return elapsedMinutes > Number(row.StandardTimeMinutes);
  }).length;

  const docks = rows.reduce((accumulator, row) => {
    if (!row.DockName || !row.ProcessStartAt || !row.ProcessEndAt || !row.StandardTimeMinutes) {
      return accumulator;
    }

    const startedAt = new Date(row.ProcessStartAt);
    const endedAt = new Date(row.ProcessEndAt);
    const elapsedMinutes = Math.max((endedAt.getTime() - startedAt.getTime()) / 60000, 0);
    const current = accumulator[row.DockName] || { total: 0, compliant: 0 };
    current.total += 1;
    if (elapsedMinutes <= Number(row.StandardTimeMinutes)) {
      current.compliant += 1;
    }
    accumulator[row.DockName] = current;
    return accumulator;
  }, {});

  const bestDock = Object.entries(docks)
    .map(([name, value]) => ({
      name,
      rate: value.total ? Math.round((value.compliant * 100) / value.total) : 0,
    }))
    .sort((left, right) => right.rate - left.rate)[0];

  return {
    totalVolume: totalVolume.toFixed(1),
    nonCompliances,
    bestDockLabel: bestDock ? `${bestDock.name} · ${bestDock.rate}%` : "Sin dato",
  };
}

export function ConsultorDashboardPage() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [page, setPage] = useState(1);
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

  const appointments = appointmentsQuery.data?.items || [];
  const totalAppointments = appointmentsQuery.data?.total || 0;
  const selectedAppointment =
    detailQuery.data || appointments.find((row) => row.Id === selectedAppointmentId) || null;
  const metrics = useMemo(() => buildConsultorMetrics(appointments), [appointments]);
  const selectAppointment = useCallback((appointment) => {
    setSelectedAppointmentId(appointment.Id);
  }, []);

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

  const cards = [
    { label: "Volumen total", value: `${metrics.totalVolume} t`, Icon: PackageCheck },
    { label: "Mejor muelle", value: metrics.bestDockLabel, Icon: Gauge },
    { label: "Incumplimientos", value: metrics.nonCompliances, Icon: OctagonAlert },
    { label: "Cumplimiento", value: `${summaryQuery.data?.completionRate ?? 0}%`, Icon: Activity },
  ];

  return (
    <div className="space-y-4 px-2 sm:px-3 lg:px-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.Icon;

          return (
            <Card key={card.label} title={card.label}>
              <div className="flex items-center justify-between gap-4">
                <Icon className="h-7 w-7 text-neutral-500" strokeWidth={1.75} />
                <p className="text-right text-lg font-semibold text-neutral-800">{card.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 xl:hidden">
        <div className="min-w-0">
          <Card title="Citas del rango seleccionado">
            <AppointmentsTable
              rows={appointments}
              selectedAppointmentId={selectedAppointmentId}
              onSelect={selectAppointment}
              page={page}
              pageSize={PAGE_SIZE}
              total={totalAppointments}
              onPageChange={setPage}
            />
          </Card>
        </div>

        <div className="min-w-0">
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            statusLog={statusLogQuery.data || []}
            roles={roles}
            onAction={() => {}}
          />
        </div>
      </div>

      <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,0.9fr)] xl:gap-4">
        <div className="col-span-2 min-w-0">
          <Card title="Citas del rango seleccionado">
            <AppointmentsTable
              rows={appointments}
              selectedAppointmentId={selectedAppointmentId}
              onSelect={selectAppointment}
              page={page}
              pageSize={PAGE_SIZE}
              total={totalAppointments}
              onPageChange={setPage}
            />
          </Card>
        </div>

        <div className="row-span-2 min-w-0">
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            statusLog={statusLogQuery.data || []}
            roles={roles}
            onAction={() => {}}
          />
        </div>

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
  );
}
