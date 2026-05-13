import { Card } from "../ui/Card";
import type { DashboardAlert } from "../../domain/types/dashboard";

const alertTypeLabels = {
  DELAYED: "Retrasada",
  AT_RISK: "En riesgo",
  WAITING_ASSIGNMENT: "Esperando asignación",
  NO_OPERATORS: "Sin operadores",
};

const severityClasses = {
  HIGH: "bg-error-50 text-error-700 border-error-200",
  MEDIUM: "bg-warning-50 text-warning-700 border-warning-200",
  LOW: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

interface AlertsPanelProps {
  alerts?: DashboardAlert[];
}

export function AlertsPanel({ alerts = [] }: AlertsPanelProps) {
  return (
    <Card title="Alertas Operativas" padding="sm">
      {alerts.length === 0 ? (
        <div className="py-2 text-center text-sm text-neutral-500">Sin alertas activas</div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => {
            const severityClass = severityClasses[alert.severity as keyof typeof severityClasses] || severityClasses.LOW;
            const alertLabel = alertTypeLabels[alert.type as keyof typeof alertTypeLabels] || alert.type;
            return (
            <li
              key={`${alert.type}-${alert.appointmentId}`}
              className={`rounded-lg border p-3 text-sm ${severityClass}`}
            >
              <p className="font-semibold">
                {alertLabel} · Cita #{alert.appointmentId}
              </p>
              <p className="mt-1 text-xs">{alert.message}</p>
            </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
