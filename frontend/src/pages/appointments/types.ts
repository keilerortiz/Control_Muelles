import type { ReactNode } from "react";
import type { AppointmentActionType } from "../../components/domain/appointmentActionModal/formUtils";

export type AppointmentActionKey = AppointmentActionType;

export type AppointmentRow = {
  Id?: number;
  Status?: string;
  ClientName?: string;
  OperationTypeName?: string;
  OperationType?: string;
  [key: string]: unknown;
};

export interface AppointmentFilterBarProps {
  search: string;
  status: string;
  clientFilter: string;
  operationFilter: string;
  canCreate: boolean;
  clientOptions: string[];
  operationOptions: string[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onStatusChange: (value: string) => void;
  onClientFilterChange: (value: string) => void;
  onOperationFilterChange: (value: string) => void;
  onResetFilters: () => void;
  onCreate: () => void;
}

export interface AppointmentsPageProps {
  title?: string;
  headerContent?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  readOnly?: boolean;
}
