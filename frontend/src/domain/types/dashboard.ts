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

export interface LogisticsDashboardSummary {
  scheduledVehicles?: number;
  inYardVehicles?: number;
  documentDeliveryVehicles?: number;
  inProcessVehicles?: number;
  toSignVehicles?: number;
  finalizedVehicles?: number;
  attendedVehicles?: number;
  cancelledVehicles?: number;
  activeVehicles?: number;
  movedWeightKg?: number;
  otcRate?: number | null;
  otsRate?: number | null;
  onTimeArrivalRate?: number | null;
  evaluatedOperations?: number;
  cancelledOperations?: number;
  supervisorsWithAssignments?: number;
  seniorOperatorsMeasured?: number;
  riskOperations?: number;
  averageTotalStayMinutes?: number | null;
}

export interface LogisticsStatusFunnelItem {
  status: string;
  label: string;
  total: number;
}

export interface LogisticsProcessDuration {
  code: string;
  label: string;
  averageMinutes: number | null;
  sampleSize: number;
}

export interface LogisticsOperatorOtsBucket {
  hour: number;
  label: string;
  otsRate: number | null;
  totalOperations: number;
}

export interface LogisticsSeniorOperatorOts {
  operatorId: number;
  name: string;
  workedMinutes: number;
  totalOperations: number;
  compliantOperations: number;
  otsRate: number;
  buckets: LogisticsOperatorOtsBucket[];
}

export interface LogisticsSupervisorAssignment {
  supervisorId: number;
  name: string;
  managedVehicles: number;
}

export interface LogisticsOtsBreakdownItem {
  name: string;
  otsRate: number;
  totalOperations: number;
}

export interface LogisticsDashboard {
  summary: LogisticsDashboardSummary;
  statusFunnel: LogisticsStatusFunnelItem[];
  processDurations: LogisticsProcessDuration[];
  bottlenecks: LogisticsProcessDuration[];
  seniorOperatorOts: LogisticsSeniorOperatorOts[];
  supervisorAssignments: LogisticsSupervisorAssignment[];
  otsByClient: LogisticsOtsBreakdownItem[];
  otsByOperationType: LogisticsOtsBreakdownItem[];
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
