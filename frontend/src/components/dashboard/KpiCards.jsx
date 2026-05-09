// src/components/dashboard/KpiCards.jsx
import { Card } from "../ui/Card";
import { CheckCircle2, ChartColumn, Settings, Truck } from "lucide-react";

const kpiConfig = {
  total: { label: "Total", Icon: ChartColumn, color: "slate" },
  en_patio: { label: "En Patio", Icon: Truck, color: "amber" },
  en_proceso: { label: "En Proceso", Icon: Settings, color: "blue" },
  atendida: { label: "Atendidas", Icon: CheckCircle2, color: "emerald" },
};

export function KpiCards({ summary }) {
  const cards = [
    { key: "total", value: summary?.total ?? 0 },
    { key: "en_patio", value: summary?.en_patio ?? 0 },
    { key: "en_proceso", value: summary?.en_proceso ?? 0 },
    { key: "atendida", value: summary?.atendida ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const config = kpiConfig[card.key];
        const Icon = config.Icon;
        return (
          <Card
            key={card.key}
            title={config.label}
            padding="md"
            hover
            className="transition-all"
          >
            <div className="flex items-center justify-between">
              <Icon className="h-8 w-8 text-neutral-600" strokeWidth={1.75} />
              <p className="text-2xl font-bold text-neutral-800">{card.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
