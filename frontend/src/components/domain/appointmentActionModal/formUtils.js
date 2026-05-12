import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../../domain/appointmentsConfig";

function parseNonComplianceReasons(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeNonComplianceReasons(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.map((item) => String(item).trim()).filter(Boolean).join("; ") || null;
}

function toDate(value) {
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

function getSqlMinuteDiff(startDate, endDate) {
  return Math.floor(endDate.getTime() / 60000) - Math.floor(startDate.getTime() / 60000);
}

export function getFinalizeNonComplianceState(appointment) {
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

export function buildInitialForm(appointment, candidates) {
  const firstDockId = candidates?.docks?.[0]?.Id ?? "";
  const isCreate = !appointment;
  const assignedSeniorIds = (candidates?.operators || [])
    .filter((operator) => operator.IsAssigned && operator.OperatorLevel === "SENIOR")
    .map((operator) => operator.Id);
  const assignedJuniorIds = (candidates?.operators || [])
    .filter((operator) => operator.IsAssigned && operator.OperatorLevel === "JUNIOR")
    .map((operator) => operator.Id);
  return {
    clientId: appointment?.ClientId ?? "",
    operationTypeId: appointment?.OperationTypeId ?? "",
    vehicleTypeId: appointment?.VehicleTypeId ?? "",
    estimatedTons: appointment?.EstimatedTons ?? "",
    scheduledAt: toDateTimeLocalValue(
      appointment?.ScheduledAt || (isCreate ? "" : null)
    ),
    driverName: appointment?.DriverName ?? "",
    driverDocument: appointment?.DriverDocument ?? "",
    vehiclePlate: appointment?.VehiclePlate ?? "",
    dockId: appointment?.DockId ?? firstDockId,
    seniorIds: assignedSeniorIds,
    juniorIds: assignedJuniorIds,
    reassignDockTouched: false,
    reassignSeniorTouched: false,
    reassignJuniorTouched: false,
    remissions: appointment?.Remissions ?? "",
    precincts: appointment?.Precincts ?? "",
    movedWeightKg: appointment?.MovedWeightKg ?? 0,
    otcNonComplianceReason: appointment?.OtcNonComplianceReason ?? "",
    otsNonComplianceReason: appointment?.OtsNonComplianceReason ?? "",
    otcNonComplianceReasons: parseNonComplianceReasons(appointment?.OtcNonComplianceReason),
    otsNonComplianceReasons: parseNonComplianceReasons(appointment?.OtsNonComplianceReason),
    nonComplianceComment: appointment?.NonComplianceComment ?? "",
    cancellationReason: appointment?.CancellationReason ?? "",
  };
}

export function buildPayloadByAction(form, candidatesVersion) {
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
