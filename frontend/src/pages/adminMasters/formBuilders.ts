import type { CatalogTabKey, MasterFormState, MasterRow, RuleFormState } from "./types";

export interface RulePayload {
  [key: string]: unknown;
  clientId: number;
  vehicleTypeId: number;
  operationTypeId: number;
  standardId: number;
  isActive: boolean;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toIdValue(value: unknown): string | number {
  return typeof value === "string" || typeof value === "number" ? value : "";
}

export function buildInitialForm(tabKey: CatalogTabKey, item: MasterRow | null): MasterFormState {
  if (tabKey === "operationTypes") {
    return {
      name: item?.Name || "",
      standardTimeMinutes: item?.StandardTimeMinutes || 60,
      toleranceMinutes: 0,
      description: "",
      email: "",
      password: "",
      roleCodes: [],
      isActive: item?.IsActive ?? true,
    };
  }

  if (tabKey === "standards") {
    return {
      name: item?.Name || "",
      standardTimeMinutes: item?.StandardTimeMinutes || 60,
      toleranceMinutes: item?.ToleranceMinutes || 0,
      description: item?.Description || "",
      email: "",
      password: "",
      roleCodes: [],
      isActive: item?.IsActive ?? true,
    };
  }

  if (tabKey === "users") {
    return {
      name: item?.Name || "",
      email: item?.Email || "",
      password: "",
      roleCodes: toStringArray(item?.roleCodes),
      description: "",
      isActive: item?.IsActive ?? true,
    };
  }

  return {
    name: item?.Name || "",
    description: "",
    email: "",
    password: "",
    roleCodes: [],
    isActive: item?.IsActive ?? true,
  };
}

export function buildPayload(tabKey: CatalogTabKey, form: MasterFormState, isEditing: boolean): Record<string, unknown> {
  if (tabKey === "operationTypes") {
    return {
      name: form.name.trim(),
      standardTimeMinutes: Number(form.standardTimeMinutes),
      isActive: Boolean(form.isActive),
    };
  }

  if (tabKey === "standards") {
    return {
      name: form.name.trim(),
      standardTimeMinutes: Number(form.standardTimeMinutes),
      toleranceMinutes: Number(form.toleranceMinutes),
      description: form.description?.trim() || null,
      isActive: Boolean(form.isActive),
    };
  }

  if (tabKey === "users") {
    const normalizedPassword = form.password?.trim() || "";
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      roleCodes: form.roleCodes.slice(0, 1),
      isActive: Boolean(form.isActive),
    };

    if (!isEditing || normalizedPassword) {
      payload.password = normalizedPassword;
    }

    return payload;
  }

  return {
    name: form.name.trim(),
    isActive: Boolean(form.isActive),
  };
}

export function validateForm(tabKey: CatalogTabKey, form: MasterFormState, isEditing: boolean): string {
  if (tabKey === "users") {
    const normalizedPassword = form.password?.trim() || "";
    if (!form.name.trim() || !form.email.trim() || form.roleCodes.length !== 1) {
      return "Nombre, correo y un único rol son obligatorios.";
    }
    if (!isEditing && !normalizedPassword) {
      return "La contraseña es obligatoria para un usuario nuevo.";
    }
    if (normalizedPassword && normalizedPassword.length < 8) {
      return "La contraseña debe tener mínimo 8 caracteres.";
    }
    return "";
  }

  if (!form.name?.trim()) {
    return "El nombre es obligatorio.";
  }

  return "";
}

export function buildInitialRuleForm(item: MasterRow | null): RuleFormState {
  return {
    clientId: toIdValue(item?.ClientId),
    vehicleTypeId: toIdValue(item?.VehicleTypeId),
    operationTypeId: toIdValue(item?.OperationTypeId),
    standardTimeMinutes: toIdValue(item?.StandardTimeMinutes),
    isActive: item?.IsActive ?? true,
  };
}

export function buildRulePayload(form: RuleFormState, standardId: string | number): RulePayload {
  return {
    clientId: Number(form.clientId),
    vehicleTypeId: Number(form.vehicleTypeId),
    operationTypeId: Number(form.operationTypeId),
    standardId: Number(standardId),
    isActive: Boolean(form.isActive),
  };
}
