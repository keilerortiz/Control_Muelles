import type { AppointmentStatus } from "./types/appointments";
import type { RoleCode } from "./types/auth";

// ============================================
// Constantes de roles (para evitar typos)
// ============================================
export const ROLES = {
  PLANNER: "PLANEADOR",
  ADMIN: "ADMIN",
  GATE: "PORTERIA",
  SUPERVISOR: "SUPERVISOR",
};

// ============================================
// Estados de citas
// ============================================
export const appointmentStatuses = [
  "AGENDADA",
  "EN_PATIO",
  "ENTREGA_DOCUMENTOS",
  "EN_PROCESO",
  "PARA_FIRMAR",
  "FINALIZADO",
  "ATENDIDA",
  "OPERACION_CANCELADA",
] as const;

export const statusLabels: Record<AppointmentStatus, string> = {
  AGENDADA: "Agendada",
  EN_PATIO: "En patio",
  ENTREGA_DOCUMENTOS: "Entrega documentos",
  EN_PROCESO: "En proceso",
  PARA_FIRMAR: "Para firmar",
  FINALIZADO: "Finalizado",
  ATENDIDA: "Atendida",
  OPERACION_CANCELADA: "Operación cancelada",
};

// ============================================
// Etiquetas de acciones (vistas)
// ============================================
export const actionLabels: Record<string, string> = {
  create: "Nueva cita",
  edit: "Editar",
  remove: "Eliminar",
  checkin: "Ingreso",
  assign: "Asignar",
  reassign: "Reasignar",
  startProcess: "Iniciar proceso",
  toSign: "Pasar a firmar",
  finalize: "Finalizar",
  checkout: "Salida",
  cancel: "Cancelar",
};

// ============================================
// Matriz de acciones por estado y rol
// ============================================
export const actionMatrix: Record<AppointmentStatus, Array<{ key: string; roles: RoleCode[] }>> = {
  AGENDADA: [
    { key: "edit", roles: [ROLES.PLANNER, ROLES.ADMIN] },
    { key: "remove", roles: [ROLES.PLANNER, ROLES.ADMIN] },
    { key: "checkin", roles: [ROLES.GATE, ROLES.ADMIN] },
  ],
  EN_PATIO: [
    { key: "assign", roles: [ROLES.SUPERVISOR, ROLES.ADMIN] },
    { key: "cancel", roles: [ROLES.SUPERVISOR, ROLES.ADMIN] },
  ],
  ENTREGA_DOCUMENTOS: [{ key: "startProcess", roles: [ROLES.PLANNER, ROLES.ADMIN] }],
  EN_PROCESO: [
    { key: "reassign", roles: [ROLES.SUPERVISOR, ROLES.ADMIN] },
    { key: "toSign", roles: [ROLES.PLANNER, ROLES.ADMIN] },
    { key: "cancel", roles: [ROLES.SUPERVISOR, ROLES.ADMIN] },
  ],
  PARA_FIRMAR: [{ key: "finalize", roles: [ROLES.SUPERVISOR, ROLES.ADMIN] }],
  FINALIZADO: [{ key: "checkout", roles: [ROLES.GATE, ROLES.ADMIN] }],
  ATENDIDA: [],
  OPERACION_CANCELADA: [],
};

function parseApiDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;

  const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Obtiene las acciones disponibles para un estado y rol(es) dados.
 * @param {string} status - Estado de la cita (ej: "AGENDADA")
 * @param {string[]} roles - Array de roles del usuario (ej: ["ADMIN"])
 * @returns {Array<{key: string, roles: string[]}>}
 */
export function getAvailableActions(status: AppointmentStatus, roles: RoleCode[]) {
  const actionConfig = actionMatrix[status] || [];
  return actionConfig.filter((action) => action.roles.some((role) => roles.includes(role)));
}

// ============================================
// Utilidades de fechas (para inputs datetime-local)
// ============================================
/**
 * Convierte una fecha (Date o string ISO) a formato YYYY-MM-DDThh:mm para <input type="datetime-local">
 * Ajusta la zona horaria local para que el input muestre la fecha/hora correcta.
 */
export function toDateTimeLocalValue(value: unknown): string {
  if (!value) return "";
  const date = parseApiDate(value);
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
  return localISOTime;
}

/**
 * Convierte un valor de input datetime-local (YYYY-MM-DDThh:mm) a ISO string UTC.
 */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Formatea una fecha para mostrar al usuario (ej: "31/12/2023, 14:30")
 */
export function formatDateTime(value: unknown): string {
  if (!value) return "-";
  const date = parseApiDate(value);
  if (!date) return "-";
  return date.toLocaleString();
}

// ============================================
// Manejo de errores de API
// ============================================
/**
 * Extrae un mensaje de error legible desde un error de Axios u objeto Error.
 */
type ErrorLike = {
  message?: string;
  response?: { data?: { message?: string } };
};

function isErrorLike(value: unknown): value is ErrorLike {
  return typeof value === "object" && value !== null;
}

export function getErrorMessage(error: unknown): string {
  if (isErrorLike(error) && typeof error.response?.data?.message === "string") {
    return error.response.data.message;
  }

  if (isErrorLike(error) && typeof error.message === "string") {
    return error.message;
  }

  return "No fue posible completar la operación.";
}

export function getQueryErrorMessage(error: unknown, fallback: string): string {
  const message = getErrorMessage(error);
  if (message.includes("Payload API inválido") || message.includes("Respuesta API inválida")) {
    return "Error loading data: invalid response format";
  }
  return fallback;
}
