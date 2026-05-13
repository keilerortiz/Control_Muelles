import { plannerKpiTemplate } from "./constants";

interface PlannerKpiGridProps {
  values: Record<string, unknown> | undefined;
}

export function PlannerKpiGrid({ values }: PlannerKpiGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
      {plannerKpiTemplate.map((kpi) => (
        <div key={kpi.key} className={`rounded-xl border px-3 py-3 shadow-sm transition hover:shadow-md ${kpi.tone}`}>
          <div className="flex items-center gap-3">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${kpi.iconBox}`}>
              <kpi.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-wide text-neutral-500">{kpi.label}</p>
              <p className="mt-0.5 text-2xl font-semibold leading-none text-neutral-900">
                {Number(values?.[kpi.key] ?? 0)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
