import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

export function AlertsPanel({ appointments = [] }) {
  const riskItems = appointments.filter((item) => item.Status === "EN_PROCESO").slice(0, 5);

  return (
    <Card title="Alertas Operativas" padding="sm">
      {riskItems.length === 0 ? (
        <div className="py-2 text-center text-sm text-neutral-500">
          Sin alertas activas
        </div>
      ) : (
        <ul className="space-y-2">
          {riskItems.map((item) => (
            <li
              key={item.Id}
              className="flex items-center justify-between rounded-lg bg-warning-50 p-3 text-sm"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-warning-900">
                  Cita #{item.Id}
                </span>
                <span className="text-xs text-warning-700">
                  {item.ClientName} - {item.VehiclePlate}
                </span>
              </div>
              <Badge status={item.Status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}