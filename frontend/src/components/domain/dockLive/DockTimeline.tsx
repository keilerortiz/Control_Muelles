function getSlaVisual(compliancePercent: number) {
  if (compliancePercent <= 85) {
    return {
      tone: "success",
      label: "Dentro de tiempo estándar",
      barClassName: "bg-success-600",
      textClassName: "text-success-700",
    };
  }

  if (compliancePercent <= 100) {
    return {
      tone: "warning",
      label: "Operación en riesgo",
      barClassName: "bg-warning-500",
      textClassName: "text-warning-700",
    };
  }

  return {
    tone: "error",
    label: "Operación retrasada",
    barClassName: "bg-error-600",
    textClassName: "text-error-700",
  };
}

export function DockTimeline({ elapsedMinutes = 0, standardMinutes = 0 }: { elapsedMinutes?: number; standardMinutes?: number }) {
  const safeElapsedMinutes = Math.max(Math.floor(elapsedMinutes), 0);
  const safeStandardMinutes = Math.max(Math.floor(standardMinutes), 0);
  const compliancePercent = safeStandardMinutes > 0
    ? Math.round((safeElapsedMinutes / safeStandardMinutes) * 100)
    : 0;

  const progressMainPercent = Math.min(compliancePercent, 100);
  const overflowPercent = compliancePercent > 100 ? Math.min(compliancePercent - 100, 100) : 0;
  const visual = getSlaVisual(compliancePercent);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Tiempo transcurrido
          </p>
          <p className={`text-xl font-semibold leading-none ${visual.textClassName}`}>
            {safeElapsedMinutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            % de tiempo
          </p>
          <p className={`text-lg font-semibold leading-none ${visual.textClassName}`}>
            {compliancePercent}%
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-full">
        <div className="h-2 rounded-full bg-neutral-200">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${visual.barClassName}`}
            style={{ width: `${progressMainPercent}%` }}
          />
        </div>
        {overflowPercent > 0 ? (
          <div
            className={`absolute right-0 top-0 h-2 rounded-r-full opacity-55 transition-all duration-500 ${visual.barClassName}`}
            style={{ width: `${overflowPercent}%` }}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
        <span>0 min</span>
        <span>{safeStandardMinutes} min</span>
      </div>

      <p className={`text-[11px] font-semibold ${visual.textClassName}`}>
        {visual.label}
      </p>
    </div>
  );
}
