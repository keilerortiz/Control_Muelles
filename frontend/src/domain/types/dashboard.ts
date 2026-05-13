export interface DashboardAlert {
  type: string;
  appointmentId?: number | string;
  severity?: "HIGH" | "MEDIUM" | "LOW" | string;
  message?: string;
  [key: string]: unknown;
}

export interface DashboardKpis {
  otcRate?: number;
  otsRate?: number;
  cumpleCitaRate?: number;
  [key: string]: unknown;
}

export interface DashboardOperationalState {
  activeOperations?: number;
  [key: string]: unknown;
}

export interface DashboardSummary {
  total?: number;
  activeOperations?: number;
  completionRate?: number;
  en_patio?: number;
  entrega_documentos?: number;
  en_proceso?: number;
  para_firmar?: number;
  retrasada?: number;
  operationalState?: DashboardOperationalState;
  kpis?: DashboardKpis;
  alerts?: DashboardAlert[];
  [key: string]: unknown;
}

export interface DashboardParams {
  [key: string]: unknown;
}
