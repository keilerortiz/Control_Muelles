import { AlertTriangle, ClipboardCheck, PackageOpen, Truck } from "lucide-react";
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

  const cards = [
    { label: "En patio", key: "en_patio", Icon: Truck },
    { label: "En proceso", key: "en_proceso", Icon: PackageOpen },
    { label: "Para firmar", key: "para_firmar", Icon: ClipboardCheck },
    { label: "Alertas", key: "alerts", Icon: AlertTriangle },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.Icon;

        return (
          <Card key={card.key} title={card.label}>
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-7 w-7 text-neutral-500" strokeWidth={1.75} />
              <p className="text-2xl font-bold text-neutral-800">
                {card.key === "alerts"
                  ? summaryQuery.data?.alerts?.length ?? 0
                  : summaryQuery.data?.[card.key] ?? 0}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
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
