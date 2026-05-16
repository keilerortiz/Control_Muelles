// src/components/appointments/AppointmentActionModal.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { actionLabels, formatDateTime } from "../../domain/appointmentsConfig";
import { useMasterCatalogs } from "../../hooks/useMasters";
import { Button } from "../ui/Button";
import { Modal, ModalFooter } from "../ui/Modal";
import { ActionBody } from "./appointmentActionModal/ActionBody";
import {
  buildInitialForm,
  buildPayloadByAction,
  getFinalizeNonComplianceState,
} from "./appointmentActionModal/formUtils";
import type { AppointmentActionFormState, AppointmentActionType } from "./appointmentActionModal/formUtils";
import type { AppointmentCandidates, AppointmentDetail } from "../../domain/types/appointments";
import type { MasterRecord } from "../../domain/types/masters";

interface AppointmentActionModalProps {
  action: AppointmentActionType | null;
  appointment?: AppointmentDetail | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isPending: boolean;
  errorMessage?: string;
  candidates?: AppointmentCandidates;
  candidatesLoading?: boolean;
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
}: AppointmentActionModalProps) {
  const catalogsQuery = useMasterCatalogs();
  const [form, setForm] = useState<AppointmentActionFormState>(() =>
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

  const title = action ? actionLabels[action] || "Acción" : "Acción";
  const [validationError, setValidationError] = useState("");

  const activeBusinessRuleMinutesByKey = useMemo(() => {
    const rules = ((catalogsQuery.data?.businessRules || []) as MasterRecord[]).filter((rule) => rule?.IsActive);
    const ruleMap = new Map<string, number>();
    rules.forEach((rule) => {
      const key = `${Number(rule.ClientId)}-${Number(rule.VehicleTypeId)}-${Number(rule.OperationTypeId)}`;
      ruleMap.set(key, Number(rule.StandardTimeMinutes) || 0);
    });
    return ruleMap;
  }, [catalogsQuery.data?.businessRules]);

  const appointmentEffective = useMemo(() => {
    if (!appointment) return appointment;
    const key = `${Number(appointment.ClientId)}-${Number(appointment.VehicleTypeId)}-${Number(appointment.OperationTypeId)}`;
    const businessRuleMinutes = activeBusinessRuleMinutesByKey.get(key);
    if (!businessRuleMinutes || businessRuleMinutes <= 0) return appointment;
    return { ...appointment, StandardTimeMinutes: businessRuleMinutes };
  }, [appointment, activeBusinessRuleMinutesByKey]);

  const activeNonComplianceReasons = useMemo(
    () => ((catalogsQuery.data?.nonComplianceReasons || []) as MasterRecord[]).filter((item) => item?.IsActive),
    [catalogsQuery.data?.nonComplianceReasons],
  );

  const otcReasonOptions = useMemo(
    () => activeNonComplianceReasons
      .filter((item) => String(item.ReasonType || "").toUpperCase() === "OTC")
      .map((item) => String(item.Name || "").trim())
      .filter(Boolean),
    [activeNonComplianceReasons],
  );

  const otsReasonOptions = useMemo(
    () => activeNonComplianceReasons
      .filter((item) => String(item.ReasonType || "").toUpperCase() === "OTS")
      .map((item) => String(item.Name || "").trim())
      .filter(Boolean),
    [activeNonComplianceReasons],
  );

  const updateValue = useCallback((key: string, value: string | number | boolean | number[] | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleOperator = useCallback((key: "seniorIds" | "juniorIds", operatorId: number | undefined) => {
    if (typeof operatorId !== "number") {
      return;
    }
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError("");
    if (!action) {
      return;
    }

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
    if (action === "assign") {
      if (!form.dockId) {
        setValidationError("Selecciona un muelle para asignar recursos.");
        return;
      }
      if (!Array.isArray(form.seniorIds) || form.seniorIds.length === 0) {
        setValidationError("Debes seleccionar al menos un operario senior.");
        return;
      }
    }
    if (action === "reassign") {
      if (form.reassignSeniorTouched && (!Array.isArray(form.seniorIds) || form.seniorIds.length === 0)) {
        setValidationError("La operación debe conservar al menos un operario senior.");
        return;
      }
    }
    if (action === "finalize") {
      const nonComplianceState = getFinalizeNonComplianceState(appointmentEffective);
      if (nonComplianceState.otcFail && (!Array.isArray(form.otcNonComplianceReasons) || form.otcNonComplianceReasons.length === 0)) {
        setValidationError("Debes seleccionar al menos una causal OTC por incumplimiento.");
        return;
      }
      if (nonComplianceState.otsFail && (!Array.isArray(form.otsNonComplianceReasons) || form.otsNonComplianceReasons.length === 0)) {
        setValidationError("Debes seleccionar al menos una causal OTS por incumplimiento.");
        return;
      }
      if (nonComplianceState.hasNonCompliance && !form.nonComplianceComment?.trim()) {
        setValidationError("El comentario es obligatorio cuando hay incumplimientos OTC u OTS.");
        return;
      }
    }

    if (action === "remove") {
      await onSubmit({});
      return;
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
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
              <span className="font-bold">Cliente:</span> {String(appointment.ClientName || "-")}
            <span className="ml-3">
               <span className="font-bold">Programada:</span> {formatDateTime(appointment.ScheduledAt)}
            </span>
          </div>
        )}

        <ActionBody
          action={action}
          appointment={appointmentEffective}
          candidates={candidates}
          candidatesLoading={candidatesLoading}
          form={form}
          juniorOperators={juniorOperators}
          otcReasonOptions={otcReasonOptions}
          otsReasonOptions={otsReasonOptions}
          seniorOperators={seniorOperators}
          toggleOperator={toggleOperator}
          updateValue={updateValue}
        />

        {(validationError || errorMessage) && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
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
