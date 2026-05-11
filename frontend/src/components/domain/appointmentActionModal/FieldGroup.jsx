export function FieldGroup({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-500" />}
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}
