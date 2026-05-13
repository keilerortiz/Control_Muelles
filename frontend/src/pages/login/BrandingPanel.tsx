import { platformHighlights } from "./config";

export function BrandingPanel() {
  return (
    <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-50 via-white to-neutral-50 px-12 py-8 lg:flex">
      <div className="flex-1">
        <div className="mt-8 max-w-2xl">
          <p className="mb-5 inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Muelles V4</p>
          <h1 className="text-4xl font-black tracking-tight text-neutral-800 lg:text-5xl">Gestión en tiempo real de operación logística</h1>
          <div className="mt-10 grid gap-4">
            {platformHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-success-100 text-sm font-bold text-success-700">✓</span>
                <span className="text-sm font-medium text-neutral-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-neutral-800">24/7</p>
          <p className="mt-1 text-xs text-neutral-500">Monitoreo de operación</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-neutral-800">RBAC</p>
          <p className="mt-1 text-xs text-neutral-500">Acceso por usuario/rol</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-neutral-800">SQL</p>
          <p className="mt-1 text-xs text-neutral-500">Datos centralizados</p>
        </div>
      </div>
    </section>
  );
}
