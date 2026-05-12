import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Dropdown } from "../../ui/Dropdown";

export function NonComplianceReasonSelect({ label, placeholder, options, selectedValues, onToggle, required = false }) {
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, search]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </p>
      <Dropdown
        className="w-[420px] max-w-[calc(100vw-48px)] p-2"
        trigger={(
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-800 shadow-sm hover:border-neutral-400"
          >
            <span className="truncate text-left">
              {selectedValues.length > 0 ? `${selectedValues.length} seleccionadas` : placeholder}
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
              placeholder="Buscar causal..."
              className="w-full border-0 bg-transparent text-sm text-neutral-700 outline-none"
            />
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-slate-500">No hay resultados para la búsqueda.</p>
            ) : (
              filteredOptions.map((option) => {
                const checked = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onToggle(option)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 bg-white text-transparent"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                    <span>{option}</span>
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
