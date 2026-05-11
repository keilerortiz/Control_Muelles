import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../../domain/appointmentsConfig";

export function buildInitialForm(appointment, candidates) {
  const firstDockId = candidates?.docks?.[0]?.Id ?? "";
  const isCreate = !appointment;
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
    seniorIds: [],
    juniorIds: [],
    documentDeliveryAt: toDateTimeLocalValue(appointment?.DocumentDeliveryAt || new Date().toISOString()),
    processStartAt: toDateTimeLocalValue(appointment?.ProcessStartAt || new Date().toISOString()),
    processEndAt: toDateTimeLocalValue(appointment?.ProcessEndAt || new Date().toISOString()),
    finalizedAt: toDateTimeLocalValue(appointment?.FinalizedAt || new Date().toISOString()),
    movedWeightKg: appointment?.MovedWeightKg ?? 0,
    otcNonComplianceReason: appointment?.OtcNonComplianceReason ?? "",
    otsNonComplianceReason: appointment?.OtsNonComplianceReason ?? "",
    nonComplianceComment: appointment?.NonComplianceComment ?? "",
    checkoutAt: toDateTimeLocalValue(appointment?.CheckoutAt || new Date().toISOString()),
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
      candidatesVersion,
    },
    startProcess: {
      documentDeliveryAt: fromDateTimeLocalValue(form.documentDeliveryAt),
      processStartAt: fromDateTimeLocalValue(form.processStartAt),
    },
    toSign: { processEndAt: fromDateTimeLocalValue(form.processEndAt) },
    finalize: {
      finalizedAt: fromDateTimeLocalValue(form.finalizedAt),
      movedWeightKg: Number(form.movedWeightKg),
      otcNonComplianceReason: form.otcNonComplianceReason.trim() || null,
      otsNonComplianceReason: form.otsNonComplianceReason.trim() || null,
      nonComplianceComment: form.nonComplianceComment.trim() || null,
    },
    checkout: { checkoutAt: fromDateTimeLocalValue(form.checkoutAt) },
    cancel: { cancellationReason: form.cancellationReason.trim() },
  };
}
