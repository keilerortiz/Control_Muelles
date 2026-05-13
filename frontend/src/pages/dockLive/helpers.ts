import type { Appointment } from "../../domain/types/appointments";

const ACTIVE_DOCK_STATUSES = ["ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR"] as const;

export type DockAppointment = Appointment & {
  Id: number;
  Status?: string;
  DockName?: string;
  ClientId?: number | string;
  VehicleTypeId?: number | string;
  OperationTypeId?: number | string;
  StandardTimeMinutes?: number | string;
  ActiveOperatorCount?: number;
  ProcessStartAt?: string;
  ProcessEndAt?: string;
};

export function normalizeDockSortValue(value: unknown) {
  if (!value || typeof value !== "string") return Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function getElapsedMinutes(appointment: DockAppointment, nowMs: number) {
  const processStartAt = appointment?.ProcessStartAt;
  const processEndAt = appointment?.ProcessEndAt;
  if (!processStartAt) return 0;
  const hasTimezoneStart = /([zZ]|[+\-]\d{2}:\d{2})$/.test(processStartAt);
  const startDate = new Date(hasTimezoneStart ? processStartAt : `${processStartAt}Z`);
  if (Number.isNaN(startDate.getTime())) return 0;
  if (!processEndAt) return Math.max((nowMs - startDate.getTime()) / 60000, 0);
  const hasTimezoneEnd = /([zZ]|[+\-]\d{2}:\d{2})$/.test(processEndAt);
  const endDate = new Date(hasTimezoneEnd ? processEndAt : `${processEndAt}Z`);
  if (Number.isNaN(endDate.getTime())) return Math.max((nowMs - startDate.getTime()) / 60000, 0);
  return Math.max((endDate.getTime() - startDate.getTime()) / 60000, 0);
}

export function buildLiveKpis(appointments: DockAppointment[], nowMs: number) {
  return appointments.reduce(
    (accumulator, appointment) => {
      const standardMinutes = Number(appointment?.StandardTimeMinutes) || 0;
      const elapsedMinutes = getElapsedMinutes(appointment, nowMs);
      const compliancePercent = standardMinutes > 0 ? (elapsedMinutes / standardMinutes) * 100 : 0;
      if (compliancePercent > 100) accumulator.delayed += 1;
      else if (compliancePercent > 85) accumulator.atRisk += 1;
      if ((appointment?.ActiveOperatorCount || 0) <= 0) accumulator.withoutOperators += 1;
      return accumulator;
    },
    { delayed: 0, atRisk: 0, withoutOperators: 0 },
  );
}

export function mergeAndSortActiveAppointments(items: DockAppointment[]) {
  const uniqueById = new Map<number, DockAppointment>();
  items.forEach((row) => {
    if (!uniqueById.has(row.Id)) uniqueById.set(row.Id, row);
  });
  return Array.from(uniqueById.values())
    .filter((row) => row.Status && ACTIVE_DOCK_STATUSES.includes(row.Status as (typeof ACTIVE_DOCK_STATUSES)[number]))
    .sort((left, right) => {
      const leftSort = normalizeDockSortValue(left.DockName);
      const rightSort = normalizeDockSortValue(right.DockName);
      if (leftSort !== rightSort) return leftSort - rightSort;
      return (left.DockName || "").localeCompare(right.DockName || "");
    });
}

export { ACTIVE_DOCK_STATUSES };
