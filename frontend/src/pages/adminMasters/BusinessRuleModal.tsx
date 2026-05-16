import type { FormEvent } from "react";
import { Save, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Input } from "../../components/ui/Input";
import { Modal, ModalFooter } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import type { MasterCatalogs } from "../../domain/types/masters";
import type { MasterRow, RuleFormState } from "./types";

interface BusinessRuleModalProps {
  open: boolean;
  editingRule: MasterRow | null;
  catalogs: MasterCatalogs;
  formState: RuleFormState;
  error: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (nextState: RuleFormState | ((current: RuleFormState) => RuleFormState)) => void;
}

export function BusinessRuleModal({
  open,
  editingRule,
  catalogs,
  formState,
  error,
  isPending,
  onClose,
  onSubmit,
  onChange,
}: BusinessRuleModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingRule ? "Editar regla" : "Nueva regla"}
      size="lg"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Cliente"
            value={formState.clientId}
            onChange={(event) => onChange((current) => ({ ...current, clientId: event.target.value }))}
            disabled={Boolean(editingRule)}
          >
            <option value="">Seleccione</option>
            {(catalogs.clients || []).map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Name}
              </option>
            ))}
          </Select>

          <Select
            label="Tipo de vehículo"
            value={formState.vehicleTypeId}
            onChange={(event) => onChange((current) => ({ ...current, vehicleTypeId: event.target.value }))}
            disabled={Boolean(editingRule)}
          >
            <option value="">Seleccione</option>
            {(catalogs.vehicleTypes || []).map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Name}
              </option>
            ))}
          </Select>

          <Select
            label="Tipo de operación"
            value={formState.operationTypeId}
            onChange={(event) => onChange((current) => ({ ...current, operationTypeId: event.target.value }))}
            disabled={Boolean(editingRule)}
          >
            <option value="">Seleccione</option>
            {(catalogs.operationTypes || []).map((item) => (
              <option key={item.Id} value={item.Id}>
                {item.Name}
              </option>
            ))}
          </Select>

          <Input
            label="Tiempo estándar (min)"
            type="number"
            min="1"
            value={formState.standardTimeMinutes}
            onChange={(event) => onChange((current) => ({ ...current, standardTimeMinutes: event.target.value }))}
          />

          <div className="md:col-span-2">
            <Checkbox
              label="Regla activa"
              checked={formState.isActive}
              onChange={(event) => onChange((current) => ({ ...current, isActive: event.target.checked }))}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </div>
        ) : null}

        <ModalFooter className="gap-3">
          <Button type="button" variant="secondary" onClick={onClose} leftIcon={<X />}>
            Cerrar
          </Button>
          <Button type="submit" disabled={isPending} leftIcon={<Save />}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
