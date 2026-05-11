import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDateRangeStore } from "../../store/dateRangeStore";
import { Button } from "./Button";
import { Input } from "./Input";
import { formatDateRangeLabel } from "../../utils/dateRange";

const presets = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "last7days", label: "Últimos 7 días" },
  { key: "thisMonth", label: "Este mes" },
];

export function DateRangePicker() {
  const { range, setPreset, setCustomRange, resetToToday } = useDateRangeStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ startDate: range.startDate, endDate: range.endDate });
  const containerRef = useRef(null);

  useEffect(() => {
    setDraft({ startDate: range.startDate, endDate: range.endDate });
  }, [range.endDate, range.startDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const label = useMemo(() => formatDateRangeLabel(range), [range]);

  const applyCustomRange = () => {
    setCustomRange(draft);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        className="min-w-[180px] justify-between"
        leftIcon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
        rightIcon={<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[320px] rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant={range.preset === preset.key ? "primary" : "secondary"}
                size="sm"
                className="w-full"
                onClick={() => {
                  setPreset(preset.key);
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <Input
              label="Desde"
              type="date"
              value={draft.startDate}
              onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
            />
            <Input
              label="Hasta"
              type="date"
              value={draft.endDate}
              min={draft.startDate}
              onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetToToday}>
              Restablecer
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
              <Button type="button" size="sm" onClick={applyCustomRange}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
