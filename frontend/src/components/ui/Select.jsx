export function Select({ label, error, children, ...props }) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-neutral-700">
      {label ? <span>{label}</span> : null}
      <select className="rounded-lg border border-neutral-200 bg-white px-3 py-2" {...props}>
        {children}
      </select>
      {error ? <span className="text-xs text-error-600">{error}</span> : null}
    </label>
  );
}
