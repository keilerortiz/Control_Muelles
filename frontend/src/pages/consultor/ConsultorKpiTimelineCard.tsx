import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import type { DashboardTimelineBucket } from "../../domain/types/dashboard";
import type { DateRangeValue } from "../../utils/dateRange";

function getBogotaHour() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === "hour")?.value || "0");
}

function LineChartCard({
  labels,
  otcValues,
  otsValues,
}: {
  labels: string[];
  otcValues: Array<number | null>;
  otsValues: Array<number | null>;
}) {
  const width = 720;
  const height = 220;
  const chartW = width;
  const chartH = height;
  const maxY = 100;
  const xFor = (index: number) => (index / Math.max(labels.length - 1, 1)) * chartW;
  const yFor = (value: number) => chartH - (Math.max(0, Math.min(value, maxY)) / maxY) * chartH;
  const toPath = (values: Array<number | null>) => values
    .map((value, index) => (value === null ? null : `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(value)}`))
    .filter(Boolean)
    .join(" ");
  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1 text-neutral-700"><span className="h-2.5 w-2.5 rounded-full bg-brand-secondary" />OTC</span>
        <span className="inline-flex items-center gap-1 text-neutral-700"><span className="h-2.5 w-2.5 rounded-full bg-brand-light" />OTS</span>
      </div>
      <div className="grid grid-cols-[42px_minmax(0,1fr)] items-stretch gap-1">
        <div className="relative h-[220px]">
          {yTicks.map((tick) => (
            <span
              key={tick}
              className="absolute left-0 -translate-y-1/2 text-[12px] text-neutral-500"
              style={{ top: `${100 - tick}%` }}
            >
              {tick}%
            </span>
          ))}
        </div>
        <div>
          <svg viewBox={`0 0 ${width} ${height}`} className="block w-full h-[220px]">
            {yTicks.map((tick) => (
              <line key={tick} x1={0} y1={yFor(tick)} x2={chartW} y2={yFor(tick)} stroke="#E2E8F0" strokeWidth="1" />
            ))}
            <path d={toPath(otcValues)} fill="none" stroke="#0A2A5E" strokeWidth="2.5" />
            <path d={toPath(otsValues)} fill="none" stroke="#3FA9F5" strokeWidth="2.5" />
            {otcValues.map((value, idx) => (
              typeof value === "number" ? (
                <circle key={`otc-${idx}`} cx={xFor(idx)} cy={yFor(value)} r="3.5" fill="#0A2A5E">
                  <title>{`OTC ${labels[idx]}: ${value}%`}</title>
                </circle>
              ) : null
            ))}
            {otsValues.map((value, idx) => (
              typeof value === "number" ? (
                <circle key={`ots-${idx}`} cx={xFor(idx)} cy={yFor(value)} r="3.5" fill="#3FA9F5">
                  <title>{`OTS ${labels[idx]}: ${value}%`}</title>
                </circle>
              ) : null
            ))}
          </svg>
          <div className="mt-1 grid text-[12px] text-neutral-500" style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}>
            {labels.map((label, idx) => (
              <span key={`${label}-${idx}`} className="text-center">{label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConsultorKpiTimelineCardProps {
  buckets: DashboardTimelineBucket[];
  rangePreset: DateRangeValue["preset"];
  isLoading?: boolean;
}

export function ConsultorKpiTimelineCard({ buckets, rangePreset, isLoading = false }: ConsultorKpiTimelineCardProps) {
  const visibleHourLimit = rangePreset === "today" ? getBogotaHour() : 23;
  const visibleBuckets = buckets.filter((bucket) => bucket.hour <= visibleHourLimit);
  const labels = visibleBuckets.map((bucket) => bucket.label);
  const otcValues = visibleBuckets.map((bucket) => (typeof bucket.otcRate === "number" ? bucket.otcRate : null));
  const otsValues = visibleBuckets.map((bucket) => (typeof bucket.otsRate === "number" ? bucket.otsRate : null));
  const hasAnyData = otcValues.some((value) => typeof value === "number") || otsValues.some((value) => typeof value === "number");

  return (
    <Card title="OTC / OTS por franja horaria" className="h-full min-h-0" contentClassName="h-full min-h-0">
      {isLoading ? (
        <Skeleton className="h-56" />
      ) : labels.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin datos para graficar en el rango seleccionado.</p>
      ) : !hasAnyData ? (
        <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
          <p className="text-sm text-neutral-500">No hay datos OTC/OTS en las franjas visibles.</p>
        </div>
      ) : (
        <LineChartCard labels={labels} otcValues={otcValues} otsValues={otsValues} />
      )}
    </Card>
  );
}
