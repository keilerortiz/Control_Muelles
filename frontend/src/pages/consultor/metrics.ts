import type { Appointment } from "../../domain/types/appointments";

export type ConsultorAppointmentRow = Appointment & {
  ScheduledAt?: string | number | Date | null;
  ArrivalAt?: string | number | Date | null;
  DocumentDeliveryAt?: string | number | Date | null;
  ProcessStartAt?: string | number | Date | null;
  ProcessEndAt?: string | number | Date | null;
  StandardTimeMinutes?: number | string | null;
  ClientName?: string | null;
  clientName?: string | null;
  OperationTypeName?: string | null;
  OperationType?: string | null;
  MovedWeightKg?: number | string | null;
  EstimatedTons?: number | string | null;
  OtcNonComplianceReason?: string | null;
  OtsNonComplianceReason?: string | null;
  NonComplianceComment?: string | null;
  DockName?: string | null;
  SeniorOperators?: string | null;
  JuniorOperators?: string | null;
};

function safeDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export interface ConsultorOperatorMetric {
  name: string;
  role: "Senior" | "Junior";
  executedMinutes: number;
  otsRate: number;
}

function getRowStatus(row: ConsultorAppointmentRow): string {
  return String(
    row.Status ||
    (row as Record<string, unknown>).status ||
    ""
  ).toUpperCase();
}

function getStandardMinutes(row: ConsultorAppointmentRow): number {
  const raw = row.StandardTimeMinutes ?? 0;
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
  const totalMovedWeightKg = rows.reduce((accumulator, row) => {
    const movedWeightKg = Number(row.MovedWeightKg || 0);
    return accumulator + (Number.isFinite(movedWeightKg) ? movedWeightKg : 0);
  }, 0);
  const totalVolumeTon = totalMovedWeightKg;

  let attendedCount = 0;
  let inServiceCount = 0;
  const volumeByClient: Record<string, number> = {};
  const otsByOperationType: Record<string, { compliant: number; total: number }> = {};
  const nonComplianceReasons: Record<string, number> = {};
  const otcStats = { compliant: 0, total: 0 };

  rows.forEach((row) => {
    const status = getRowStatus(row);

    // 1. Conteos por estado
    if (status === "ATENDIDA" || status === "FINALIZADO") {
      attendedCount++;
    } else if (["ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR"].includes(status)) {
      inServiceCount++;
    }

    // 2. Volumen por cliente
    const clientName = String(row.ClientName || (row as any).clientName || "Otro");
    const weight = Number(row.MovedWeightKg || 0);
    volumeByClient[clientName] = (volumeByClient[clientName] || 0) + weight / 1000;

    // 3. OTC (Cumplimiento de Atención Inicial)
    const scheduledAt = safeDate(row.ScheduledAt);
    const arrivalAt = safeDate(row.ArrivalAt);
    const documentDeliveryAt = safeDate(row.DocumentDeliveryAt);

    if (scheduledAt && arrivalAt && documentDeliveryAt) {
      // Cumple cita: llega hasta 15 min después de lo programado
      const arrivalLimit = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
      const compliesArrival = arrivalAt <= arrivalLimit;

      if (compliesArrival) {
        // Base de cálculo: si llegó antes, cuenta desde la hora programada. Si llegó tarde (pero dentro de los 15), desde que llegó.
        const baseTimeMs = Math.max(arrivalAt.getTime(), scheduledAt.getTime());
        const otcLimit = new Date(baseTimeMs + 35 * 60 * 1000);

        otcStats.total += 1;
        if (documentDeliveryAt <= otcLimit) {
          otcStats.compliant += 1;
        }
      }
    }

    // 4. OTS por tipo de operación (Independiente de cumplimiento de cita)
    const opType = String(row.OperationTypeName || row.OperationType || "Otro");
    const processStart = safeDate(row.ProcessStartAt);
    const processEnd = safeDate(row.ProcessEndAt);
    const standard = getStandardMinutes(row);
    const hasOtsReason = Boolean(String(row.OtsNonComplianceReason || "").trim());

    if (processStart && processEnd && standard > 0) {
      const elapsed = Math.max((processEnd.getTime() - processStart.getTime()) / 60000, 0);
      const isOtsCompliant = !hasOtsReason && elapsed <= standard;

      const stats = otsByOperationType[opType] || { compliant: 0, total: 0 };
      stats.total += 1;
      if (isOtsCompliant) stats.compliant += 1;
      otsByOperationType[opType] = stats;
    }

    // 5. Distribución de motivos de incumplimiento
    if (row.OtcNonComplianceReason) {
      row.OtcNonComplianceReason.split(";").forEach((r) => {
        const reason = r.trim();
        if (reason) nonComplianceReasons[reason] = (nonComplianceReasons[reason] || 0) + 1;
      });
    }
    if (row.OtsNonComplianceReason) {
      row.OtsNonComplianceReason.split(";").forEach((r) => {
        const reason = r.trim();
        if (reason) nonComplianceReasons[reason] = (nonComplianceReasons[reason] || 0) + 1;
      });
    }
  });

  const otsByOpTypeData = Object.entries(otsByOperationType).map(([name, stats]) => ({
    name,
    rate: Math.round((stats.compliant * 100) / stats.total),
  })).sort((a, b) => b.rate - a.rate);

  const topClients = Object.entries(volumeByClient)
    .map(([name, volume]) => ({ name, volume: Number(volume.toFixed(1)) }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const topReasons = Object.entries(nonComplianceReasons)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calcular total de incumplimientos (registrados explícitamente o por tiempo)
  const nonCompliancesCount = rows.filter((row) => {
    if (row.OtcNonComplianceReason || row.OtsNonComplianceReason || row.NonComplianceComment) return true;
    const processStart = safeDate(row.ProcessStartAt);
    const processEnd = safeDate(row.ProcessEndAt);
    const standard = getStandardMinutes(row);
    if (processStart && processEnd && standard > 0) {
      const elapsed = (processEnd.getTime() - processStart.getTime()) / 60000;
      return elapsed > standard;
    }
    return false;
  }).length;

  return {
    totalVolume: totalVolumeTon.toFixed(1),
    attendedVehicles: attendedCount,
    inServiceVehicles: inServiceCount,
    nonCompliances: nonCompliancesCount,
    otcRate: otcStats.total > 0 ? Math.round((otcStats.compliant * 100) / otcStats.total) : 0,
    otsByOpTypeData,
    topClients,
    topReasons,
  };
}

