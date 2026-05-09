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
  // Ícono por defecto (carpeta vacía)
  const DefaultIcon = () => (
    <FolderOpen className="mx-auto h-12 w-12 text-neutral-400" strokeWidth={1.5} />
  );

  const containerClasses = {
    default: "rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center",
    compact: "rounded-lg border border-dashed border-neutral-200 bg-white/50 p-4 text-center",
    card: "rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {icon ? icon : <DefaultIcon />}
      <h3 className="mt-4 text-base font-semibold text-neutral-800">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
      {actionText && onAction && (
        <div className="mt-4">
          <Button onClick={onAction} variant="outline" size="sm">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
