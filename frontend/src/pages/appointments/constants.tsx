import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSignature,
  LogIn,
  LogOut,
  Pencil,
  Play,
  RefreshCw,
  Timer,
  Trash2,
  Wrench,
  Ban,
} from "lucide-react";

import type { AppointmentActionType } from "../../components/domain/appointmentActionModal/formUtils";

export const createAllowedRoles = ["PLANEADOR"] as const;
export const candidateActions = new Set<AppointmentActionType>(["assign", "reassign"]);
export const PAGE_SIZE = 10;

export const plannerKpiTemplate = [
  {
    key: "agendada",
    label: "Agendadas",
    tone: "border-brand-200/80 bg-brand-50/80 text-brand-700",
    iconBox: "border-brand-200 bg-brand-100/70 text-brand-700",
    icon: CalendarDays,
  },
  {
    key: "en_patio",
    label: "En patio",
    tone: "border-warning-200/80 bg-warning-50/80 text-warning-700",
    iconBox: "border-warning-200 bg-warning-100/70 text-warning-700",
    icon: Timer,
  },
  {
    key: "entrega_documentos",
    label: "Documentos",
    tone: "border-brand-200/80 bg-brand-50/80 text-brand-700",
    iconBox: "border-brand-200 bg-brand-100/70 text-brand-700",
    icon: ClipboardCheck,
  },
  {
    key: "en_proceso",
    label: "En proceso",
    tone: "border-success-200/80 bg-success-50/80 text-success-700",
    iconBox: "border-success-200 bg-success-100/70 text-success-700",
    icon: Play,
  },
  {
    key: "para_firmar",
    label: "Para firmar",
    tone: "border-brand-200/80 bg-brand-50/80 text-brand-700",
    iconBox: "border-brand-200 bg-brand-100/70 text-brand-700",
    icon: FileSignature,
  },
  {
    key: "retrasada",
    label: "Alertas",
    tone: "border-error-200/80 bg-error-50/80 text-error-700",
    iconBox: "border-error-200 bg-error-100/70 text-error-700",
    icon: AlertTriangle,
  },
] as const;

export const actionIconByKey = {
  edit: <Pencil className="h-4 w-4" />,
  remove: <Trash2 className="h-4 w-4" />,
  checkin: <LogIn className="h-4 w-4" />,
  assign: <Wrench className="h-4 w-4" />,
  reassign: <RefreshCw className="h-4 w-4" />,
  startProcess: <Play className="h-4 w-4" />,
  toSign: <FileSignature className="h-4 w-4" />,
  finalize: <CheckCircle2 className="h-4 w-4" />,
  checkout: <LogOut className="h-4 w-4" />,
  cancel: <Ban className="h-4 w-4" />,
};
