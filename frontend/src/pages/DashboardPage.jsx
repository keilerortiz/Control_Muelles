import { useMemo } from "react";

import { AlertsPanel } from "../components/dashboard/AlertsPanel";
import { KpiCards } from "../components/dashboard/KpiCards";
import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppointments } from "../hooks/useAppointments";
import { useDashboard } from "../hooks/useDashboard";
import { useRealtime } from "../hooks/useRealtime";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

export function DashboardPage() {
  const { syncState } = useRealtime();
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);
  const summaryQuery = useDashboard(dateRangeParams, { realtimeConnected: syncState === "CONNECTED" });
  const appointmentsQuery = useAppointments({ skip: 0, take: 20, ...dateRangeParams });

  if (summaryQuery.isLoading || appointmentsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (summaryQuery.isError || appointmentsQuery.isError) {
    return <ErrorState message="No se pudo cargar el dashboard" onRetry={() => window.location.reload()} />;
  }

  const appointments = appointmentsQuery.data?.items || [];
  const alerts = summaryQuery.data?.alerts || [];

  return (
    <div className="space-y-4 px-2 sm:px-3 lg:px-4">
      <p className="text-xs sm:text-sm text-neutral-500 break-words">Sincronización: {syncState}</p>
      <KpiCards summary={summaryQuery.data} />
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <AppointmentsTable rows={appointments} />
        </div>
        <div className="min-w-0">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
