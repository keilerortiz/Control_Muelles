import { Activity, FileClock, Gauge, PackageCheck, Timer, Truck } from "lucide-react";

import { Card } from "../../components/ui/Card";

interface ConsultorSummaryCardsProps {
  scheduledVehicles: number;
  attendedVehicles: number;
  movedWeightKg: number;
  otsRate: number | null;
  otcRate: number | null;
  onTimeArrivalRate: number | null;
  evaluatedOperations: number;
  supervisorsWithAssignments: number;
  seniorOperatorsMeasured: number;
  cancelledOperations: number;
}

function formatRate(value: number | null) {
  return typeof value === "number" ? `${Math.round(value)}%` : "-";
}

export function ConsultorSummaryCards({
  scheduledVehicles,
  attendedVehicles,
  movedWeightKg,
  otsRate,
  otcRate,
  onTimeArrivalRate,
  evaluatedOperations,
  supervisorsWithAssignments,
  seniorOperatorsMeasured,
  cancelledOperations,
}: ConsultorSummaryCardsProps) {
  const cards = [
    { label: "Programados", value: scheduledVehicles, Icon: Truck },
    { label: "Atendidos", value: attendedVehicles, Icon: PackageCheck },
    { label: "Cumple cita", value: formatRate(onTimeArrivalRate), Icon: Timer },
    { label: "Canceladas", value: cancelledOperations, Icon: Truck },
    { label: "OTC", value: formatRate(otcRate), Icon: Gauge },
    { label: "OTS", value: formatRate(otsRate), Icon: Gauge },

  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.Icon;
        return (
          <Card key={card.label} title={null} className="rounded-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-brand-secondary/70">
                  {card.label}
                </span>
                <Icon className="h-5 w-5 text-brand-medium" strokeWidth={2} />
              </div>
              <p className="text-2xl font-bold tracking-tight text-brand-primary">
                {card.value}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
