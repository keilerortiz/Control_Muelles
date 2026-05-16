import { Card } from "../../components/ui/Card";
import type {
  LogisticsOtsBreakdownItem,
  LogisticsProcessDuration,
  LogisticsSeniorOperatorOts,
  LogisticsSupervisorAssignment,
} from "../../domain/types/dashboard";

function formatMinutes(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function formatRate(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value)}%` : "-";
}

function getRateColorClass(rate: number) {
  if (rate >= 90) return "bg-success-500";
  if (rate >= 75) return "bg-warning-500";
  return "bg-error-500";
}

export function OtsBreakdownCard({
  title,
  data,
}: {
  title: string;
  data: LogisticsOtsBreakdownItem[];
}) {
  const maxRate = Math.max(...data.map((item) => item.otsRate), 100);

  return (
    <Card title={title} className="flex h-full flex-col rounded-lg" contentClassName="flex-1">
      {data.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin operaciones evaluadas en el rango.</p>
      ) : (
        <div className="space-y-4">
          {data.slice(0, 8).map((item) => {
            const width = (item.otsRate / maxRate) * 100;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-neutral-700" title={item.name}>
                    {item.name}
                  </span>
                  <span className="shrink-0 font-bold text-brand-primary">{formatRate(item.otsRate)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                  <div className={`h-full rounded-full ${getRateColorClass(item.otsRate)}`} style={{ width: `${width}%` }} />
                </div>
                <p className="text-xs text-neutral-500">{item.totalOperations} operaciones medidas</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function ProcessDurationsCard({ data }: { data: LogisticsProcessDuration[] }) {
  const maxMinutes = Math.max(...data.map((item) => item.averageMinutes || 0), 1);

  return (
    <Card title="Tiempo promedio por proceso" className="flex h-full flex-col rounded-lg" contentClassName="flex-1">
      <div className="space-y-4">
        {data.map((item) => {
          const width = ((item.averageMinutes || 0) / maxMinutes) * 100;
          return (
            <div key={item.code} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-neutral-700">{item.label}</span>
                <span className="shrink-0 font-bold text-brand-primary">{formatMinutes(item.averageMinutes)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-brand-secondary" style={{ width: `${width}%` }} />
              </div>
              <p className="text-xs text-neutral-500">{item.sampleSize} operaciones medidas</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function SeniorOperatorOtsCard({ operators }: { operators: LogisticsSeniorOperatorOts[] }) {
  const orderedOperators = [...operators].sort((left, right) => {
    if (right.otsRate !== left.otsRate) return right.otsRate - left.otsRate;
    if (right.compliantOperations !== left.compliantOperations) return right.compliantOperations - left.compliantOperations;
    return left.name.localeCompare(right.name);
  });

  return (
    <Card title="OTS por operario senior" className="flex h-full flex-col rounded-lg" contentClassName="flex-1">
      {orderedOperators.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin datos de operarios senior.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-2">
            <div className="relative h-56">
              {[100, 80, 60, 40, 20, 0].map((tick) => (
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
              <div className="flex h-56 items-end gap-3 border-b border-l border-neutral-200 px-3 pb-2">
                {orderedOperators.map((operator) => {
                  const height = Math.max(operator.otsRate, 2);
                  return (
                    <div key={operator.operatorId} className="group relative flex h-full flex-1 flex-col justify-end">
                      <div className={`rounded-t ${getRateColorClass(operator.otsRate)}`} style={{ height: `${height}%` }} />
                      <div className="absolute -top-12 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block">
                        {operator.name}: {formatRate(operator.otsRate)} | {formatMinutes(operator.workedMinutes)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="mt-2 grid gap-3 text-[11px] text-neutral-500"
                style={{ gridTemplateColumns: `repeat(${orderedOperators.length || 1}, minmax(0, 1fr))` }}
              >
                {orderedOperators.map((operator) => (
                  <div key={operator.operatorId} className="space-y-1 text-center">
                    <span className="block truncate font-semibold text-neutral-700" title={operator.name}>
                      {operator.name}
                    </span>
                    <span className="block">{formatRate(operator.otsRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {orderedOperators.slice(0, 3).map((operator) => (
              <div key={operator.operatorId} className="rounded-md border border-neutral-200 px-3 py-2">
                <p className="truncate text-sm font-semibold text-neutral-800" title={operator.name}>
                  {operator.name}
                </p>
                <p className="text-xs text-neutral-500">{formatMinutes(operator.workedMinutes)} laborados</p>
                <p className="text-sm font-bold text-brand-primary">
                  {operator.compliantOperations}/{operator.totalOperations} dentro del estándar
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function SupervisorAssignmentsCard({ supervisors }: { supervisors: LogisticsSupervisorAssignment[] }) {
  const maxVehicles = Math.max(...supervisors.map((item) => item.managedVehicles), 1);

  return (
    <Card title="Supervisor · Vehículos gestionados" className="flex h-full flex-col rounded-lg" contentClassName="flex-1">
      {supervisors.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin asignaciones registradas en el rango.</p>
      ) : (
        <div className="space-y-4">
          {supervisors.map((supervisor) => {
            const width = (supervisor.managedVehicles / maxVehicles) * 100;
            return (
              <div key={supervisor.supervisorId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-neutral-700">{supervisor.name}</span>
                  <span className="font-bold text-brand-primary">{supervisor.managedVehicles}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-brand-medium" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
