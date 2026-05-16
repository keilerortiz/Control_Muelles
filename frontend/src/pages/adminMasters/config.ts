import { AlertTriangle, FileCog, HardHat, Truck, UserCog, Users, Warehouse } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CatalogTabKey, TabKey } from "./types";

export interface MasterTabDefinition {
  value: TabKey;
  label: string;
  icon: LucideIcon;
  resource: string;
}

export const tabDefinitions: MasterTabDefinition[] = [
  { value: "clients", label: "Clientes", icon: Users, resource: "clients" },
  { value: "vehicleTypes", label: "Tipos de vehículo", icon: Truck, resource: "vehicle-types" },
  { value: "operationTypes", label: "Tipos de operación", icon: FileCog, resource: "operation-types" },
  { value: "docks", label: "Muelles", icon: Warehouse, resource: "docks" },
  { value: "operators", label: "Operarios", icon: HardHat, resource: "operators" },
  { value: "nonComplianceReasons", label: "Causales", icon: AlertTriangle, resource: "non-compliance-reasons" },
  { value: "users", label: "Usuarios", icon: UserCog, resource: "users" },
];

export const tabResourceByKey: Record<TabKey, string> = {
  clients: "clients",
  vehicleTypes: "vehicle-types",
  operationTypes: "operation-types",
  docks: "docks",
  operators: "operators",
  nonComplianceReasons: "non-compliance-reasons",
  users: "users",
};

export function createColumns(tabKey: CatalogTabKey) {
  if (tabKey === "users") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "Email", label: "Correo" },
      { key: "roleCodes", label: "Roles" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "standards") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "StandardTimeMinutes", label: "Minutos" },
      { key: "ToleranceMinutes", label: "Tolerancia" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "operationTypes") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "StandardTimeMinutes", label: "Base minutos" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "operators") {
    return [
      { key: "Name", label: "Nombre" },
      { key: "OperatorLevel", label: "Nivel" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  if (tabKey === "nonComplianceReasons") {
    return [
      { key: "Name", label: "Causal" },
      { key: "ReasonType", label: "Tipo" },
      { key: "IsActive", label: "Activo" },
      { key: "actions", label: "Acciones", width: "180px" },
    ];
  }

  return [
    { key: "Name", label: "Nombre" },
    { key: "IsActive", label: "Activo" },
    { key: "actions", label: "Acciones", width: "180px" },
  ];
}
