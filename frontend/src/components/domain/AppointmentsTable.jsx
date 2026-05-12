// src/components/appointments/AppointmentsTable.jsx
import { memo, useMemo } from "react";
import { formatDateTime } from "../../domain/appointmentsConfig";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Table } from "../ui/Table";
import { TablePagination } from "../ui/TablePagination";

const columns = [
  { key: "ScheduledAt", label: "Programada" },
  { key: "ClientName", label: "Cliente" },
  { key: "OperationTypeName", label: "Tipo de operación" },
  { key: "VehicleTypeName", label: "Tipo de vehículo" },
  { key: "VehiclePlate", label: "Placa" },
  { key: "Status", label: "Estado" },
];

export const AppointmentsTable = memo(function AppointmentsTable({
  rows = [],
  selectedAppointmentId = null,
  onSelect,
  getRowActions,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  maxVisibleRows = 14,
  fullHeight = false,
}) {
  const normalizedRows = useMemo(() => rows.slice(0, 200), [rows]);
  const effectiveTotal = total || normalizedRows.length;
  const hasActions = typeof getRowActions === "function";
  const tableColumns = useMemo(
    () => (hasActions ? [...columns, { key: "Actions", label: "Acciones", width: "132px" }] : columns),
    [hasActions],
  );

  if (normalizedRows.length === 0) {
    return (
      <EmptyState
        title="Sin citas"
        description="No hay citas programadas."
      />
    );
  }

  return (
    <div className={fullHeight ? "flex h-full min-h-0 flex-col overflow-hidden" : "space"}>
      <div className="space-y-2 md:hidden">
        {normalizedRows.map((row) => {
          const isSelected = row.Id === selectedAppointmentId;
          return (
            <div
              key={row.Id}
              role="button"
              tabIndex={0}
              onClick={onSelect ? () => onSelect(row) : undefined}
              onKeyDown={(event) => {
                if (!onSelect) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(row);
                }
              }}
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
                <p><span className="font-medium">Operación:</span> {row.OperationTypeName || row.OperationType || "-"}</p>
                <p><span className="font-medium">Vehículo:</span> {row.VehicleTypeName || row.VehicleType || "-"}</p>
                <p><span className="font-medium">Placa:</span> {row.VehiclePlate || "-"}</p>
                <p><span className="font-medium">Muelle:</span> {row.DockName || "-"}</p>
                <p><span className="font-medium">Operarios:</span> {row.ActiveOperatorCount ?? 0}</p>
              </div>
              <p className="mt-2 text-xs text-neutral-600">
                <span className="font-medium">Programada:</span> {formatDateTime(row.ScheduledAt)}
              </p>
              {hasActions && isSelected ? (
                <div className="mt-3 flex items-center gap-2">
                  {(getRowActions(row) || []).map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        action.onClick?.(row);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                      title={action.label}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={fullHeight ? "hidden min-h-0 flex-1 overflow-hidden rounded-lg border border-neutral-200 bg-white md:flex md:flex-col" : "hidden md:block"}>
        <Table
          columns={tableColumns}
          rows={normalizedRows}
          virtualized={!fullHeight}
          maxVisibleRows={maxVisibleRows}
          onRowClick={onSelect ? (row) => onSelect(row) : undefined}
          getRowClassName={(row) =>
            row.Id === selectedAppointmentId ? "bg-brand-50/60" : ""
          }
          className={
            fullHeight
              ? "h-full flex-1 overflow-y-auto rounded-none border-0 [&_th]:py-1.5 [&_th]:text-[11px] [&_td]:py-1.5 [&_td]:text-[12px] [&_button]:h-7 [&_button]:w-7"
              : "[&_th]:py-1.5 [&_th]:text-[11px] [&_td]:py-1.5 [&_td]:text-[12px] [&_button]:h-7 [&_button]:w-7"
          }
          renderCell={(row, key) => {
            if (key === "Status") return <Badge status={row.Status} />;
            if (key === "ScheduledAt") return formatDateTime(row.ScheduledAt);
            if (key === "OperationTypeName") return row.OperationTypeName || row.OperationType || "-";
            if (key === "VehicleTypeName") return row.VehicleTypeName || row.VehicleType || "-";
            if (key === "Actions" && hasActions) {
              if (row.Id !== selectedAppointmentId) {
                return null;
              }
              return (
                <div className="flex items-center gap-2">
                  {(getRowActions(row) || []).map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        action.onClick?.(row);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                      title={action.label}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              );
            }
            if (key === "ActiveOperatorCount") return row.ActiveOperatorCount ?? 0;
            return row[key] || "-";
          }}
        />
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={effectiveTotal}
          onPageChange={onPageChange}
          embedded
        />
      </div>
      <div className={fullHeight ? "hidden" : ""}>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={effectiveTotal}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
});
