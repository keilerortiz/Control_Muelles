// src/components/appointments/AppointmentsTable.jsx
import { useMemo } from "react";
import { formatDateTime } from "../../domain/appointmentsConfig";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Table } from "../ui/Table";

const columns = [
  { key: "Id", label: "ID", width: "72px" },
  { key: "ClientName", label: "Cliente" },
  { key: "VehiclePlate", label: "Placa" },
  { key: "DockName", label: "Muelle" },
  { key: "Status", label: "Estado" },
  { key: "ScheduledAt", label: "Programada" },
  { key: "ActiveOperatorCount", label: "Operarios" },
];

export function AppointmentsTable({
  rows = [],
  selectedAppointmentId = null,
  onSelect,
}) {
  const normalizedRows = useMemo(() => rows.slice(0, 200), [rows]);

  if (normalizedRows.length === 0) {
    return (
      <EmptyState
        title="Sin citas"
        description="No hay citas programadas en este momento."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 md:hidden">
        {normalizedRows.map((row) => {
          const isSelected = row.Id === selectedAppointmentId;
          return (
            <button
              key={row.Id}
              type="button"
              onClick={onSelect ? () => onSelect(row) : undefined}
              className={`w-full rounded-lg border p-3 text-left transition ${
                isSelected
                  ? "border-brand-300 bg-brand-50/60"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-800">#{row.Id}</p>
                <Badge status={row.Status} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                <p><span className="font-medium">Cliente:</span> {row.ClientName || "-"}</p>
                <p><span className="font-medium">Placa:</span> {row.VehiclePlate || "-"}</p>
                <p><span className="font-medium">Muelle:</span> {row.DockName || "-"}</p>
                <p><span className="font-medium">Operarios:</span> {row.ActiveOperatorCount ?? 0}</p>
              </div>
              <p className="mt-2 text-xs text-neutral-600">
                <span className="font-medium">Programada:</span> {formatDateTime(row.ScheduledAt)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="hidden md:block">
        <Table
          columns={columns}
          rows={normalizedRows}
          onRowClick={onSelect ? (row) => onSelect(row) : undefined}
          getRowClassName={(row) =>
            row.Id === selectedAppointmentId ? "bg-brand-50/60" : ""
          }
          renderCell={(row, key) => {
            if (key === "Status") return <Badge status={row.Status} />;
            if (key === "ScheduledAt") return formatDateTime(row.ScheduledAt);
            if (key === "ActiveOperatorCount") return row.ActiveOperatorCount ?? 0;
            return row[key] || "-";
          }}
        />
      </div>
    </div>
  );
}
