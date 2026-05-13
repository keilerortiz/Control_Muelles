import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Dropdown } from "../../ui/Dropdown";

interface OperatorItem {
  Id?: number;
  Name?: string;
  ActiveAssignments?: number;
  MaxConcurrentOperations?: number;
}

interface OperatorSelectionProps {
  checkedIds: number[];
  operators: OperatorItem[];
  title: string;
  toggleOperator: (id: number | undefined) => void;
}

export function OperatorSelection({ checkedIds, operators, title, toggleOperator }: OperatorSelectionProps) {
  const [search, setSearch] = useState("");

  const filteredOperators = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return operators;
    return operators.filter((operator) => operator.Name?.toLowerCase().includes(term));
  }, [operators, search]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      <Dropdown
        className="w-[360px] max-w-[calc(100vw-48px)] p-2"
        trigger={(
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 shadow-sm hover:border-neutral-400"
          >
            <span className="truncate text-left">
              {checkedIds.length > 0 ? `${checkedIds.length} seleccionados` : `Seleccionar ${title.toLowerCase()}`}
            </span>
            <ChevronDown className="h-4 w-4 text-neutral-500" />
          </button>
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2 py-1.5">
            <Search className="h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar operario..."
              className="w-full border-0 bg-transparent text-sm text-neutral-700 outline-none"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredOperators.length === 0 ? (
              <p className="px-2 py-2 text-sm text-neutral-500">Sin candidatos disponibles.</p>
            ) : (
              filteredOperators.map((operator) => {
                if (!operator.Id) {
                  return null;
                }
                const checked = checkedIds.includes(operator.Id);
                return (
                  <button
                    key={operator.Id}
                    type="button"
                    onClick={() => toggleOperator(operator.Id)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-300 bg-white text-transparent"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span>
                      {operator.Name}
                      <span className="block text-xs text-neutral-500">
                        Activas: {operator.ActiveAssignments} / Máximo: {operator.MaxConcurrentOperations}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
