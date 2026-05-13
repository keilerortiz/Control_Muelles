export type AppointmentStatus =
  | "AGENDADA"
  | "EN_PATIO"
  | "ENTREGA_DOCUMENTOS"
  | "EN_PROCESO"
  | "PARA_FIRMAR"
  | "FINALIZADO"
  | "ATENDIDA"
  | "OPERACION_CANCELADA"
  | string;

export interface Appointment {
  Id: number;
  Status?: AppointmentStatus;
  [key: string]: unknown;
}

export interface AppointmentDetail extends Appointment {
  statusLog?: AppointmentStatusLog[];
}

export interface AppointmentStatusLog {
  Id?: number;
  appointmentId?: number;
  NewStatus?: AppointmentStatus;
  ChangedAt?: string;
  [key: string]: unknown;
}

export interface AppointmentCandidate {
  Id?: number;
  Name?: string;
  OperatorLevel?: "SENIOR" | "JUNIOR" | string;
  ActiveAssignments?: number;
  MaxConcurrentOperations?: number;
  [key: string]: unknown;
}

export interface AppointmentCandidates {
  version?: number;
  docks?: AppointmentCandidate[];
  operators?: AppointmentCandidate[];
  [key: string]: unknown;
}

export interface AppointmentListParams {
  [key: string]: unknown;
}

export interface AppointmentListResponse {
  items: Appointment[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface AppointmentMutationPayload {
  [key: string]: unknown;
}

export interface AppointmentMutationVars {
  appointmentId: number;
  payload: AppointmentMutationPayload;
}
