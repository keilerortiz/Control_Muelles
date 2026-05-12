// src/components/appointments/AppointmentActionModal.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { actionLabels, formatDateTime } from "../../domain/appointmentsConfig";
import { Button } from "../ui/Button";
import { Modal, ModalFooter } from "../ui/Modal";
import { ActionBody } from "./appointmentActionModal/ActionBody";
import { buildInitialForm, buildPayloadByAction } from "./appointmentActionModal/formUtils";

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
  const [form, setForm] = useState(() =>
    buildInitialForm(appointment, candidates)
  );

  useEffect(() => {
    if (!open) return;
    setForm(buildInitialForm(appointment, candidates));
  }, [action, appointment, candidates, open]);

  const seniorOperators = useMemo(
    () =>
      (candidates?.operators || []).filter(
        (operator) => operator.OperatorLevel === "SENIOR"
      ),
    [candidates]
  );
  const juniorOperators = useMemo(
    () =>
      (candidates?.operators || []).filter(
        (operator) => operator.OperatorLevel === "JUNIOR"
      ),
    [candidates]
  );

  const title = actionLabels[action] || "Acción";
  const [validationError, setValidationError] = useState("");

  const updateValue = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleOperator = useCallback((key, operatorId) => {
    setForm((current) => {
      const currentValues = current[key];
      const exists = currentValues.includes(operatorId);
      return {
        ...current,
        [key]: exists
          ? currentValues.filter((value) => value !== operatorId)
        : [...currentValues, operatorId],
      };
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError("");

    if (action === "create" || action === "edit") {
      const now = new Date();
      const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt) : null;
      if (!form.clientId || !form.operationTypeId || !form.vehicleTypeId || !form.estimatedTons || !form.scheduledAt) {
        setValidationError("Completa los campos obligatorios de la cita.");
        return;
      }
      if (!scheduledAt || scheduledAt <= now) {
        setValidationError("La fecha y hora programada debe ser mayor a la actual.");
        return;
      }
    }
    if (action === "startProcess") {
      if (!form.remissions?.trim() || !form.precincts?.trim()) {
        setValidationError("Completa remisión y precintos para iniciar proceso.");
        return;
      }
    }

    const payloadByAction = buildPayloadByAction(form, candidates?.version);
    await onSubmit(payloadByAction[action]);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${title}${appointment ? ` · Cita #${appointment.Id}` : ""}`}
      size="lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {appointment && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
              <span className="font-bold">Cliente:</span> {appointment.ClientName || "-"}
            <span className="ml-3">
               <span className="font-bold">Programada:</span> {formatDateTime(appointment.ScheduledAt)}
            </span>
          </div>
        )}

        <ActionBody
          action={action}
          appointment={appointment}
          candidates={candidates}
          candidatesLoading={candidatesLoading}
          form={form}
          juniorOperators={juniorOperators}
          seniorOperators={seniorOperators}
          toggleOperator={toggleOperator}
          updateValue={updateValue}
        />

        {(validationError || errorMessage) && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {validationError || errorMessage}
          </div>
        )}

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
