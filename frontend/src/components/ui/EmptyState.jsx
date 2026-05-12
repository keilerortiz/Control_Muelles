// src/components/ui/EmptyState.jsx
import { Button } from "./Button";
import { FolderOpen } from "lucide-react";

export function EmptyState({
  title = "Sin datos",
  description = "No hay información para mostrar en este momento.",
  icon,
  actionText,
  onAction,
  variant = "default", // 'default', 'compact', 'card'
  className = "",
}) {
  // Ícono por defecto
  const DefaultIcon = () => (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm shadow-neutral-900/5">
      <FolderOpen className="h-7 w-7 text-neutral-400" strokeWidth={1.75} />
    </div>
  );

  const containerClasses = {
    default:
      "rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm shadow-neutral-900/5",
    compact:
      "rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm shadow-neutral-900/5",
    card:
      "rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-md shadow-neutral-900/10",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {icon ? icon : <DefaultIcon />}

      <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-neutral-900">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-neutral-500">
        {description}
      </p>

      {actionText && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} variant="outline" size="sm">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}