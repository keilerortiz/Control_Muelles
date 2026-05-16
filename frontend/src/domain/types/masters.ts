export interface MasterRecord {
  Id?: number | string;
  Name?: string;
  Email?: string;
  IsActive?: boolean;
  ReasonType?: string;
  OperatorLevel?: string;
  MaxConcurrentOperations?: number;
  StandardTimeMinutes?: number;
  ToleranceMinutes?: number;
  Description?: string;
  [key: string]: unknown;
}

export interface MasterRoleOption {
  value: string;
  label: string;
}

export interface MasterCatalogs {
  clients?: MasterRecord[];
  vehicleTypes?: MasterRecord[];
  operationTypes?: MasterRecord[];
  docks?: MasterRecord[];
  nonComplianceReasons?: MasterRecord[];
  operators?: MasterRecord[];
  standards?: MasterRecord[];
  businessRules?: MasterRecord[];
  users?: MasterRecord[];
  roles?: MasterRoleOption[];
  [key: string]: unknown;
}
