import type { QueryClient } from "@tanstack/react-query";

import type { MasterCatalogs } from "../../domain/types/masters";
import type { RulePayload } from "./formBuilders";
import type { MasterRow } from "./types";

interface SyncArgs {
  queryClient: QueryClient;
  catalogs: MasterCatalogs;
  ruleMinutes: number;
  createdStandard: MasterRow | null;
  savedRule: MasterRow;
  payload: RulePayload;
}

export function syncCatalogsAfterRuleSave({
  queryClient,
  catalogs,
  ruleMinutes,
  createdStandard,
  savedRule,
  payload,
}: SyncArgs) {
  const selectedClient = (catalogs.clients || []).find((item) => Number(item.Id) === Number(payload.clientId));
  const selectedVehicleType = (catalogs.vehicleTypes || []).find((item) => Number(item.Id) === Number(payload.vehicleTypeId));
  const selectedOperationType = (catalogs.operationTypes || []).find((item) => Number(item.Id) === Number(payload.operationTypeId));
  const selectedStandard = createdStandard
    || (catalogs.standards || []).find((item) => Number(item.Id) === Number(payload.standardId));

  queryClient.setQueryData<MasterCatalogs>(["master-catalogs"], (currentCatalogs) => {
    if (!currentCatalogs) return currentCatalogs;

    const nextStandards = createdStandard
      ? [...(currentCatalogs.standards || []), createdStandard]
      : currentCatalogs.standards || [];

    const baseRule = {
      ClientId: payload.clientId,
      VehicleTypeId: payload.vehicleTypeId,
      OperationTypeId: payload.operationTypeId,
      StandardId: payload.standardId,
      IsActive: payload.isActive,
      ClientName: selectedClient?.Name || "-",
      VehicleTypeName: selectedVehicleType?.Name || "-",
      OperationTypeName: selectedOperationType?.Name || "-",
      StandardTimeMinutes: selectedStandard?.StandardTimeMinutes || ruleMinutes,
    };

    const normalizedRule = { ...baseRule, ...savedRule };
    const rules = currentCatalogs.businessRules || [];
    const ruleIndex = rules.findIndex((item) => Number(item.Id) === Number(normalizedRule.Id));
    const nextBusinessRules =
      ruleIndex === -1
        ? [...rules, normalizedRule]
        : rules.map((item, index) => (index === ruleIndex ? { ...item, ...normalizedRule } : item));

    return {
      ...currentCatalogs,
      standards: nextStandards,
      businessRules: nextBusinessRules,
    };
  });
}
