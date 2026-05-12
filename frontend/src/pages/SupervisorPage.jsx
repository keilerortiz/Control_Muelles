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
}

export function SupervisorPage() {
  return (
    <AppointmentsPage
      title="Supervisión de patio"
      headerContent={<SupervisorHeader />}
      emptyDescription="No hay operaciones del rango seleccionado para supervisar."
    />
  );
}
