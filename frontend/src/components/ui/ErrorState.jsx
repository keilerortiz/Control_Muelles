// src/components/ui/ErrorState.jsx
import { Button } from "./Button";
import { AlertCircle } from "lucide-react";

export function ErrorState({
  title = "Algo salió mal",
  message = "No fue posible completar la operación. Por favor, intenta nuevamente.",
  icon,
  onRetry,
  retryText = "Reintentar",
  className = "",
  variant = "default", // 'default', 'card', 'minimal'
}) {
  // Ícono por defecto
  const DefaultIcon = () => (
    <AlertCircle className="mx-auto h-12 w-12 text-error-500" strokeWidth={1.5} />
  );

  const containerClasses = {
    default: "rounded-lg border border-error-200 bg-error-50 p-6 text-center",
    card: "rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm",
    minimal: "p-4 text-center",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {icon ? icon : <DefaultIcon />}
      <h3 className="mt-4 text-base font-semibold text-neutral-800">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry} variant="outline" size="sm">
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}
