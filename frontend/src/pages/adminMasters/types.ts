import type { MasterRecord } from "../../domain/types/masters";

export type TabKey = "clients" | "vehicleTypes" | "operationTypes" | "users";
export type CatalogTabKey = TabKey | "standards";

export const PAGE_SIZE = 10;

export type MasterFieldValue = string | number | boolean | string[];

export interface MasterFormState {
  name: string;
  standardTimeMinutes?: string | number;
  toleranceMinutes?: string | number;
  description: string;
  email: string;
  password: string;
  roleCodes: string[];
  isActive: boolean;
}

export interface RuleFormState {
  clientId: string | number;
  vehicleTypeId: string | number;
  operationTypeId: string | number;
  standardTimeMinutes: string | number;
  isActive: boolean;
}

export type MasterRow = MasterRecord & Record<string, unknown>;
