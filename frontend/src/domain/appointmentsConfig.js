export const appointmentStatuses = [
  "AGENDADA",
  "EN_PATIO",
  "ENTREGA_DOCUMENTOS",
  "EN_PROCESO",
  "PARA_FIRMAR",
  "FINALIZADO",
  "ATENDIDA",
  "OPERACION_CANCELADA",
];

export const appointmentMasterData = {
  clients: [
    { value: 1, label: "Cliente A" },
    { value: 2, label: "Cliente B" },
  ],
  operationTypes: [
    { value: 1, label: "Descargue" },
    { value: 2, label: "Cargue" },
  ],
  vehicleTypes: [
    { value: 1, label: "Camion Sencillo" },
    { value: 2, label: "Tractomula" },
  ],
};

export const actionLabels = {
  create: "Nueva cita",
  edit: "Editar",
  remove: "Eliminar",
  checkin: "Check-in",
  assign: "Asignar",
  reassign: "Reasignar",
  startProcess: "Iniciar proceso",
  toSign: "Pasar a firma",
  finalize: "Finalizar",
  checkout: "Checkout",
  cancel: "Cancelar",
};

export const actionMatrix = {
  AGENDADA: [
    { key: "edit", roles: ["PLANEADOR", "ADMIN"] },
    { key: "remove", roles: ["PLANEADOR", "ADMIN"] },
    { key: "checkin", roles: ["PORTERIA", "ADMIN"] },
  ],
  EN_PATIO: [
    { key: "assign", roles: ["SUPERVISOR", "ADMIN"] },
    { key: "cancel", roles: ["SUPERVISOR", "ADMIN"] },
  ],
  ENTREGA_DOCUMENTOS: [{ key: "startProcess", roles: ["PLANEADOR", "ADMIN"] }],
  EN_PROCESO: [
    { key: "reassign", roles: ["SUPERVISOR", "ADMIN"] },
    { key: "toSign", roles: ["PLANEADOR", "ADMIN"] },
    { key: "cancel", roles: ["SUPERVISOR", "ADMIN"] },
  ],
  PARA_FIRMAR: [{ key: "finalize", roles: ["SUPERVISOR", "ADMIN"] }],
  FINALIZADO: [{ key: "checkout", roles: ["PORTERIA", "ADMIN"] }],
  ATENDIDA: [],
  OPERACION_CANCELADA: [],
};

export function getAvailableActions(status, roles) {
  const actionConfig = actionMatrix[status] || [];
  return actionConfig.filter((action) => action.roles.some((role) => roles.includes(role)));
}

export function toDateTimeLocalValue(value) {
  if (!value) return "";
  const normalized = new Date(value);
  const timezoneOffset = normalized.getTimezoneOffset() * 60_000;
  return new Date(normalized.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.code ||
    error?.message ||
    "No fue posible completar la operación."
  );
}
