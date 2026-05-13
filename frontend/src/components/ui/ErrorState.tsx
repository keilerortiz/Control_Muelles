// src/components/ui/ErrorState.jsx
import { Button } from "./Button";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: "default" | "card" | "minimal";
}

export function ErrorState({
  title = "Algo salió mal",
  message = "No fue posible completar la operación. Por favor, intenta nuevamente.",
  icon,
  onRetry,
  retryText = "Reintentar",
  className = "",
  variant = "default", // 'default', 'card', 'minimal'
}: ErrorStateProps) {
  // Ícono por defecto
  const DefaultIcon = () => (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-error-200 bg-error-50 shadow-sm shadow-neutral-900/5">
      <AlertCircle
        className="h-7 w-7 text-error-500"
        strokeWidth={1.75}
      />
    </div>
  );

  const containerClasses = {
    default:
      "rounded-2xl border border-error-200 bg-error-50 p-5 text-center shadow-sm shadow-neutral-900/5",
    card:
      "rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-md shadow-neutral-900/10",
    minimal:
      "rounded-2xl p-4 text-center",
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {icon ? icon : <DefaultIcon />}

      <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-neutral-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-600">
        {message}
      </p>

      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="outline" size="sm">
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}
