import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDateRangeStore } from "../../store/dateRangeStore";
import { Button } from "./Button";
import { Input } from "./Input";
import { formatDateRangeLabel } from "../../utils/dateRange";
import type { DateRangeValue } from "../../utils/dateRange";

const presets = [
  { key: "today", label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "last7days", label: "Últimos 7 días" },
  { key: "thisMonth", label: "Este mes" },
];

export function DateRangePicker({ compact = false }: { compact?: boolean }) {
  const { range, setPreset, setCustomRange, resetToToday } = useDateRangeStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>({
    startDate: range.startDate,
    endDate: range.endDate,
    preset: range.preset,
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft({ startDate: range.startDate, endDate: range.endDate, preset: range.preset });
  }, [range.endDate, range.startDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        className={
          compact
            ? "h-9 px-2.5"
            : "h-9 min-w-[190px] justify-between px-3.5"
        }
        leftIcon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
        rightIcon={
          compact ? null : (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
              strokeWidth={1.75}
            />
          )
        }
        onClick={() => setOpen((current) => !current)}
        aria-label="Rango de fechas"
        title="Rango de fechas"
      >
        {compact ? null : label}
      </Button>

      {open && (
        <div
          className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 ${
            compact
              ? "fixed left-2 right-2 top-16 z-50"
              : "absolute right-0 top-full z-30 mt-2 w-[min(340px,calc(100vw-1rem))]"
          }`}
        >
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              Rango de fechas
            </p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {label}
            </p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  variant={range.preset === preset.key ? "primary" : "secondary"}
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setPreset(preset.key as DateRangeValue["preset"]);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <Input
                label="Desde"
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />

              <Input
                label="Hasta"
                type="date"
                value={draft.endDate}
                min={draft.startDate}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToToday}
              >
                Restablecer
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </Button>

                <Button type="button" size="sm" onClick={applyCustomRange}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
