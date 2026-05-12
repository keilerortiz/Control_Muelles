// src/components/ui/Badge.jsx
import clsx from "clsx";
import { statusLabels } from "../../domain/appointmentsConfig";

const statusColors = {
  AGENDADA:
    "border-blue-200/70 bg-blue-50/80 text-blue-700 shadow-blue-950/5 ring-blue-500/10",
  EN_PATIO:
    "border-amber-200/80 bg-amber-50/90 text-amber-700 shadow-amber-950/5 ring-amber-500/10",
  ENTREGA_DOCUMENTOS:
    "border-sky-200/80 bg-sky-50/90 text-sky-700 shadow-sky-950/5 ring-sky-500/10",
  EN_PROCESO:
    "border-indigo-200/80 bg-indigo-50/90 text-indigo-700 shadow-indigo-950/5 ring-indigo-500/10",
  PARA_FIRMAR:
    "border-violet-200/80 bg-violet-50/90 text-violet-700 shadow-violet-950/5 ring-violet-500/10",
  FINALIZADO:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 shadow-emerald-950/5 ring-emerald-500/10",
  ATENDIDA:
    "border-emerald-300/80 bg-emerald-100/80 text-emerald-800 shadow-emerald-950/5 ring-emerald-500/10",
  OPERACION_CANCELADA:
    "border-rose-200/80 bg-rose-50/90 text-rose-700 shadow-rose-950/5 ring-rose-500/10",
};

export function Badge({ status, children, className = "", ...props }) {
  const displayText = children || statusLabels[status] || status;

  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center justify-center rounded-xl border px-2.5 text-[11px] font-semibold leading-none",
        "tracking-[0.01em] shadow-sm ring-1 backdrop-blur-sm transition-colors",
        "whitespace-nowrap select-none",
        statusColors[status] ||
          "border-slate-200/80 bg-slate-50/90 text-slate-600 shadow-slate-950/5 ring-slate-500/10",
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}