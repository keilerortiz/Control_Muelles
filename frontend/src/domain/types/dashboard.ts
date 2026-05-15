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

export interface DashboardTimelineBucket {
  label: string;
  hour: number;
  otcRate?: number | null;
  otsRate?: number | null;
}

export interface DashboardKpisTimeline {
  timezone: string;
  buckets: DashboardTimelineBucket[];
}

export interface OperatorPerformanceItem {
  operatorId: number;
  name: string;
  role: "Senior" | "Junior";
  executedMinutes: number;
  totalOperations: number;
  compliantOperations: number;
  otsRate: number;
}

export interface OperatorPerformanceResponse {
  items: OperatorPerformanceItem[];
}
