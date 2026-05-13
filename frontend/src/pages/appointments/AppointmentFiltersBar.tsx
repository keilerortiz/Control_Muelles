import { FilterX } from "lucide-react";

import { appointmentStatuses, statusLabels, actionLabels } from "../../domain/appointmentsConfig";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import type { AppointmentFilterBarProps } from "./types";

export function AppointmentFiltersBar({
  search,
  status,
  clientFilter,
  operationFilter,
  canCreate,
  clientOptions,
  operationOptions,
  onSearchChange,
  onSearchSubmit,
  onStatusChange,
  onClientFilterChange,
  onOperationFilterChange,
  onResetFilters,
  onCreate,
}: AppointmentFilterBarProps) {
  return (
    <Card padding="sm" className="rounded-xl border-neutral-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <Input
          aria-label="Buscar por cliente o placa"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSearchSubmit();
          }}
          placeholder="Buscar por cliente o placa"
          className="min-h-10 min-w-[220px] flex-1 rounded-lg border-neutral-200 bg-white lg:min-w-[280px]"
        />
        <Select aria-label="Estado" value={status} onChange={(event) => onStatusChange(event.target.value)} className="min-h-10 min-w-[130px] rounded-lg border-neutral-200 bg-white lg:w-[150px] lg:min-w-0 lg:flex-none">
          <option value="">Todos</option>
          {appointmentStatuses.map((statusItem) => (
            <option key={statusItem} value={statusItem}>
              {statusLabels[statusItem] || statusItem}
            </option>
          ))}
        </Select>
        <Select aria-label="Cliente" value={clientFilter} onChange={(event) => onClientFilterChange(event.target.value)} className="min-h-10 min-w-[170px] rounded-lg border-neutral-200 bg-white lg:w-[210px] lg:min-w-0 lg:flex-none">
          <option value="">Cliente: Todos</option>
          {clientOptions.map((clientName) => (
            <option key={clientName} value={clientName}>{clientName}</option>
          ))}
        </Select>
        <Select aria-label="Operación" value={operationFilter} onChange={(event) => onOperationFilterChange(event.target.value)} className="min-h-10 min-w-[150px] rounded-lg border-neutral-200 bg-white lg:w-[170px] lg:min-w-0 lg:flex-none">
          <option value="">Operación: Todas</option>
          {operationOptions.map((operationName) => (
            <option key={operationName} value={operationName}>{operationName}</option>
          ))}
        </Select>
        <Button type="button" variant="secondary" className="min-h-10 justify-center gap-2 rounded-lg border-neutral-200 bg-white px-3 text-neutral-600 shadow-sm hover:bg-neutral-50 lg:flex-none" onClick={onResetFilters}>
          <FilterX className="h-4 w-4" strokeWidth={1.75} />
        </Button>
        {canCreate ? (
          <Button className="min-h-10 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 lg:flex-none" onClick={onCreate}>
            {actionLabels.create}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
