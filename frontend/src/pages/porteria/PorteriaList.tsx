import { LogIn, LogOut } from "lucide-react";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { actionLabels, formatDateTime, getAvailableActions } from "../../domain/appointmentsConfig";
import type { PorteriaActionKey, PorteriaAppointment } from "./types";

interface PorteriaListProps {
  title: string;
  rows: PorteriaAppointment[];
  actionKey: PorteriaActionKey;
  onAction: (actionKey: PorteriaActionKey, row: PorteriaAppointment) => void;
}

export function PorteriaList({ title, rows, actionKey, onAction }: PorteriaListProps) {
  return (
    <Card title={title} className="flex h-full min-h-0 flex-col" contentClassName="flex-1 min-h-0">
      <div className="h-full space-y-3 overflow-y-auto pr-1">
        {rows.length === 0 ? (
          <EmptyState title="Sin vehículos" />
        ) : (
          rows.map((row) => {
            const isActionAvailable = getAvailableActions(row.Status ?? "AGENDADA", ["PORTERIA"]).some(
              (action) => action.key === actionKey,
            );
            return (
              <div key={row.Id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-800">#{row.Id}</p>
                      <Badge status={row.Status} />
                    </div>
                    <div className="grid gap-1 text-sm text-neutral-600">
                      <p><span className="font-bold">Hora de cita:</span> {formatDateTime(row.ScheduledAt)}</p>
                      <p><span className="font-medium">Cliente:</span> {row.ClientName || "-"}</p>
                      <p><span className="font-medium">Nombre conductor:</span> {row.DriverName || "-"}</p>
                      <p><span className="font-medium">Cédula conductor:</span> {row.DriverDocument || "-"}</p>
                      <p><span className="font-medium">Placa:</span> {row.VehiclePlate || "-"}</p>
                      <p><span className="font-medium">Precintos:</span> {row.Precincts || "-"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={actionKey === "checkout" ? "danger" : "primary"}
                    leftIcon={actionKey === "checkin" ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                    disabled={!isActionAvailable}
                    onClick={() => onAction(actionKey, row)}
                  >
                    {isActionAvailable ? actionLabels[actionKey] : actionKey === "checkout" ? "Salida no disponible" : "No disponible"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
