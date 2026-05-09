// src/components/ui/Badge.jsx
import clsx from "clsx";

const statusColors = {
  AGENDADA: "bg-neutral-100 text-neutral-700",
  EN_PATIO: "bg-warning-50 text-warning-700",
  ENTREGA_DOCUMENTOS: "bg-brand-50 text-brand-700",
  EN_PROCESO: "bg-brand-100 text-brand-700",
  PARA_FIRMAR: "bg-warning-50 text-warning-700",
  FINALIZADO: "bg-success-50 text-success-700",
  ATENDIDA: "bg-success-100 text-success-800",
  OPERACION_CANCELADA: "bg-error-50 text-error-700",
};

export function Badge({ status, children, className = "", ...props }) {
  const displayText = children || status;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusColors[status] || "bg-neutral-100 text-neutral-600",
        className
      )}
      {...props}
    >
      {displayText}
    </span>
  );
}