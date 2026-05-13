import { AlertCircle, Calendar, Clock, FileCheck, Truck, Wrench, XCircle } from "lucide-react";

import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { FieldGroup } from "./FieldGroup";
import { MasterDataFields } from "./MasterDataFields";
import { NonComplianceReasonSelect } from "./NonComplianceReasonSelect";
import { OperatorSelection } from "./OperatorSelection";
import { getFinalizeNonComplianceState } from "./formUtils";
import type { AppointmentActionFormState, AppointmentActionType } from "./formUtils";
import type { AppointmentCandidates, AppointmentDetail } from "../../../domain/types/appointments";

interface ActionBodyProps {
  action: AppointmentActionType | null;
  appointment?: AppointmentDetail | null;
  candidates?: AppointmentCandidates;
  candidatesLoading?: boolean;
  form: AppointmentActionFormState;
  juniorOperators: Array<Record<string, unknown>>;
  seniorOperators: Array<Record<string, unknown>>;
  toggleOperator: (field: "seniorIds" | "juniorIds", id: number | undefined) => void;
  updateValue: (field: string, value: string | number | boolean | number[] | string[]) => void;
}

const OTC_REASON_OPTIONS = [
  "Documentación incompleta en portería",
  "Validación documental demorada",
  "Congestión en portería",
  "Novedad de seguridad en acceso",
  "Falla de sistema en registro de ingreso",
];

const OTS_REASON_OPTIONS = [
  "Demora por disponibilidad de muelle",
  "Demora por disponibilidad de operarios",
  "Novedad operativa durante el proceso",
  "Equipos o recursos no disponibles",
  "Retraso por re-trabajo de operación",
];

export function ActionBody({
  action,
  appointment,
  candidates,
  candidatesLoading,
  form,
  juniorOperators,
  seniorOperators,
  toggleOperator,
  updateValue,
}: ActionBodyProps) {
  const finalizeNonCompliance = getFinalizeNonComplianceState(appointment);

  const toggleReason = (field: string, reason: string) => {
    const selectedRaw = form[field as keyof AppointmentActionFormState];
    const selected = Array.isArray(selectedRaw) ? (selectedRaw as string[]) : [];
    const exists = selected.includes(reason);
    updateValue(field, exists ? selected.filter((item) => item !== reason) : [...selected, reason]);
  };

  if (action === "create" || action === "edit") {
    return <MasterDataFields form={form} updateValue={updateValue} />;
  }

  if (action === "checkin") {
    return (
      <FieldGroup title="Ingreso a patio" icon={Truck}>
        <Input required label="Nombre del conductor" value={form.driverName} onChange={(event) => updateValue("driverName", event.target.value)} />
        <Input required label="Cédula del conductor" value={form.driverDocument} onChange={(event) => updateValue("driverDocument", event.target.value)} type="number"/>
        <Input required label="Placa del vehículo" value={form.vehiclePlate} onChange={(event) => updateValue("vehiclePlate", event.target.value)} className="md:col-span-2" maxLength={6} />
      </FieldGroup>
    );
  }

  if (action === "assign" || action === "reassign") {
    return (
      <div className="space-y-4">
        <FieldGroup title="Recursos" icon={Wrench}>
          <Select
            required={action === "assign"}
            label="Muelle"
            value={form.dockId}
            onChange={(event) => {
              updateValue("dockId", event.target.value);
              if (action === "reassign") updateValue("reassignDockTouched", true);
            }}
          >
            {action === "assign" ? <option value="">Seleccione un muelle</option> : null}
            {(candidates?.docks || []).map((dock) => (
              <option key={dock.Id} value={dock.Id}>
                {dock.Name}
              </option>
            ))}
          </Select>
          {candidatesLoading ? (
            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
              Consultando operarios...
            </div>
          ) : null}
        </FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <OperatorSelection
            checkedIds={form.seniorIds}
            operators={seniorOperators}
            title="Operarios senior"
            toggleOperator={(id) => {
              if (action === "reassign") updateValue("reassignSeniorTouched", true);
              toggleOperator("seniorIds", id);
            }}
          />
          <OperatorSelection
            checkedIds={form.juniorIds}
            operators={juniorOperators}
            title="Operarios junior"
            toggleOperator={(id) => {
              if (action === "reassign") updateValue("reassignJuniorTouched", true);
              toggleOperator("juniorIds", id);
            }}
          />
        </div>
      </div>
    );
  }

  if (action === "startProcess") {
    return (
      <FieldGroup title="Inicio de proceso" icon={Clock}>
        <Input required label="Remisión" value={form.remissions} onChange={(event) => updateValue("remissions", event.target.value)} />
        <Input required label="Precintos" value={form.precincts} onChange={(event) => updateValue("precincts", event.target.value)} />
      </FieldGroup>
    );
  }

  if (action === "toSign") {
    return (
      <FieldGroup title="Cierre de operación" icon={FileCheck}>
      </FieldGroup>
    );
  }

  if (action === "finalize") {
    return (
      <div className="space-y-4">
        <FieldGroup title="Finalización" icon={Calendar}>
          <Input required label="Peso movido (kg)" type="number" min="0" step="0.01" value={form.movedWeightKg} onChange={(event) => updateValue("movedWeightKg", event.target.value)} />
        </FieldGroup>
        {finalizeNonCompliance.hasNonCompliance ? (
          <FieldGroup title="Incumplimientos" icon={AlertCircle}>
            {finalizeNonCompliance.otcFail ? (
              <NonComplianceReasonSelect
                label="Causal OTC"
                required
                placeholder="Seleccionar causal OTC"
                options={OTC_REASON_OPTIONS}
                selectedValues={form.otcNonComplianceReasons || []}
                onToggle={(reason) => toggleReason("otcNonComplianceReasons", reason)}
              />
            ) : null}
            {finalizeNonCompliance.otsFail ? (
              <NonComplianceReasonSelect
                label="Causal OTS"
                required
                placeholder="Seleccionar causal OTS"
                options={OTS_REASON_OPTIONS}
                selectedValues={form.otsNonComplianceReasons || []}
                onToggle={(reason) => toggleReason("otsNonComplianceReasons", reason)}
              />
            ) : null}
            <Textarea
              required
              label="Comentario"
              value={form.nonComplianceComment}
              onChange={(event) => updateValue("nonComplianceComment", event.target.value)}
              rows={4}
              className="md:col-span-2"
            />
          </FieldGroup>
        ) : null}
      </div>
    );
  }

  if (action === "checkout") {
    return (
      <FieldGroup title="Salida de patio" icon={Truck}>
        <p className="md:col-span-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          ¿Confirma la salida del vehículo del patio? 
        </p>
      </FieldGroup>
    );
  }

  if (action === "cancel") {
    return (
      <FieldGroup title="Cancelación" icon={XCircle}>
        <Textarea
          required
          label="Motivo"
          value={form.cancellationReason}
          onChange={(event) => updateValue("cancellationReason", event.target.value)}
          rows={4}
          className="md:col-span-2"
        />
      </FieldGroup>
    );
  }

  if (action === "remove") {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
        ¿Confirma la eliminación de la cita #{appointment?.Id}?
      </div>
    );
  }

  return <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">No hay formulario configurado para esta acción.</div>;
}
