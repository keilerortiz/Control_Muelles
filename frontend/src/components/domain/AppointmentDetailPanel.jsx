// src/components/appointments/AppointmentDetailPanel.jsx
import {
  Calendar,
  User,
  Truck,
  Warehouse,
  Clock,
  FileCheck,
  Users,
  Tag,
  Hash,
  Weight,
} from "lucide-react";

import { getAvailableActions, formatDateTime, actionLabels } from "../../domain/appointmentsConfig";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Table } from "../ui/Table";

const historyColumns = [
  { key: "ChangedAt", label: "Fecha" },
  { key: "PreviousStatus", label: "Anterior" },
  { key: "NewStatus", label: "Estado nuevo" },
  { key: "ChangedByUserId", label: "Usuario" },
];

function DetailField({ label, value, icon: Icon }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <p className="text-sm text-slate-800">{value ?? "-"}</p>
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
          <DetailField label="Cliente" value={appointment.ClientName} icon={User} />
          <DetailField label="Tipo de operación" value={appointment.OperationTypeName} icon={Tag} />
          <DetailField label="Tipo de vehículo" value={appointment.VehicleTypeName} icon={Truck} />
          <DetailField label="Conductor" value={appointment.DriverName} icon={User} />
          <DetailField label="Cédula conductor" value={appointment.DriverDocument} icon={Hash} />
          <DetailField label="Placa" value={appointment.VehiclePlate} icon={Hash} />
          <DetailField label="Muelle" value={appointment.DockName} icon={Warehouse} />
          <DetailField label="Toneladas movidas" value={appointment.MovedTons} icon={Weight} />
          <DetailField label="Programada" value={formatDateTime(appointment.ScheduledAt)} icon={Calendar} />
          <DetailField label="Llegada" value={formatDateTime(appointment.ArrivalAt)} icon={Clock} />
          <DetailField label="Entrega documentos" value={formatDateTime(appointment.DocumentDeliveryAt)} icon={FileCheck} />
          <DetailField label="Inicio proceso" value={formatDateTime(appointment.ProcessStartAt)} icon={Clock} />
          <DetailField label="Fin proceso" value={formatDateTime(appointment.ProcessEndAt)} icon={Clock} />
          <DetailField label="Salida" value={formatDateTime(appointment.CheckoutAt)} icon={Truck} />
          <DetailField label="Operarios activos" value={appointment.ActiveOperatorCount ?? 0} icon={Users} />
          <DetailField label="Última asignación" value={formatDateTime(appointment.LastAssignedAt)} icon={Clock} />
          <DetailField label="Obs" value={appointment.NonComplianceComment} icon={FileCheck} />
        </div>
      </Card>

      <Card title="Acciones permitidas">
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500">No hay acciones disponibles para tu rol en este estado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.key}
                variant={action.key === "cancel" || action.key === "remove" ? "danger" : "primary"}
                onClick={() => onAction(action.key)}
              >
                {actionLabels[action.key]}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card title="Historial de estados">
        <div className="space-y-3">
          <div className="space-y-2 md:hidden">
            {statusLog.length === 0 ? (
              <p className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-500">
                Sin historial de estados.
              </p>
            ) : (
              statusLog.map((row, idx) => (
                <div key={row.Id || idx} className="rounded-lg border border-neutral-200 bg-white p-3">
                  <p className="text-xs text-neutral-500">{formatDateTime(row.ChangedAt)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {row.PreviousStatus ? <Badge status={row.PreviousStatus}>{row.PreviousStatus}</Badge> : <span className="text-xs text-neutral-500">-</span>}
                    <span className="text-xs text-neutral-400">→</span>
                    {row.NewStatus ? <Badge status={row.NewStatus}>{row.NewStatus}</Badge> : <span className="text-xs text-neutral-500">-</span>}
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">Usuario: {row.ChangedByUserId || "-"}</p>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block">
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
          </div>
        </div>
      </Card>
    </div>
  );
}
