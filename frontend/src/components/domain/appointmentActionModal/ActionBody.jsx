import { AlertCircle, Calendar, Clock, FileCheck, Truck, Wrench, XCircle } from "lucide-react";

import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { FieldGroup } from "./FieldGroup";
import { MasterDataFields } from "./MasterDataFields";
import { OperatorSelection } from "./OperatorSelection";

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
}) {
  if (action === "create" || action === "edit") {
    return <MasterDataFields form={form} updateValue={updateValue} />;
  }

  if (action === "checkin") {
    return (
      <FieldGroup title="Ingreso a patio" icon={Truck}>
        <Input required label="Nombre del conductor" value={form.driverName} onChange={(event) => updateValue("driverName", event.target.value)} />
        <Input required label="Documento del conductor" value={form.driverDocument} onChange={(event) => updateValue("driverDocument", event.target.value)} />
        <Input required label="Placa del vehículo" value={form.vehiclePlate} onChange={(event) => updateValue("vehiclePlate", event.target.value)} className="md:col-span-2" />
      </FieldGroup>
    );
  }

  if (action === "assign" || action === "reassign") {
    return (
      <div className="space-y-4">
        <FieldGroup title="Recursos" icon={Wrench}>
          <Select required label="Muelle" value={form.dockId} onChange={(event) => updateValue("dockId", event.target.value)}>
            <option value="">Seleccione un muelle</option>
            {(candidates?.docks || []).map((dock) => (
              <option key={dock.Id} value={dock.Id}>
                {dock.Name}
              </option>
            ))}
          </Select>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            {candidatesLoading ? "Consultando candidatos..." : `Versión de candidatos: ${candidates?.version || "-"}`}
          </div>
        </FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <OperatorSelection checkedIds={form.seniorIds} operators={seniorOperators} title="Operarios senior" toggleOperator={(id) => toggleOperator("seniorIds", id)} />
          <OperatorSelection checkedIds={form.juniorIds} operators={juniorOperators} title="Operarios junior" toggleOperator={(id) => toggleOperator("juniorIds", id)} />
        </div>
      </div>
    );
  }

  if (action === "startProcess") {
    return (
      <FieldGroup title="Inicio de proceso" icon={Clock}>
        <Input required label="Entrega de documentos" type="datetime-local" value={form.documentDeliveryAt} onChange={(event) => updateValue("documentDeliveryAt", event.target.value)} />
        <Input required label="Inicio real del proceso" type="datetime-local" value={form.processStartAt} onChange={(event) => updateValue("processStartAt", event.target.value)} />
      </FieldGroup>
    );
  }

  if (action === "toSign") {
    return (
      <FieldGroup title="Cierre operativo" icon={FileCheck}>
        <Input required label="Fin de proceso" type="datetime-local" value={form.processEndAt} onChange={(event) => updateValue("processEndAt", event.target.value)} className="md:col-span-2" />
      </FieldGroup>
    );
  }

  if (action === "finalize") {
    return (
      <div className="space-y-4">
        <FieldGroup title="Finalización" icon={Calendar}>
          <Input required label="Fecha de finalización" type="datetime-local" value={form.finalizedAt} onChange={(event) => updateValue("finalizedAt", event.target.value)} />
          <Input required label="Peso movido (kg)" type="number" min="0" step="0.01" value={form.movedWeightKg} onChange={(event) => updateValue("movedWeightKg", event.target.value)} />
        </FieldGroup>
        <FieldGroup title="Incumplimientos" icon={AlertCircle}>
          <Input label="Causal OTC" value={form.otcNonComplianceReason} onChange={(event) => updateValue("otcNonComplianceReason", event.target.value)} />
          <Input label="Causal OTS" value={form.otsNonComplianceReason} onChange={(event) => updateValue("otsNonComplianceReason", event.target.value)} />
          <Textarea
            label="Comentario"
            value={form.nonComplianceComment}
            onChange={(event) => updateValue("nonComplianceComment", event.target.value)}
            rows={4}
            className="md:col-span-2"
          />
        </FieldGroup>
      </div>
    );
  }

  if (action === "checkout") {
    return (
      <FieldGroup title="Salida de patio" icon={Truck}>
        <Input required label="Fecha de checkout" type="datetime-local" value={form.checkoutAt} onChange={(event) => updateValue("checkoutAt", event.target.value)} className="md:col-span-2" />
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        La cita #{appointment?.Id} será eliminada. Esta acción solo aplica para citas en estado <strong>AGENDADA</strong>.
      </div>
    );
  }

  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No hay formulario configurado para esta acción.</div>;
}
