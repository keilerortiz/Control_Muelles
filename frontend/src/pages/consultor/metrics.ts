import type { Appointment } from "../../domain/types/appointments";

export type ConsultorAppointmentRow = Appointment & {
  MovedWeightKg?: number | string;
  EstimatedTons?: number | string;
  OtcNonComplianceReason?: string | null;
  OtsNonComplianceReason?: string | null;
  NonComplianceComment?: string | null;
  ProcessStartAt?: string | null;
  ProcessEndAt?: string | null;
  StandardTimeMinutes?: number | string;
  DockName?: string | null;
  SeniorOperators?: string | null;
  JuniorOperators?: string | null;
};

export interface ConsultorOperatorMetric {
  name: string;
  role: "Senior" | "Junior";
  executedMinutes: number;
  otsRate: number;
}

function getRowStatus(row: ConsultorAppointmentRow): string {
  const record = row as Record<string, unknown>;
  return String(
    record.Status
    ?? record.status
    ?? record.AppointmentStatus
    ?? record.appointmentStatus
    ?? "",
  ).toUpperCase();
}

function getStandardMinutes(row: ConsultorAppointmentRow): number {
  const record = row as Record<string, unknown>;
  const raw =
    record.StandardTimeMinutes
    ?? record.standardTimeMinutes
    ?? record.StandardMinutes
    ?? record.standardMinutes
    ?? record.OperationStandardMinutes
    ?? record.operationStandardMinutes
    ?? 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function splitOperatorNames(value: unknown): string[] {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildConsultorMetrics(rows: ConsultorAppointmentRow[] = []) {
  const nowMs = Date.now();
  const totalMovedWeightKg = rows.reduce((accumulator, row) => {
    const movedWeightKg = Number(row.MovedWeightKg || 0);
    return accumulator + (Number.isFinite(movedWeightKg) ? movedWeightKg : 0);
  }, 0);
  const totalVolumeTon = totalMovedWeightKg / 1000;

  const nonCompliances = rows.filter((row) => {
    if (row.OtcNonComplianceReason || row.OtsNonComplianceReason || row.NonComplianceComment) return true;
    if (!row.ProcessStartAt || !row.ProcessEndAt || !row.StandardTimeMinutes) return false;
    const startedAt = new Date(row.ProcessStartAt);
    const endedAt = new Date(row.ProcessEndAt);
    const elapsedMinutes = Math.max((endedAt.getTime() - startedAt.getTime()) / 60000, 0);
    return elapsedMinutes > Number(row.StandardTimeMinutes);
  }).length;

  const operatorAccumulator = rows.reduce<
    Record<string, { name: string; role: "Senior" | "Junior"; executedMinutes: number; compliant: number; total: number }>
  >((accumulator, row) => {
    const startedAt = row.ProcessStartAt ? new Date(row.ProcessStartAt) : null;
    const endedAt = row.ProcessEndAt ? new Date(row.ProcessEndAt) : null;
    const hasStart = Boolean(startedAt && !Number.isNaN(startedAt.getTime()));
    const hasEnd = Boolean(endedAt && !Number.isNaN(endedAt.getTime()));
    const effectiveEndMs = hasEnd && endedAt ? endedAt.getTime() : nowMs;
    const elapsedMinutes = hasStart && startedAt
      ? Math.max((effectiveEndMs - startedAt.getTime()) / 60000, 0)
      : 0;
    const standardMinutes = getStandardMinutes(row);
    const hasOtsNonCompliance = Boolean(String(row.OtsNonComplianceReason || "").trim());
    const status = getRowStatus(row);
    const isParaFirmar = status === "PARA_FIRMAR";
    const isClosedStatus = status === "FINALIZADO" || status === "ATENDIDA";
    const isEvaluableStatus = isParaFirmar || isClosedStatus;
    const hasEvaluableOtsResult = isEvaluableStatus && hasStart && standardMinutes > 0;
    const isCompliantByTime = hasEvaluableOtsResult ? elapsedMinutes <= standardMinutes : false;
    const isCompliant = hasOtsNonCompliance ? false : isCompliantByTime;
    const registerOperator = (name: string, role: "Senior" | "Junior") => {
      const key = `${role}:${name}`;
      const current = accumulator[key] || { name, role, executedMinutes: 0, compliant: 0, total: 0 };
      current.executedMinutes += elapsedMinutes;
      if (hasEvaluableOtsResult) {
        current.total += 1;
        if (isCompliant) current.compliant += 1;
      }
      accumulator[key] = current;
    };
    splitOperatorNames(row.SeniorOperators).forEach((name) => registerOperator(name, "Senior"));
    splitOperatorNames(row.JuniorOperators).forEach((name) => registerOperator(name, "Junior"));
    return accumulator;
  }, {});

  const operatorMetrics: ConsultorOperatorMetric[] = Object.values(operatorAccumulator)
    .map((metric) => ({
      name: metric.name,
      role: metric.role,
      executedMinutes: Math.round(metric.executedMinutes),
      otsRate: metric.total > 0 ? Math.round((metric.compliant * 100) / metric.total) : 0,
    }))
    .sort((left, right) => {
      if (right.otsRate !== left.otsRate) return right.otsRate - left.otsRate;
      return right.executedMinutes - left.executedMinutes;
    });

  const bestOperator = operatorMetrics[0];

  return {
    totalVolume: totalVolumeTon.toFixed(1),
    nonCompliances,
    bestOperario: bestOperator ? `${bestOperator.name} · ${bestOperator.otsRate}% OTS` : "Sin dato",
    operatorMetrics,
  };
}
