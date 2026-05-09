import { Card } from "../ui/Card";

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

export function AlertsPanel({ alerts = [] }) {
  return (
    <Card title="Alertas Operativas" padding="sm">
      {alerts.length === 0 ? (
        <div className="py-2 text-center text-sm text-neutral-500">Sin alertas activas</div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li
              key={`${alert.type}-${alert.appointmentId}`}
              className={`rounded-lg border p-3 text-sm ${severityClasses[alert.severity] || severityClasses.LOW}`}
            >
              <p className="font-semibold">
                {alertTypeLabels[alert.type] || alert.type} · Cita #{alert.appointmentId}
              </p>
              <p className="mt-1 text-xs">{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
