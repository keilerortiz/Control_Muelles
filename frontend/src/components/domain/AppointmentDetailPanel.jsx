import { getAvailableActions, formatDateTime, actionLabels } from "../../domain/appointmentsConfig";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Table } from "../ui/Table";

const historyColumns = [
  { key: "ChangedAt", label: "Fecha" },
  { key: "PreviousStatus", label: "Anterior" },
  { key: "NewStatus", label: "Nuevo" },
  { key: "ChangedByUserId", label: "Usuario" },
];

function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-800">{value ?? "-"}</p>
    </div>
  );
}

export function AppointmentDetailPanel({
  appointment,
  statusLog = [],
  roles = [],
  onAction,
}) {
  if (!appointment) {
    return (
      <Card title="Detalle de cita">
        <EmptyState
          title="Selecciona una cita"
          description="Aquí verás el estado, historial y acciones permitidas para la operación seleccionada."
        />
      </Card>
    );
  }

  const actions = getAvailableActions(appointment.Status, roles);

  return (
    <div className="space-y-4">
      <Card
        title={`Cita #${appointment.Id}`}
        actions={<Badge status={appointment.Status} />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DetailField label="Cliente" value={appointment.ClientName} />
          <DetailField label="Tipo de operación" value={appointment.OperationTypeName} />
          <DetailField label="Tipo de vehículo" value={appointment.VehicleTypeName} />
          <DetailField label="Placa" value={appointment.VehiclePlate} />
          <DetailField label="Muelle" value={appointment.DockName} />
          <DetailField label="Toneladas estimadas" value={appointment.EstimatedTons} />
          <DetailField label="Programada" value={formatDateTime(appointment.ScheduledAt)} />
          <DetailField label="Llegada" value={formatDateTime(appointment.ArrivalAt)} />
          <DetailField label="Entrega documentos" value={formatDateTime(appointment.DocumentDeliveryAt)} />
          <DetailField label="Inicio proceso" value={formatDateTime(appointment.ProcessStartAt)} />
          <DetailField label="Fin proceso" value={formatDateTime(appointment.ProcessEndAt)} />
          <DetailField label="Checkout" value={formatDateTime(appointment.CheckoutAt)} />
          <DetailField label="Operarios activos" value={appointment.ActiveOperatorCount ?? 0} />
          <DetailField label="Última asignación" value={formatDateTime(appointment.LastAssignedAt)} />
        </div>
      </Card>

      <Card title="Acciones permitidas">
        {actions.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay acciones disponibles para tu rol en este estado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button key={action.key} variant={action.key === "cancel" || action.key === "remove" ? "danger" : "primary"} onClick={() => onAction(action.key)}>
                {actionLabels[action.key]}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card title="Historial de estados">
        <Table
          columns={historyColumns}
          rows={statusLog}
          renderCell={(row, key) => {
            if (key === "ChangedAt") return formatDateTime(row.ChangedAt);
            if (key === "PreviousStatus" || key === "NewStatus") {
              return row[key] ? <Badge status={row[key]}>{row[key]}</Badge> : "-";
            }
            return row[key] || "-";
          }}
        />
      </Card>
    </div>
  );
}
