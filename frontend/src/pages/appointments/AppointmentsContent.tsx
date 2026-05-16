import { Suspense, lazy } from "react";
import type { ReactNode } from "react";

import { AppointmentsTable } from "../../components/domain/AppointmentsTable";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Loader } from "../../components/ui/Loader";
import { useIsMinWidth } from "../../hooks/useIsMinWidth";
import type { AppointmentStatusLog, AppointmentDetail } from "../../domain/types/appointments";
import type { RoleCode } from "../../domain/types/auth";
import type { AppointmentActionKey, AppointmentRow } from "./types";
import { PAGE_SIZE } from "./constants";

const AppointmentDetailPanel = lazy(() =>
  import("../../components/domain/AppointmentDetailPanel").then((module) => ({
    default: module.AppointmentDetailPanel,
  })),
);

interface AppointmentsContentProps {
  rows: AppointmentRow[];
  emptyTitle: string;
  emptyDescription: string;
  selectedAppointmentId: number | null;
  selectedAppointment: AppointmentDetail | null;
  detailLoading: boolean;
  statusLog: AppointmentStatusLog[];
  roles: RoleCode[];
  readOnly: boolean;
  getRowActions?: (row: AppointmentRow) => Array<{
    key: string;
    label: string;
    icon?: ReactNode;
    onClick?: (row: AppointmentRow) => void;
  }>;
  onSelect: (appointment: AppointmentRow) => void;
  onOpenAction: (key: AppointmentActionKey) => void;
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AppointmentsContent({
  rows,
  emptyTitle,
  emptyDescription,
  selectedAppointmentId,
  selectedAppointment,
  detailLoading,
  statusLog,
  roles,
  readOnly,
  getRowActions,
  onSelect,
  onOpenAction,
  page,
  total,
  onPageChange,
}: AppointmentsContentProps) {
  const isDesktop = useIsMinWidth(1024);

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-4">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <AppointmentsTable
              rows={rows}
              selectedAppointmentId={selectedAppointmentId}
              onSelect={onSelect}
              getRowActions={readOnly ? undefined : getRowActions}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={onPageChange}
            />
          </div>

          {detailLoading && selectedAppointmentId ? (
            <Card title="Detalle de cita">
              <div className="flex items-center justify-center py-8">
                <Loader />
              </div>
            </Card>
          ) : (
            <div className="max-h-[38vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
              <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando detalle...</div>}>
                <AppointmentDetailPanel
                  appointment={selectedAppointment}
                  onAction={() => {}}
                  showActions={false}
                  showHistory={false}
                />
              </Suspense>
            </div>
          )}
        </div>

        <div className="min-w-0">
          {detailLoading && selectedAppointmentId ? (
            <Card title="Historial de estados">
              <div className="flex items-center justify-center py-8">
                <Loader />
              </div>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando historial...</div>}>
                <AppointmentDetailPanel
                  appointment={selectedAppointment}
                  statusLog={statusLog}
                  roles={roles}
                  onAction={(key) => onOpenAction(key as AppointmentActionKey)}
                  showDetail={false}
                  showActions={false}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 grid grid-cols-[minmax(0,1.95fr)_minmax(280px,0.62fr)] grid-rows-[minmax(0,1fr)_auto] gap-2">
      <div className="contents">
        <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-1 row-start-1">
          <AppointmentsTable
            rows={rows}
            selectedAppointmentId={selectedAppointmentId}
            onSelect={onSelect}
            getRowActions={readOnly ? undefined : getRowActions}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={onPageChange}
            maxVisibleRows={8}
            fullHeight
          />
        </div>

        <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-2 row-start-1 row-span-2">
          <div className="h-full overflow-y-auto">
            {detailLoading && selectedAppointmentId ? (
              <Card title="Detalle de cita" className="h-full">
                <div className="flex items-center justify-center py-8">
                  <Loader />
                </div>
              </Card>
            ) : (
              <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando detalle...</div>}>
                <AppointmentDetailPanel
                  appointment={selectedAppointment}
                  roles={roles}
                  onAction={(key) => onOpenAction(key as AppointmentActionKey)}
                  showActions={false}
                  showHistory={false}
                  historyFullHeight
                  detailFullHeight
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm col-start-1 row-start-2">
        {detailLoading && selectedAppointmentId ? (
          <Card>
            <div className="flex items-center justify-center py-4">
              <Loader />
            </div>
          </Card>
        ) : (
          <Suspense fallback={<div className="p-4 text-sm text-neutral-500">Cargando historial...</div>}>
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              statusLog={statusLog}
              roles={roles}
              onAction={(key) => onOpenAction(key as AppointmentActionKey)}
              showDetail={false}
              showActions={false}
              historyVariant="horizontal-compact"
              historyHideTitle
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
