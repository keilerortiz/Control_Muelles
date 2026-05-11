export function Tabs({ tabs = [], value, onChange, className = "" }) {
  return (
    <div className={`border-b border-neutral-200 ${className}`}>
      <div className="flex flex-wrap gap-4">
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={`inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
              }`}
            >
              {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} /> : null}
              <span>{tab.label}</span>
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
