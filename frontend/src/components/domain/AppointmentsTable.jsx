// src/components/appointments/AppointmentsTable.jsx
import { useMemo } from "react";
import { Badge } from "../ui/Badge";
import { Table } from "../ui/Table";
import { EmptyState } from "../ui/EmptyState";

const columns = [
  { key: "Id", label: "ID" },
  { key: "ClientName", label: "Cliente" },
  { key: "VehiclePlate", label: "Placa" },
  { key: "DockName", label: "Muelle" },
  { key: "Status", label: "Estado" },
  { key: "ScheduledAt", label: "Programada" },
];

export function AppointmentsTable({ rows = [] }) {
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
      renderCell={(row, key) => {
        if (key === "Status") return <Badge status={row.Status} />;
        if (key === "ScheduledAt") return new Date(row.ScheduledAt).toLocaleString();
        return row[key] || "-";
      }}
    />
  );
}