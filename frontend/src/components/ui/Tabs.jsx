export function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-1 shadow-sm shadow-neutral-900/5 ${className}`}>
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm shadow-neutral-900/5 ring-1 ring-brand-100"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
            >
              {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} /> : null}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ value, currentValue, children, className = "" }) {
  if (value !== currentValue) {
    return null;
  }

  return <div className={className}>{children}</div>;
}