import { Activity, CheckCircle2, Clock3, Factory, Timer, TriangleAlert } from "lucide-react";

import { Card } from "../ui/Card";

const kpiConfig = {
  total: { label: "Total citas", Icon: Activity },
  activeOperations: { label: "Operaciones activas", Icon: Factory },
  completionRate: { label: "Cumplimiento global", Icon: CheckCircle2, suffix: "%" },
  otcRate: { label: "OTC", Icon: Clock3, suffix: "%" },
  otsRate: { label: "OTS", Icon: Timer, suffix: "%" },
  alerts: { label: "Alertas", Icon: TriangleAlert },
};

export function KpiCards({ summary }) {
  const cards = [
    { key: "total", value: summary?.total ?? 0 },
    { key: "activeOperations", value: summary?.operationalState?.activeOperations ?? 0 },
    { key: "completionRate", value: summary?.completionRate ?? 0 },
    { key: "otcRate", value: summary?.kpis?.otcRate ?? "-" },
    { key: "otsRate", value: summary?.kpis?.otsRate ?? "-" },
    { key: "alerts", value: summary?.alerts?.length ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const config = kpiConfig[card.key];
        const Icon = config.Icon;
        return (
          <Card key={card.key} title={config.label} padding="md" hover className="transition-all">
            <div className="flex items-center justify-between gap-4">
              <Icon className="h-7 w-7 text-neutral-500" strokeWidth={1.75} />
              <p className="text-right text-2xl font-bold text-neutral-800">
                {card.value}
                {card.value !== "-" ? config.suffix || "" : ""}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
