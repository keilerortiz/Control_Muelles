import type { MasterCatalogs } from "../../domain/types/masters";
import type { MasterRow, RuleFormState } from "./types";

export function getRuleValidationError(
  catalogs: MasterCatalogs,
  editingRule: MasterRow | null,
  ruleFormState: RuleFormState,
) {
  if (!ruleFormState.clientId || !ruleFormState.vehicleTypeId || !ruleFormState.operationTypeId || !ruleFormState.standardTimeMinutes) {
    return "Completa todos los campos obligatorios.";
  }

  if (Number(ruleFormState.standardTimeMinutes) <= 0) {
    return "El tiempo estándar debe ser mayor a 0.";
  }

  const duplicate = (catalogs.businessRules || []).find((rule) => {
    if (editingRule && rule.Id === editingRule.Id) return false;
    return (
      rule.IsActive &&
      Number(rule.ClientId) === Number(ruleFormState.clientId) &&
      Number(rule.VehicleTypeId) === Number(ruleFormState.vehicleTypeId) &&
      Number(rule.OperationTypeId) === Number(ruleFormState.operationTypeId)
    );
  });

  if (duplicate) {
    return "Ya existe una regla activa para esa combinación cliente + vehículo + operación.";
  }

  return "";
}
