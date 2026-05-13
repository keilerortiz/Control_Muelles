import { Activity, Gauge, OctagonAlert, PackageCheck } from "lucide-react";

import { Card } from "../../components/ui/Card";

interface ConsultorSummaryCardsProps {
  totalVolume: string;
  bestOperario: string;
  nonCompliances: number;
  otsRate: number;
  otcRate: number;
  inProcessCount: number;
}

export function ConsultorSummaryCards({
  totalVolume,
  bestOperario,
  nonCompliances,
  otsRate,
  otcRate,
  inProcessCount,
}: ConsultorSummaryCardsProps) {
  const cards = [
    { label: "Volumen total", value: `${totalVolume} Ton`, Icon: PackageCheck },
    { label: "Mejor operario", value: bestOperario, Icon: Gauge },
    { label: "Incumplimientos", value: nonCompliances, Icon: OctagonAlert },
    { label: "Citas en proceso", value: inProcessCount, Icon: Activity },
    { label: "OTS", value: `${otsRate}%`, Icon: Activity },
    { label: "OTC", value: `${otcRate}%`, Icon: Activity },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
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
  );
}
