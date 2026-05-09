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
        description="No hay citas programadas para mostrar en este momento."
      />
    );
  }

  return (
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
  );
}
