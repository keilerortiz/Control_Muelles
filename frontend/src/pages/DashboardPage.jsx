import { AlertsPanel } from "../components/dashboard/AlertsPanel";
import { KpiCards } from "../components/dashboard/KpiCards";
import { AppointmentsTable } from "../components/domain/AppointmentsTable";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useAppointments } from "../hooks/useAppointments";
import { useDashboard } from "../hooks/useDashboard";
import { useRealtime } from "../hooks/useRealtime";

export function DashboardPage() {
  const { syncState } = useRealtime();
  const summaryQuery = useDashboard();
  const appointmentsQuery = useAppointments({ skip: 0, take: 20 });

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">Sincronización: {syncState}</p>
      <KpiCards summary={summaryQuery.data} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AppointmentsTable rows={appointments} />
        </div>
        <AlertsPanel appointments={appointments} />
      </div>
    </div>
  );
}
