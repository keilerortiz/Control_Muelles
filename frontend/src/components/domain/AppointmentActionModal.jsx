import { useEffect, useMemo, useState } from "react";

import {
  actionLabels,
  appointmentMasterData,
  formatDateTime,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "../../domain/appointmentsConfig";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal, ModalFooter } from "../ui/Modal";
import { Select } from "../ui/Select";

function buildInitialForm(action, appointment, candidates) {
  const firstDockId = candidates?.docks?.[0]?.Id ?? "";
  return {
    clientId: appointment?.ClientId ?? 1,
    operationTypeId: appointment?.OperationTypeId ?? 1,
    vehicleTypeId: appointment?.VehicleTypeId ?? 1,
    estimatedTons: appointment?.EstimatedTons ?? 10,
    scheduledAt: toDateTimeLocalValue(appointment?.ScheduledAt || new Date(Date.now() + 60 * 60 * 1000).toISOString()),
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

function FieldGroup({ title, children }) {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function AppointmentActionModal({
  action,
  appointment,
  open,
  onClose,
  onSubmit,
  isPending,
  errorMessage,
  candidates,
  candidatesLoading = false,
}) {
  const [form, setForm] = useState(() => buildInitialForm(action, appointment, candidates));

  useEffect(() => {
    if (!open) return;
    setForm(buildInitialForm(action, appointment, candidates));
  }, [action, appointment, candidates, open]);

  const seniorOperators = useMemo(
    () => (candidates?.operators || []).filter((operator) => operator.OperatorLevel === "SENIOR"),
    [candidates],
  );
  const juniorOperators = useMemo(
    () => (candidates?.operators || []).filter((operator) => operator.OperatorLevel === "JUNIOR"),
    [candidates],
  );

  const title = actionLabels[action] || "Acción";

  const updateValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleOperator = (key, operatorId) => {
    setForm((current) => {
      const currentValues = current[key];
      const exists = currentValues.includes(operatorId);
      return {
        ...current,
        [key]: exists ? currentValues.filter((value) => value !== operatorId) : [...currentValues, operatorId],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payloadByAction = {
      create: {
        clientId: Number(form.clientId),
        operationTypeId: Number(form.operationTypeId),
        vehicleTypeId: Number(form.vehicleTypeId),
        estimatedTons: Number(form.estimatedTons),
        scheduledAt: fromDateTimeLocalValue(form.scheduledAt),
      },
      edit: {
        clientId: Number(form.clientId),
        operationTypeId: Number(form.operationTypeId),
        vehicleTypeId: Number(form.vehicleTypeId),
        estimatedTons: Number(form.estimatedTons),
        scheduledAt: fromDateTimeLocalValue(form.scheduledAt),
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
        candidatesVersion: candidates?.version,
      },
      reassign: {
        dockId: Number(form.dockId),
        seniorIds: form.seniorIds,
        juniorIds: form.juniorIds,
        candidatesVersion: candidates?.version,
      },
      startProcess: {
        documentDeliveryAt: fromDateTimeLocalValue(form.documentDeliveryAt),
        processStartAt: fromDateTimeLocalValue(form.processStartAt),
      },
      toSign: {
        processEndAt: fromDateTimeLocalValue(form.processEndAt),
      },
      finalize: {
        finalizedAt: fromDateTimeLocalValue(form.finalizedAt),
        movedWeightKg: Number(form.movedWeightKg),
        otcNonComplianceReason: form.otcNonComplianceReason.trim() || null,
        otsNonComplianceReason: form.otsNonComplianceReason.trim() || null,
        nonComplianceComment: form.nonComplianceComment.trim() || null,
      },
      checkout: {
        checkoutAt: fromDateTimeLocalValue(form.checkoutAt),
      },
      cancel: {
        cancellationReason: form.cancellationReason.trim(),
      },
    };

    await onSubmit(payloadByAction[action]);
  };

  const renderMasterDataFields = () => (
    <FieldGroup title="Datos base">
      <Select label="Cliente" value={form.clientId} onChange={(event) => updateValue("clientId", event.target.value)}>
        {appointmentMasterData.clients.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <Select
        label="Tipo de operación"
        value={form.operationTypeId}
        onChange={(event) => updateValue("operationTypeId", event.target.value)}
      >
        {appointmentMasterData.operationTypes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <Select
        label="Tipo de vehículo"
        value={form.vehicleTypeId}
        onChange={(event) => updateValue("vehicleTypeId", event.target.value)}
      >
        {appointmentMasterData.vehicleTypes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>
      <Input
        label="Toneladas estimadas"
        type="number"
        min="0"
        step="0.01"
        value={form.estimatedTons}
        onChange={(event) => updateValue("estimatedTons", event.target.value)}
      />
      <Input
        label="Fecha programada"
        type="datetime-local"
        value={form.scheduledAt}
        onChange={(event) => updateValue("scheduledAt", event.target.value)}
        className="md:col-span-2"
      />
    </FieldGroup>
  );

  const renderOperatorSelection = (operators, key, titleText) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-neutral-700">{titleText}</p>
      <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3">
        {operators.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin candidatos disponibles.</p>
        ) : (
          operators.map((operator) => {
            const checked = form[key].includes(operator.Id);
            return (
              <label key={operator.Id} className="flex items-start gap-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOperator(key, operator.Id)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-600"
                />
                <span>
                  {operator.Name}
                  <span className="block text-xs text-neutral-500">
                    Activas: {operator.ActiveAssignments} / Máximo: {operator.MaxConcurrentOperations}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );

  const renderActionBody = () => {
    if (action === "create" || action === "edit") return renderMasterDataFields();

    if (action === "checkin") {
      return (
        <FieldGroup title="Ingreso a patio">
          <Input label="Nombre del conductor" value={form.driverName} onChange={(event) => updateValue("driverName", event.target.value)} />
          <Input label="Documento del conductor" value={form.driverDocument} onChange={(event) => updateValue("driverDocument", event.target.value)} />
          <Input label="Placa del vehículo" value={form.vehiclePlate} onChange={(event) => updateValue("vehiclePlate", event.target.value)} className="md:col-span-2" />
        </FieldGroup>
      );
    }

    if (action === "assign" || action === "reassign") {
      return (
        <div className="space-y-4">
          <FieldGroup title="Recursos">
            <Select label="Muelle" value={form.dockId} onChange={(event) => updateValue("dockId", event.target.value)}>
              <option value="">Seleccione un muelle</option>
              {(candidates?.docks || []).map((dock) => (
                <option key={dock.Id} value={dock.Id}>
                  {dock.Name}
                </option>
              ))}
            </Select>
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
              {candidatesLoading ? "Consultando candidatos..." : `Versión de candidatos: ${candidates?.version || "-"}`}
            </div>
          </FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            {renderOperatorSelection(seniorOperators, "seniorIds", "Operarios senior")}
            {renderOperatorSelection(juniorOperators, "juniorIds", "Operarios junior")}
          </div>
        </div>
      );
    }

    if (action === "startProcess") {
      return (
        <FieldGroup title="Inicio de proceso">
          <Input
            label="Entrega de documentos"
            type="datetime-local"
            value={form.documentDeliveryAt}
            onChange={(event) => updateValue("documentDeliveryAt", event.target.value)}
          />
          <Input
            label="Inicio real del proceso"
            type="datetime-local"
            value={form.processStartAt}
            onChange={(event) => updateValue("processStartAt", event.target.value)}
          />
        </FieldGroup>
      );
    }

    if (action === "toSign") {
      return (
        <FieldGroup title="Cierre operativo">
          <Input
            label="Fin de proceso"
            type="datetime-local"
            value={form.processEndAt}
            onChange={(event) => updateValue("processEndAt", event.target.value)}
            className="md:col-span-2"
          />
        </FieldGroup>
      );
    }

    if (action === "finalize") {
      return (
        <div className="space-y-4">
          <FieldGroup title="Finalización">
            <Input
              label="Fecha de finalización"
              type="datetime-local"
              value={form.finalizedAt}
              onChange={(event) => updateValue("finalizedAt", event.target.value)}
            />
            <Input
              label="Peso movido (kg)"
              type="number"
              min="0"
              step="0.01"
              value={form.movedWeightKg}
              onChange={(event) => updateValue("movedWeightKg", event.target.value)}
            />
          </FieldGroup>
          <FieldGroup title="Incumplimientos">
            <Input
              label="Causal OTC"
              value={form.otcNonComplianceReason}
              onChange={(event) => updateValue("otcNonComplianceReason", event.target.value)}
            />
            <Input
              label="Causal OTS"
              value={form.otsNonComplianceReason}
              onChange={(event) => updateValue("otsNonComplianceReason", event.target.value)}
            />
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-neutral-700">Comentario</span>
              <textarea
                value={form.nonComplianceComment}
                onChange={(event) => updateValue("nonComplianceComment", event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
              />
            </label>
          </FieldGroup>
        </div>
      );
    }

    if (action === "checkout") {
      return (
        <FieldGroup title="Salida de patio">
          <Input
            label="Fecha de checkout"
            type="datetime-local"
            value={form.checkoutAt}
            onChange={(event) => updateValue("checkoutAt", event.target.value)}
            className="md:col-span-2"
          />
        </FieldGroup>
      );
    }

    if (action === "cancel") {
      return (
        <FieldGroup title="Cancelación">
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Motivo</span>
            <textarea
              value={form.cancellationReason}
              onChange={(event) => updateValue("cancellationReason", event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800"
            />
          </label>
        </FieldGroup>
      );
    }

    if (action === "remove") {
      return (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
          La cita #{appointment?.Id} será eliminada. Esta acción solo aplica para citas en estado <strong>AGENDADA</strong>.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        No hay formulario configurado para esta acción.
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${title}${appointment ? ` · Cita #${appointment.Id}` : ""}`}
      size="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {appointment ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
            Estado actual: <strong>{appointment.Status}</strong>
            <span className="ml-3">Programada: {formatDateTime(appointment.ScheduledAt)}</span>
          </div>
        ) : null}

        {renderActionBody()}

        {errorMessage ? (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {errorMessage}
          </div>
        ) : null}

        <ModalFooter className="gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" disabled={isPending || candidatesLoading}>
            {isPending ? "Procesando..." : title}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
