import { Ban, PenSquare, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Table } from "../../components/ui/Table";
import { TablePagination } from "../../components/ui/TablePagination";
import { PAGE_SIZE, type MasterRow } from "./types";

interface BusinessRulesSectionProps {
  ruleRows: MasterRow[];
  pagedRuleRows: MasterRow[];
  rulePage: number;
  onRulePageChange: (page: number) => void;
  onCreateRule: () => void;
  onEditRule: (item: MasterRow) => void;
  onAskDeleteRule: (item: MasterRow) => void;
}

export function BusinessRulesSection({
  ruleRows,
  pagedRuleRows,
  rulePage,
  onRulePageChange,
  onCreateRule,
  onEditRule,
  onAskDeleteRule,
}: BusinessRulesSectionProps) {
  return (
    <details open className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors open:border-neutral-300">
      <summary className="cursor-pointer select-none text-sm font-semibold text-neutral-800 transition-colors hover:text-neutral-900">
        Reglas de negocio
      </summary>
      <Card className="mt-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Cliente + Vehículo + Operación → Estándar</h2>
            <p className="text-sm text-neutral-500">Define el estándar de cada operación.</p>
          </div>
          <Button type="button" onClick={onCreateRule} leftIcon={<Plus />}>Nueva regla</Button>
        </div>
        {ruleRows.length === 0 ? (
          <EmptyState title="Sin reglas" description="No hay tiempos estándar registrados." />
        ) : (
          <div className="space-y-3">
            <Table
              columns={[
                { key: "ClientName", label: "Cliente" },
                { key: "VehicleTypeName", label: "Tipo de vehículo" },
                { key: "OperationTypeName", label: "Tipo de operación" },
                { key: "StandardTimeMinutes", label: "Tiempo estándar (min)" },
                { key: "IsActive", label: "Activo" },
                { key: "actions", label: "Acciones", width: "180px" },
              ]}
              rows={pagedRuleRows}
              renderCell={(typedRow, key) => {
                if (key === "IsActive") return typedRow.IsActive ? "Sí" : "No";
                if (key === "actions") {
                  return (
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => onEditRule(typedRow)} leftIcon={<PenSquare />}>Editar</Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => onAskDeleteRule(typedRow)} leftIcon={<Ban />}>Desactivar</Button>
                    </div>
                  );
                }
                const value = typedRow[key];
                return value === null || value === undefined ? "-" : String(value);
              }}
            />
            <TablePagination page={rulePage} pageSize={PAGE_SIZE} total={ruleRows.length} onPageChange={onRulePageChange} />
          </div>
        )}
      </Card>
    </details>
  );
}
