// src/components/domain/MasterDataFields.jsx
import { useMemo } from "react";
import { ClipboardList } from "lucide-react";

import { useMasterCatalogs } from "../../../hooks/useMasters";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { FieldGroup } from "./FieldGroup";

export function MasterDataFields({ form, updateValue }) {
  const catalogsQuery = useMasterCatalogs();
  const clients = (catalogsQuery.data?.clients || [])
    .filter((item) => item.IsActive)
    .map((item) => ({ value: item.Id, label: item.Name }));
  const operationTypesById = useMemo(
    () => new Map((catalogsQuery.data?.operationTypes || []).map((item) => [Number(item.Id), item])),
    [catalogsQuery.data?.operationTypes],
  );
  const vehicleTypesById = useMemo(
    () => new Map((catalogsQuery.data?.vehicleTypes || []).map((item) => [Number(item.Id), item])),
    [catalogsQuery.data?.vehicleTypes],
  );
  const activeRules = (catalogsQuery.data?.businessRules || []).filter((rule) => rule.IsActive);

  const selectedClientId = Number(form.clientId) || null;
  const selectedOperationTypeId = Number(form.operationTypeId) || null;

  const operationTypes = useMemo(() => {
    if (!selectedClientId) return [];
    const ids = new Set(
      activeRules
        .filter((rule) => Number(rule.ClientId) === selectedClientId)
        .map((rule) => Number(rule.OperationTypeId)),
    );
    return [...ids]
      .map((id) => operationTypesById.get(id))
      .filter((item) => item?.IsActive)
      .map((item) => ({ value: item.Id, label: item.Name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [activeRules, operationTypesById, selectedClientId]);

  const vehicleTypes = useMemo(() => {
    if (!selectedClientId || !selectedOperationTypeId) return [];
    const ids = new Set(
      activeRules
        .filter(
          (rule) =>
            Number(rule.ClientId) === selectedClientId &&
            Number(rule.OperationTypeId) === selectedOperationTypeId,
        )
        .map((rule) => Number(rule.VehicleTypeId)),
    );
    return [...ids]
      .map((id) => vehicleTypesById.get(id))
      .filter((item) => item?.IsActive)
      .map((item) => ({ value: item.Id, label: item.Name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [activeRules, selectedClientId, selectedOperationTypeId, vehicleTypesById]);

  const handleClientChange = (value) => {
    updateValue("clientId", value);
    updateValue("operationTypeId", "");
    updateValue("vehicleTypeId", "");
  };

  const handleOperationTypeChange = (value) => {
    updateValue("operationTypeId", value);
    updateValue("vehicleTypeId", "");
  };

  return (
    <FieldGroup title="Datos de la cita" icon={ClipboardList}>
      <Select
        label="Cliente"
        required
        value={form.clientId}
        onChange={(event) => handleClientChange(event.target.value)}
      >
        <option value="">Seleccione el cliente</option>
        {clients.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Select
        label="Tipo de operación"
        required
        value={form.operationTypeId}
        onChange={(event) => handleOperationTypeChange(event.target.value)}
        disabled={!selectedClientId}
      >
        <option value="">{selectedClientId ? "Seleccione el tipo de operación" : "Primero seleccione cliente"}</option>
        {operationTypes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Select
        label="Tipo de vehículo"
        required
        value={form.vehicleTypeId}
        onChange={(event) => updateValue("vehicleTypeId", event.target.value)}
        disabled={!selectedClientId || !selectedOperationTypeId}
      >
        <option value="">
          {selectedClientId && selectedOperationTypeId
            ? "Seleccione el tipo de vehículo"
            : "Primero seleccione cliente y operación"}
        </option>
        {vehicleTypes.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </Select>

      <Input
        label="Toneladas estimadas"
        required
        type="number"
        min="0"
        step="0.01"
        value={form.estimatedTons}
        onChange={(event) => updateValue("estimatedTons", event.target.value)}
      />

      <Input
        label="Fecha y hora programada"
        required
        type="datetime-local"
        value={form.scheduledAt}
        onChange={(event) => updateValue("scheduledAt", event.target.value)}
        className="md:col-span-2"
      />

      <Input
        label="Nombre del conductor"
        value={form.driverName}
        onChange={(event) => updateValue("driverName", event.target.value)}
      />

      <Input
        label="Cédula del conductor"
        type="number"
        min="0"
        step="1"
        value={form.driverDocument}
        onChange={(event) => updateValue("driverDocument", event.target.value)}
      />

      <Input
        label="Placa del vehículo"
        value={form.vehiclePlate}
        onChange={(event) => updateValue("vehiclePlate", event.target.value)}
        maxLength={6}
        className="md:col-span-2"
      />

      <Textarea
        label="Observaciones"
        value={form.nonComplianceComment}
        onChange={(event) => updateValue("nonComplianceComment", event.target.value)}
        rows={3}
        placeholder="Ingrese cualquier observación adicional..."
        className="md:col-span-2"
      />
    </FieldGroup>
  );
}
