import { Building2, Flag, Package, UserRound, UsersRound } from "lucide-react";

import { Badge } from "../../ui/Badge";
import { DockTimeline } from "./DockTimeline";
import { DockTimer } from "./DockTimer";

function parseApiDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;

  const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHourMinute(date) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function splitOperatorNames(csvValue) {
  if (!csvValue || typeof csvValue !== "string") return [];
  return csvValue
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function normalizeDockLabel(appointment) {
  if (appointment?.DockName) return appointment.DockName.toUpperCase();
  if (appointment?.DockId) return `MUELLE ${String(appointment.DockId).padStart(2, "0")}`;
  return "MUELLE SIN ASIGNAR";
}

export function DockCard({ appointment, appointmentDetail, nowMs }) {
  const standardMinutes = Number(appointment?.StandardTimeMinutes) || 0;
  const processStartDate = parseApiDate(appointment?.ProcessStartAt);
  const processEndDate = parseApiDate(appointment?.ProcessEndAt);
  const operationStartDate =
    processStartDate ||
    parseApiDate(appointment?.DocumentDeliveryAt) ||
    parseApiDate(appointment?.ArrivalAt);

  const effectiveEndMs = processEndDate?.getTime() || nowMs;
  const elapsedMinutes = processStartDate
    ? Math.max((effectiveEndMs - processStartDate.getTime()) / 60000, 0)
    : 0;
  const elapsedSeconds = processStartDate
    ? Math.max((effectiveEndMs - processStartDate.getTime()) / 1000, 0)
    : 0;
  const compliancePercent = standardMinutes > 0 ? (elapsedMinutes / standardMinutes) * 100 : 0;
  const expectedEndDate = processStartDate && standardMinutes > 0
    ? new Date(processStartDate.getTime() + standardMinutes * 60000)
    : null;

  const seniorOperators = splitOperatorNames(appointmentDetail?.SeniorOperators);
  const juniorOperators = splitOperatorNames(appointmentDetail?.JuniorOperators);

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors ${
        compliancePercent > 100
          ? "border-error-400 shadow-[0_0_0_1px_rgba(248,113,113,0.35),0_0_24px_rgba(220,38,38,0.40)] ring-2 ring-error-300"
          : "border-neutral-200 shadow-neutral-900/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold tracking-[-0.01em] text-neutral-900">
          {normalizeDockLabel(appointment)}
        </h3>
        <Badge status={appointment?.Status} />
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-2">
          <Building2 className="mt-0.5 h-4 w-4 text-brand-600" strokeWidth={1.8} />
          <p className="text-neutral-700">
            <span className="font-semibold text-neutral-600">Cliente:</span>{" "}
            <span className="font-semibold text-neutral-900">{appointment?.ClientName || "-"}</span>
          </p>
        </div>

        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-2">
          <Package className="mt-0.5 h-4 w-4 text-brand-600" strokeWidth={1.8} />
          <p className="text-neutral-700">
            <span className="font-semibold text-neutral-600">Tipo de operación:</span>{" "}
            <span className="font-semibold text-neutral-900">{appointment?.OperationTypeName || "-"}</span>
          </p>
        </div>

        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-2">
          <Flag className="mt-0.5 h-4 w-4 text-brand-600" strokeWidth={1.8} />
          <p className="text-neutral-700">
            <span className="font-semibold text-neutral-600">Hora de inicio:</span>{" "}
            <span className="font-semibold text-neutral-900">{formatHourMinute(operationStartDate)}</span>
          </p>
        </div>

        <div className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-2">
          <Flag className="mt-0.5 h-4 w-4 text-brand-600" strokeWidth={1.8} />
          <p className="text-neutral-700">
            <span className="font-semibold text-neutral-600">Hora de finalización:</span>{" "}
            <span className="font-semibold text-neutral-900">
              {expectedEndDate
                ? `${formatHourMinute(expectedEndDate)}`
                : "-"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-neutral-200 pt-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-700">
              <UserRound className="h-3.5 w-3.5" strokeWidth={1.8} />
              Senior(s)
            </p>
            {seniorOperators.length > 0 ? (
              <ul className="space-y-0.5 text-xs text-neutral-700">
                {seniorOperators.map((operator) => (
                  <li key={`${appointment?.Id}-senior-${operator}`} className="truncate">
                    • {operator}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-medium text-warning-700">Sin senior asignado</p>
            )}
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-700">
              <UsersRound className="h-3.5 w-3.5" strokeWidth={1.8} />
              Junior(s)
            </p>
            {juniorOperators.length > 0 ? (
              <ul className="space-y-0.5 text-xs text-neutral-700">
                {juniorOperators.map((operator) => (
                  <li key={`${appointment?.Id}-junior-${operator}`} className="truncate">
                    • {operator}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-medium text-warning-700">Sin junior asignado</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-neutral-200 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Contador de proceso
          </p>
          <DockTimer elapsedSeconds={elapsedSeconds} />
        </div>
        <DockTimeline
          elapsedMinutes={elapsedMinutes}
          standardMinutes={standardMinutes}
        />
      </div>
    </article>
  );
}
