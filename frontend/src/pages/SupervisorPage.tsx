import { ClipboardCheck, PackageOpen, Truck } from "lucide-react";
import { useMemo } from "react";

import { Card } from "../components/ui/Card";
import { AppointmentsPage } from "./AppointmentsPage";
import { useDashboard } from "../hooks/useDashboard";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

function SupervisorHeader() {
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);
  const summaryQuery = useDashboard(dateRangeParams);

  const kpis = summaryQuery.data as Record<string, unknown> | undefined;

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Card padding="sm" title="En patio">
        <p className="text-lg font-semibold text-neutral-900">{Number(kpis?.en_patio ?? 0)}</p>
      </Card>
      <Card padding="sm" title="En proceso">
        <p className="text-lg font-semibold text-neutral-900">{Number(kpis?.en_proceso ?? 0)}</p>
      </Card>
      <Card padding="sm" title="Alertas">
        <p className="text-lg font-semibold text-neutral-900">{Number(kpis?.retrasada ?? 0)}</p>
      </Card>
    </div>
  );
}

export function SupervisorPage() {
  return (
    <AppointmentsPage
      title="Supervisión de patio"
      headerContent={<SupervisorHeader />}
      emptyDescription="No hay información para mostrar en este momento."
    />
  );
}
