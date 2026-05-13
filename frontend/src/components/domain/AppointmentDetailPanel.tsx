import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Circle,
  User,
  Truck,
  Warehouse,
  Clock,
  FileCheck,
  Tag,
  Hash,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import { getAvailableActions, formatDateTime, actionLabels } from "../../domain/appointmentsConfig";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { TablePagination } from "../ui/TablePagination";
import type { AppointmentDetail, AppointmentStatus, AppointmentStatusLog } from "../../domain/types/appointments";
import type { RoleCode } from "../../domain/types/auth";

const PAGE_SIZE = 10;
const timelineSequence = ["AGENDADA", "EN_PATIO", "ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR", "FINALIZADO", "ATENDIDA"];

const statusVisualMap = {
  AGENDADA: { icon: Calendar, tone: "bg-brand-100 text-brand-700 ring-brand-200" },
  EN_PATIO: { icon: Warehouse, tone: "bg-warning-100 text-warning-700 ring-warning-200" },
  ENTREGA_DOCUMENTOS: { icon: FileCheck, tone: "bg-brand-100 text-brand-700 ring-brand-200" },
  EN_PROCESO: { icon: Clock, tone: "bg-success-100 text-success-700 ring-success-200" },
  PARA_FIRMAR: { icon: CheckCircle2, tone: "bg-brand-100 text-brand-700 ring-brand-200" },
  FINALIZADO: { icon: CheckCircle2, tone: "bg-brand-100 text-brand-700 ring-brand-200" },
  ATENDIDA: { icon: CheckCircle2, tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" },
  OPERACION_CANCELADA: { icon: AlertTriangle, tone: "bg-error-100 text-error-700 ring-error-200" },
};

type VisualConfig = { icon: ComponentType<{ className?: string }>; tone: string };

function getChangedByLabel(row: AppointmentStatusLog): string {
  return String(row.ChangedByUserName || row.ChangedByName || row.ChangedByUserId || "-");
}

function getStatusLabel(status?: AppointmentStatus) {
  if (!status) return "-";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getDiffLabel(currentDate: Date | null, previousDate: Date | null) {
  if (!currentDate || !previousDate) return null;
  const diffMs = currentDate.getTime() - previousDate.getTime();
  if (diffMs <= 0) return "0 min";
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

interface DetailFieldProps {
  label: string;
  value?: unknown;
  icon?: ComponentType<{ className?: string }>;
}

function DetailField({ label, value, icon: Icon }: DetailFieldProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3 text-neutral-500" />}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {label}
        </p>
      </div>
      <p className="text-[12px] leading-tight text-neutral-800">
        {value === null || value === undefined || value === "" ? "-" : String(value)}
      </p>
    </div>
  );
}

export function AppointmentDetailPanel({
  appointment,
  statusLog = [],
  roles = [],
  onAction,
  showDetail = true,
  showActions = true,
  showHistory = true,
  historyFullHeight = false,
  historyVariant = "vertical",
  historyHideTitle = false,
  detailFullHeight = false,
}: {
  appointment?: AppointmentDetail | null;
  statusLog?: AppointmentStatusLog[];
  roles?: RoleCode[];
  onAction: (actionKey: string) => void;
  showDetail?: boolean;
  showActions?: boolean;
  showHistory?: boolean;
  historyFullHeight?: boolean;
  historyVariant?: "vertical" | "horizontal-compact";
  historyHideTitle?: boolean;
  detailFullHeight?: boolean;
}) {
  const [historyPage, setHistoryPage] = useState(1);
  useEffect(() => {
    setHistoryPage(1);
  }, [appointment?.Id, statusLog.length]);

  if (!appointment) {
    return (
      <Card title="Detalle de cita" padding="sm">
        <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <p className="text-sm font-medium text-neutral-700">Selecciona una cita</p>
          <p className="text-xs text-neutral-500">Sin selección actual.</p>
        </div>
      </Card>
    );
  }

  const actions = appointment.Status ? getAvailableActions(appointment.Status, roles) : [];

  const renderActions = showActions && (
    <Card title="Acciones">
      {actions.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay acciones disponibles.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.key === "cancel" || action.key === "remove" ? "danger" : "primary"}
              onClick={() => onAction(action.key)}
            >
              {actionLabels[action.key]}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );

  const renderHistory = showHistory && (
    <Card
      title={historyHideTitle ? undefined : "Trazabilidad de estados"}
      padding={historyVariant === "horizontal-compact" ? "sm" : "md"}
      className={historyFullHeight ? "flex min-h-0 flex-1 flex-col" : ""}
      contentClassName={historyFullHeight ? "flex-1 min-h-0" : ""}
    >
      <div className={historyFullHeight ? "flex h-full min-h-0 flex-col space-y-2" : "space-y-2"}>
        {(() => {
          const totalRows = statusLog.length;
          const start = (historyPage - 1) * PAGE_SIZE;
          const end = start + PAGE_SIZE;
          const pagedStatusLog = statusLog.slice(start, end);

          return (
            <>
              <div className={historyVariant === "horizontal-compact" ? "overflow-hidden" : historyFullHeight ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""}>
                {pagedStatusLog.length === 0 ? (
                  <p className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-500">
                    Sin historial de estados.
                  </p>
                ) : (
                  historyVariant === "horizontal-compact" ? (
                    <ol className="flex w-full items-start justify-between gap-1">
                      {timelineSequence.map((statusKey, idx) => {
                        const statusIndexInLog = statusLog.findIndex((row) => row.NewStatus === statusKey);
                        const logRow = statusIndexInLog >= 0 ? statusLog[statusIndexInLog] : null;
                        const visual = statusVisualMap[statusKey as keyof typeof statusVisualMap] as VisualConfig | undefined;
                        const visualConfig = visual || { icon: Circle, tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" };
                        const isCurrent = appointment?.Status === statusKey;
                        const isCompleted = statusIndexInLog >= 0 && !isCurrent;
                        const isPending = statusIndexInLog < 0 && !isCurrent;
                        const Icon = visualConfig.icon;
                        const currentDate = logRow?.ChangedAt ? new Date(logRow.ChangedAt) : null;
                        const previousChangedAt = statusIndexInLog > 0 ? statusLog[statusIndexInLog - 1]?.ChangedAt : undefined;
                        const previousDate = previousChangedAt ? new Date(previousChangedAt) : null;
                        const elapsedLabel = getDiffLabel(currentDate, previousDate);
                        const nodeTone = isPending ? "bg-neutral-50 text-neutral-400 ring-neutral-200" : visualConfig.tone;
                        return (
                          <li key={`${statusKey}-${idx}`} className="relative min-w-0 flex-1 last:flex-none">
                            <div className="flex items-center">
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ring-2 ${nodeTone}`}>
                                <Icon className="h-3 w-3" />
                              </span>
                              {idx < timelineSequence.length - 1 ? <span className="mx-1 h-px flex-1 bg-neutral-300" /> : null}
                            </div>
                            <div className="mt-0.5 min-w-0">
                              <p className={`truncate text-[10px] font-semibold leading-tight ${isPending ? "text-neutral-400" : "text-neutral-800"}`}>{getStatusLabel(statusKey)}</p>
                              <p className="truncate text-[9px] leading-tight text-neutral-500">{logRow ? formatDateTime(logRow.ChangedAt) : "Pendiente"}</p>
                              <p className="truncate text-[9px] leading-tight text-neutral-500">{logRow ? getChangedByLabel(logRow) : "-"}</p>
                              {elapsedLabel ? <p className="truncate text-[9px] font-medium leading-tight text-warning-600">+{elapsedLabel}</p> : null}

                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                  <ol className="space-y-0">
                    {pagedStatusLog.map((row, idx) => {
                      const globalIndex = start + idx;
                      const visual = statusVisualMap[row.NewStatus as keyof typeof statusVisualMap] as VisualConfig | undefined;
                      const visualConfig = visual || { icon: Circle, tone: "bg-neutral-100 text-neutral-700 ring-neutral-200" };
                      const Icon = visualConfig.icon;
                      const currentDate = row.ChangedAt ? new Date(row.ChangedAt) : null;
                      const previousChangedAt = globalIndex > 0 ? statusLog[globalIndex - 1]?.ChangedAt : undefined;
                      const previousDate = previousChangedAt ? new Date(previousChangedAt) : null;
                      const elapsedLabel = getDiffLabel(currentDate, previousDate);
                      return (
                        <li key={String(row.Id || idx)} className="relative pl-10 pb-4 last:pb-0">
                          {idx < pagedStatusLog.length - 1 ? (
                            <span className="absolute left-[17px] top-8 h-[calc(100%-20px)] w-px bg-neutral-200" />
                          ) : null}
                          <span className={`absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full ring-2 ${visualConfig.tone}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-neutral-800">{getStatusLabel(row.NewStatus)}</p>
                                <p className="text-xs text-neutral-500">{formatDateTime(row.ChangedAt ?? "")}</p>
                              </div>
                              {elapsedLabel ? (
                                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                                  +{elapsedLabel}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-neutral-600">Usuario: {getChangedByLabel(row)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  )
                )}
              </div>
              {historyVariant === "horizontal-compact" ? null : (
                <TablePagination
                  page={historyPage}
                  pageSize={PAGE_SIZE}
                  total={totalRows}
                  onPageChange={setHistoryPage}
                />
              )}
            </>
          );
        })()}
      </div>
    </Card>
  );

  return (
    <div className={historyFullHeight ? "flex h-full min-h-0 flex-col gap-3 overflow-hidden" : "space-y-4"}>
      {showDetail && (
        <Card
          title={`Cita #${appointment.Id}`}
          actions={<Badge status={appointment.Status} />}
          className={detailFullHeight ? "h-full" : historyFullHeight ? "shrink-0" : ""}
          contentClassName={detailFullHeight ? "h-full" : "max-h-[36vh] overflow-y-auto sm:max-h-none sm:overflow-visible"}
        >
          <div className={`grid gap-4 md:grid-cols-2 ${detailFullHeight ? "auto-rows-min" : ""}`}>
            <DetailField label="Cliente" value={appointment.ClientName} icon={User} />
            <DetailField label="Tipo de operación" value={appointment.OperationTypeName} icon={Tag} />
            <DetailField label="Tipo de vehículo" value={appointment.VehicleTypeName} icon={Truck} />
            <DetailField label="Conductor" value={appointment.DriverName} icon={User} />
            <DetailField label="Cédula conductor" value={appointment.DriverDocument} icon={Hash} />
            <DetailField label="Placa" value={appointment.VehiclePlate} icon={Hash} />
            <DetailField label="Muelle" value={appointment.DockName} icon={Warehouse} />
            <DetailField label="Precintos" value={appointment.Precincts} icon={FileCheck} />
            <DetailField label="Observaciones" value={appointment.NonComplianceComment} icon={FileCheck} />
            <DetailField label="Senior's" value={appointment.SeniorOperators} icon={FileCheck} />
            <DetailField label="Junior's" value={appointment.JuniorOperators} icon={FileCheck} />
          </div>
        </Card>
      )}
      {renderActions}
      {renderHistory}
    </div>
  );
}
