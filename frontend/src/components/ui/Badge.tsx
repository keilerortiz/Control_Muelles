// src/components/ui/Badge.jsx
import clsx from "clsx";
import { statusLabels } from "../../domain/appointmentsConfig";
import type { HTMLAttributes, ReactNode } from "react";
import type { AppointmentStatus } from "../../domain/types/appointments";

const statusColors = {
  AGENDADA:
    "border-brand-200/70 bg-brand-50/80 text-brand-700 shadow-brand-950/5 ring-brand-500/10",
  EN_PATIO:
    "border-warning-200/80 bg-warning-50/90 text-warning-700 shadow-warning-950/5 ring-warning-500/10",
  ENTREGA_DOCUMENTOS:
    "border-brand-200/80 bg-brand-50/90 text-brand-700 shadow-brand-950/5 ring-brand-500/10",
  EN_PROCESO:
    "border-brand-200/80 bg-brand-50/90 text-brand-700 shadow-brand-950/5 ring-brand-500/10",
  PARA_FIRMAR:
    "border-brand-200/80 bg-brand-50/90 text-brand-700 shadow-brand-950/5 ring-brand-500/10",
  FINALIZADO:
    "border-success-200/80 bg-success-50/90 text-success-700 shadow-success-950/5 ring-success-500/10",
  ATENDIDA:
    "border-success-300/80 bg-success-100/80 text-success-800 shadow-success-950/5 ring-success-500/10",
  OPERACION_CANCELADA:
    "border-error-200/80 bg-error-50/90 text-error-700 shadow-error-950/5 ring-error-500/10",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: AppointmentStatus;
  children?: ReactNode;
}

export function Badge({ status, children, className = "", ...props }: BadgeProps) {
  const normalizedStatus = status ?? "";
  const statusLabel = statusLabels[normalizedStatus as keyof typeof statusLabels];
  const statusTone = statusColors[normalizedStatus as keyof typeof statusColors];
  const displayText = children || statusLabel || normalizedStatus;

  return (
    <span
      className={clsx(
        "inline-flex h-7 items-center justify-center rounded-xl border px-2.5 text-[11px] font-semibold leading-none",
        "tracking-[0.01em] shadow-sm ring-1 backdrop-blur-sm transition-colors",
        "whitespace-nowrap select-none",
        statusTone ||
          "border-neutral-200/80 bg-neutral-50/90 text-neutral-600 shadow-neutral-950/5 ring-neutral-500/10",
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}
