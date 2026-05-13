import { FileCog, Truck, UserCog, Users } from "lucide-react";
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
  { value: "users", label: "Usuarios", icon: UserCog, resource: "users" },
];

export const tabResourceByKey: Record<TabKey, string> = {
  clients: "clients",
  vehicleTypes: "vehicle-types",
  operationTypes: "operation-types",
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

  return [
    { key: "Name", label: "Nombre" },
    { key: "IsActive", label: "Activo" },
    { key: "actions", label: "Acciones", width: "180px" },
  ];
}
