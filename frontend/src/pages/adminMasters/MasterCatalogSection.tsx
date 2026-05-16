import { PenSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Table } from "../../components/ui/Table";
import { TablePagination } from "../../components/ui/TablePagination";
import { TabPanel, Tabs } from "../../components/ui/Tabs";
import { createColumns, tabDefinitions } from "./config";
import type { MasterRow, TabKey } from "./types";
import { PAGE_SIZE } from "./types";

interface MasterCatalogSectionProps {
  activeTab: TabKey;
  rows: MasterRow[];
  pagedRows: MasterRow[];
  masterPage: number;
  onMasterPageChange: (page: number) => void;
  onActiveTabChange: (tab: TabKey) => void;
  onCreateMaster: () => void;
  onEditMaster: (item: MasterRow) => void;
  onAskDeleteMaster: (item: MasterRow) => void;
}

export function MasterCatalogSection({
  activeTab,
  rows,
  pagedRows,
  masterPage,
  onMasterPageChange,
  onActiveTabChange,
  onCreateMaster,
  onEditMaster,
  onAskDeleteMaster,
}: MasterCatalogSectionProps) {
  const columns = createColumns(activeTab);

  return (
    <details open className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors open:border-neutral-300">
      <summary className="cursor-pointer select-none text-sm font-semibold text-neutral-800 transition-colors hover:text-neutral-900">
        Gestión de maestros
      </summary>
      <div className="mt-4">
        <Tabs tabs={tabDefinitions} value={activeTab} onChange={(value) => onActiveTabChange(value as TabKey)} />
        {tabDefinitions.map((tab) => (
          <TabPanel key={tab.value} value={tab.value} currentValue={activeTab} className="pt-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-800">{tab.label}</h3>
                <p className="text-sm text-neutral-500">
                  {tab.value === "nonComplianceReasons"
                    ? "Gestión administrativa de causales OTC y OTS."
                    : "Gestión administrativa de catálogo."}
                </p>
              </div>
              <Button type="button" onClick={onCreateMaster} leftIcon={<Plus />}>Nuevo registro</Button>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Sin registros" description="No hay información cargada para esta pestaña." />
            ) : (
              <div className="space-y-3">
                <Table
                  columns={columns}
                  rows={pagedRows}
                  renderCell={(typedRow, key) => {
                    if (key === "IsActive") return typedRow.IsActive ? "Sí" : "No";
                    if (key === "roleCodes") {
                      const roleCodes = typedRow.roleCodes;
                      return Array.isArray(roleCodes) ? roleCodes.map((role) => String(role)).join(", ") : "-";
                    }
                    if (key === "actions") {
                      return (
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => onEditMaster(typedRow)} leftIcon={<PenSquare />}>Editar</Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => onAskDeleteMaster(typedRow)} leftIcon={<Trash2 />}>Eliminar</Button>
                        </div>
                      );
                    }
                    const value = typedRow[key];
                    return value === null || value === undefined ? "-" : String(value);
                  }}
                />
                <TablePagination page={masterPage} pageSize={PAGE_SIZE} total={rows.length} onPageChange={onMasterPageChange} />
              </div>
            )}
          </TabPanel>
        ))}
      </div>
    </details>
  );
}
