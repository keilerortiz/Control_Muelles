// src/components/ui/OperatorSelection.jsx
export function OperatorSelection({ checkedIds, operators, title, toggleOperator }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
        {operators.length === 0 ? (
          <p className="text-sm text-slate-500">Sin candidatos disponibles.</p>
        ) : (
          operators.map((operator) => {
            const checked = checkedIds.includes(operator.Id);
            return (
              <label
                key={operator.Id}
                className="flex cursor-pointer items-start gap-3 rounded-md p-1 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOperator(operator.Id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-0"
                />
                <span>
                  {operator.Name}
                  <span className="block text-xs text-slate-500">
                    Activas: {operator.ActiveAssignments} / Máximo: {operator.MaxConcurrentOperations}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}