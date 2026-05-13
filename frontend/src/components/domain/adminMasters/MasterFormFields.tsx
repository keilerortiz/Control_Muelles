import { Checkbox } from "../../ui/Checkbox";
import { Input } from "../../ui/Input";
import { Textarea } from "../../ui/Textarea";
import type { MasterCatalogs, MasterRoleOption } from "../../../domain/types/masters";

type TabKey = "clients" | "vehicleTypes" | "operationTypes" | "users" | "standards";
type MasterFieldValue = string | number | boolean | string[];

interface MasterFormState {
  name: string;
  standardTimeMinutes?: string | number;
  toleranceMinutes?: string | number;
  description: string;
  email: string;
  password: string;
  roleCodes: string[];
  isActive: boolean;
}

interface MasterFormFieldsProps {
  tabKey: TabKey;
  form: MasterFormState;
  updateValue: (field: string, value: MasterFieldValue) => void;
  catalogs: MasterCatalogs;
}

export function MasterFormFields({
  tabKey,
  form,
  updateValue,
  catalogs,
}: MasterFormFieldsProps) {
  if (tabKey === "users") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} />
        <Input label="Correo" type="email" value={form.email} onChange={(event) => updateValue("email", event.target.value)} />
        <Input
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(event) => updateValue("password", event.target.value)}
          description="Déjalo vacío para conservar la actual."
        />
        <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
          <p className="text-sm font-medium text-neutral-700">Roles</p>
          <div className="grid gap-2">
            {(catalogs.roles || []).map((role: MasterRoleOption) => (
              <Checkbox
                key={role.value}
                label={role.label}
                checked={form.roleCodes[0] === role.value}
                onChange={(event) => updateValue("roleCodes", event.target.checked ? [role.value] : [])}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <Checkbox
            label="Usuario activo"
            checked={form.isActive}
            onChange={(event) => updateValue("isActive", event.target.checked)}
          />
        </div>
      </div>
    );
  }

  if (tabKey === "standards") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
        <Input label="Minutos estándar" type="number" min="1" value={form.standardTimeMinutes} onChange={(event) => updateValue("standardTimeMinutes", event.target.value)} />
        <Input label="Tolerancia" type="number" min="0" value={form.toleranceMinutes} onChange={(event) => updateValue("toleranceMinutes", event.target.value)} />
        <Textarea label="Descripción" rows={4} value={form.description} onChange={(event) => updateValue("description", event.target.value)} className="md:col-span-2" />
        <div className="md:col-span-2">
          <Checkbox label="Estándar activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
        </div>
      </div>
    );
  }

  if (tabKey === "operationTypes") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
        <Input label="Tiempo estándar base" type="number" min="1" value={form.standardTimeMinutes} onChange={(event) => updateValue("standardTimeMinutes", event.target.value)} />
        <div className="flex items-end">
          <Checkbox label="Activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Input label="Nombre" value={form.name} onChange={(event) => updateValue("name", event.target.value)} className="md:col-span-2" />
      <div className="md:col-span-2">
        <Checkbox label="Activo" checked={form.isActive} onChange={(event) => updateValue("isActive", event.target.checked)} />
      </div>
    </div>
  );
}

