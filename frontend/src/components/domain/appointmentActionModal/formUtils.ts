import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../../domain/appointmentsConfig";
import type { AppointmentCandidates, AppointmentDetail } from "../../../domain/types/appointments";

export type AppointmentActionType =
  | "create"
  | "edit"
  | "checkin"
  | "assign"
  | "reassign"
  | "startProcess"
  | "toSign"
  | "finalize"
  | "checkout"
  | "cancel"
  | "remove";

export interface AppointmentActionFormState {
  clientId: string | number;
  operationTypeId: string | number;
  vehicleTypeId: string | number;
  estimatedTons: string | number;
  scheduledAt: string;
  driverName: string;
  driverDocument: string;
  vehiclePlate: string;
  dockId: string | number;
  seniorIds: number[];
  juniorIds: number[];
  reassignDockTouched: boolean;
  reassignSeniorTouched: boolean;
  reassignJuniorTouched: boolean;
  remissions: string;
  precincts: string;
  movedWeightKg: string | number;
  otcNonComplianceReason: string;
  otsNonComplianceReason: string;
  otcNonComplianceReasons: string[];
  otsNonComplianceReasons: string[];
  nonComplianceComment: string;
  cancellationReason: string;
  [key: string]: unknown;
}

type AppointmentActionPayloadByAction = {
  create: Record<string, unknown>;
  edit: Record<string, unknown>;
  checkin: Record<string, unknown>;
  assign: Record<string, unknown>;
  reassign: Record<string, unknown>;
  startProcess: Record<string, unknown>;
  toSign: Record<string, unknown>;
  finalize: Record<string, unknown>;
  checkout: Record<string, unknown>;
  cancel: Record<string, unknown>;
};

function parseNonComplianceReasons(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function toNumericInput(value: unknown, fallback: string | number = ""): string | number {
  if (typeof value === "number" || typeof value === "string") return value;
  return fallback;
}

function serializeNonComplianceReasons(values: unknown): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.map((item) => String(item).trim()).filter(Boolean).join("; ") || null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;

  const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSqlMinuteDiff(startDate: Date, endDate: Date): number {
  return Math.floor(endDate.getTime() / 60000) - Math.floor(startDate.getTime() / 60000);
}

export function getFinalizeNonComplianceState(appointment?: AppointmentDetail | null) {
  const scheduledAt = toDate(appointment?.ScheduledAt);
  const arrivalAt = toDate(appointment?.ArrivalAt);
  const documentDeliveryAt = toDate(appointment?.DocumentDeliveryAt);
  const processStartAt = toDate(appointment?.ProcessStartAt);
  const processEndAt = toDate(appointment?.ProcessEndAt);
  const standardTimeMinutes = Number(appointment?.StandardTimeMinutes ?? 0);

  if (!scheduledAt || !arrivalAt || !documentDeliveryAt || !processStartAt || !processEndAt) {
    return { otcFail: false, otsFail: false, hasNonCompliance: false };
  }

  const cumpleCitaLimit = new Date(scheduledAt.getTime() + 15 * 60 * 1000);
  const cumpleCita = arrivalAt <= cumpleCitaLimit;
  const baseTime = arrivalAt > scheduledAt ? arrivalAt : scheduledAt;
  const otcLimit = new Date(baseTime.getTime() + 35 * 60 * 1000);
  const otcFail = cumpleCita && documentDeliveryAt > otcLimit;

  const otsMinutes = getSqlMinuteDiff(processStartAt, processEndAt);
  const otsFail = standardTimeMinutes > 0 && otsMinutes > standardTimeMinutes;

  return {
    otcFail,
    otsFail,
    hasNonCompliance: otcFail || otsFail,
  };
}

export function buildInitialForm(
  appointment?: AppointmentDetail | null,
  candidates?: AppointmentCandidates,
): AppointmentActionFormState {
  const firstDockId = candidates?.docks?.[0]?.Id ?? "";
  const isCreate = !appointment;
  const assignedSeniorIds = (candidates?.operators || [])
    .filter((operator) => operator.IsAssigned && operator.OperatorLevel === "SENIOR")
    .map((operator) => operator.Id)
    .filter((value): value is number => typeof value === "number");
  const assignedJuniorIds = (candidates?.operators || [])
    .filter((operator) => operator.IsAssigned && operator.OperatorLevel === "JUNIOR")
    .map((operator) => operator.Id)
    .filter((value): value is number => typeof value === "number");
  return {
    clientId: toNumericInput(appointment?.ClientId),
    operationTypeId: toNumericInput(appointment?.OperationTypeId),
    vehicleTypeId: toNumericInput(appointment?.VehicleTypeId),
    estimatedTons: toNumericInput(appointment?.EstimatedTons),
    scheduledAt: toDateTimeLocalValue(
      appointment?.ScheduledAt || (isCreate ? "" : null)
    ),
    driverName: toText(appointment?.DriverName),
    driverDocument: toText(appointment?.DriverDocument),
    vehiclePlate: toText(appointment?.VehiclePlate),
    dockId: toNumericInput(appointment?.DockId, firstDockId),
    seniorIds: assignedSeniorIds,
    juniorIds: assignedJuniorIds,
    reassignDockTouched: false,
    reassignSeniorTouched: false,
    reassignJuniorTouched: false,
    remissions: toText(appointment?.Remissions),
    precincts: toText(appointment?.Precincts),
    movedWeightKg: toNumericInput(appointment?.MovedWeightKg, 0),
    otcNonComplianceReason: toText(appointment?.OtcNonComplianceReason),
    otsNonComplianceReason: toText(appointment?.OtsNonComplianceReason),
    otcNonComplianceReasons: parseNonComplianceReasons(appointment?.OtcNonComplianceReason),
    otsNonComplianceReasons: parseNonComplianceReasons(appointment?.OtsNonComplianceReason),
    nonComplianceComment: toText(appointment?.NonComplianceComment),
    cancellationReason: toText(appointment?.CancellationReason),
  };
}

export function buildPayloadByAction(
  form: AppointmentActionFormState,
  candidatesVersion?: number,
): AppointmentActionPayloadByAction {
  return {
    create: {
      clientId: Number(form.clientId),
      operationTypeId: Number(form.operationTypeId),
      vehicleTypeId: Number(form.vehicleTypeId),
      estimatedTons: Number(form.estimatedTons),
      scheduledAt: fromDateTimeLocalValue(form.scheduledAt),
      driverName: form.driverName.trim(),
      driverDocument: form.driverDocument.trim(),
      vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
      nonComplianceComment: form.nonComplianceComment.trim() || null,
    },
    edit: {
      clientId: Number(form.clientId),
      operationTypeId: Number(form.operationTypeId),
      vehicleTypeId: Number(form.vehicleTypeId),
      estimatedTons: Number(form.estimatedTons),
      scheduledAt: fromDateTimeLocalValue(form.scheduledAt),
      driverName: form.driverName.trim(),
      driverDocument: form.driverDocument.trim(),
      vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
      nonComplianceComment: form.nonComplianceComment.trim() || null,
    },
    checkin: {
      driverName: form.driverName.trim(),
      driverDocument: form.driverDocument.trim(),
      vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
    },
    assign: {
      dockId: Number(form.dockId),
      seniorIds: form.seniorIds,
      juniorIds: form.juniorIds,
      candidatesVersion,
    },
    reassign: {
      dockId: Number(form.dockId),
      seniorIds: form.seniorIds,
      juniorIds: form.juniorIds,
      reassignDockTouched: Boolean(form.reassignDockTouched),
      reassignSeniorTouched: Boolean(form.reassignSeniorTouched),
      reassignJuniorTouched: Boolean(form.reassignJuniorTouched),
      candidatesVersion,
    },
    startProcess: {
      remissions: form.remissions.trim(),
      precincts: form.precincts.trim(),
    },
    toSign: {},
    finalize: {
      movedWeightKg: Number(form.movedWeightKg),
      otcNonComplianceReason: serializeNonComplianceReasons(form.otcNonComplianceReasons),
      otsNonComplianceReason: serializeNonComplianceReasons(form.otsNonComplianceReasons),
      nonComplianceComment: form.nonComplianceComment.trim() || null,
    },
    checkout: {},
    cancel: { cancellationReason: form.cancellationReason.trim() },
  };
}
