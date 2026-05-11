// src/components/domain/MasterDataFields.jsx
import { ClipboardList } from "lucide-react";

import { useMasterCatalogs } from "../../../hooks/useMasters";
import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { Textarea } from "../../ui/Textarea";
import { FieldGroup } from "./FieldGroup";

export function MasterDataFields({ form, updateValue }) {
  const catalogsQuery = useMasterCatalogs();
  const clients = (catalogsQuery.data?.clients || []).map((item) => ({ value: item.Id, label: item.Name }));
  const operationTypes = (catalogsQuery.data?.operationTypes || []).map((item) => ({ value: item.Id, label: item.Name }));
  const vehicleTypes = (catalogsQuery.data?.vehicleTypes || []).map((item) => ({ value: item.Id, label: item.Name }));

  return (
    <FieldGroup title="Datos de la cita" icon={ClipboardList}>
      <Select
        label="Cliente"
        required
        value={form.clientId}
        onChange={(event) => updateValue("clientId", event.target.value)}
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
        onChange={(event) => updateValue("operationTypeId", event.target.value)}
      >
        <option value="">Seleccione el tipo de operación</option>
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
      >
        <option value="">Seleccione el tipo de vehículo</option>
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
