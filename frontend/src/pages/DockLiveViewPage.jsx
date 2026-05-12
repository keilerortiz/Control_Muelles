import { useQueries } from "@tanstack/react-query";
import { Activity, AlertTriangle, Siren, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DockGrid } from "../components/domain/dockLive/DockGrid";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useMasterCatalogs } from "../hooks/useMasters";
import { appointmentsService } from "../services/appointmentsService";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";

const ACTIVE_DOCK_STATUSES = ["ENTREGA_DOCUMENTOS", "EN_PROCESO", "PARA_FIRMAR"];
const REFRESH_INTERVAL_MS = 60_000;
const CLOCK_TICK_MS = 1_000;
const MAX_APPOINTMENTS_PER_STATUS = 100;

function normalizeDockSortValue(value) {
  if (!value || typeof value !== "string") return Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function getElapsedMinutes(appointment, nowMs) {
  const processStartAt = appointment?.ProcessStartAt;
  const processEndAt = appointment?.ProcessEndAt;
  if (!processStartAt) return 0;

  const hasTimezoneStart = /([zZ]|[+\-]\d{2}:\d{2})$/.test(processStartAt);
  const normalizedStart = hasTimezoneStart ? processStartAt : `${processStartAt}Z`;
  const startDate = new Date(normalizedStart);
  if (Number.isNaN(startDate.getTime())) return 0;

  if (!processEndAt) {
    return Math.max((nowMs - startDate.getTime()) / 60000, 0);
  }

  const hasTimezoneEnd = /([zZ]|[+\-]\d{2}:\d{2})$/.test(processEndAt);
  const normalizedEnd = hasTimezoneEnd ? processEndAt : `${processEndAt}Z`;
  const endDate = new Date(normalizedEnd);
  if (Number.isNaN(endDate.getTime())) return Math.max((nowMs - startDate.getTime()) / 60000, 0);

  return Math.max((endDate.getTime() - startDate.getTime()) / 60000, 0);
}

function buildLiveKpis(appointments, nowMs) {
  return appointments.reduce(
    (accumulator, appointment) => {
      const standardMinutes = Number(appointment?.StandardTimeMinutes) || 0;
      const elapsedMinutes = getElapsedMinutes(appointment, nowMs);
      const compliancePercent = standardMinutes > 0 ? (elapsedMinutes / standardMinutes) * 100 : 0;

      if (compliancePercent > 100) {
        accumulator.delayed += 1;
      } else if (compliancePercent > 85) {
        accumulator.atRisk += 1;
      }

      if ((appointment?.ActiveOperatorCount || 0) <= 0) {
        accumulator.withoutOperators += 1;
      }

      return accumulator;
    },
    { delayed: 0, atRisk: 0, withoutOperators: 0 },
  );
}

export function DockLiveViewPage() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);
  const catalogsQuery = useMasterCatalogs();

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const statusQueries = useQueries({
    queries: ACTIVE_DOCK_STATUSES.map((status) => ({
      queryKey: ["appointments", { ...dateRangeParams, status, skip: 0, take: MAX_APPOINTMENTS_PER_STATUS }],
      queryFn: () =>
        appointmentsService.list({
          ...dateRangeParams,
          status,
          skip: 0,
          take: MAX_APPOINTMENTS_PER_STATUS,
        }),
      refetchInterval: REFRESH_INTERVAL_MS,
      refetchIntervalInBackground: false,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    })),
  });

  const isLoading = statusQueries.some((query) => query.isLoading);
  const isError = statusQueries.some((query) => query.isError);

  const activeAppointments = useMemo(() => {
    const mergedRows = statusQueries.flatMap((query) => query.data?.items || []);
    const uniqueById = new Map();
    mergedRows.forEach((row) => {
      if (!uniqueById.has(row.Id)) {
        uniqueById.set(row.Id, row);
      }
    });

    return Array.from(uniqueById.values())
      .filter((row) => row.Status && ACTIVE_DOCK_STATUSES.includes(row.Status))
      .sort((left, right) => {
        const leftSort = normalizeDockSortValue(left.DockName);
        const rightSort = normalizeDockSortValue(right.DockName);
        if (leftSort !== rightSort) return leftSort - rightSort;
        return (left.DockName || "").localeCompare(right.DockName || "");
      });
  }, [statusQueries]);

  const activeBusinessRuleMinutesByKey = useMemo(() => {
    const rules = (catalogsQuery.data?.businessRules || []).filter((rule) => rule?.IsActive);
    const ruleMap = new Map();
    rules.forEach((rule) => {
      const key = `${Number(rule.ClientId)}-${Number(rule.VehicleTypeId)}-${Number(rule.OperationTypeId)}`;
      ruleMap.set(key, Number(rule.StandardTimeMinutes) || 0);
    });
    return ruleMap;
  }, [catalogsQuery.data?.businessRules]);

  const normalizedAppointments = useMemo(
    () =>
      activeAppointments.map((appointment) => {
        const key = `${Number(appointment.ClientId)}-${Number(appointment.VehicleTypeId)}-${Number(appointment.OperationTypeId)}`;
        const businessRuleMinutes = activeBusinessRuleMinutesByKey.get(key);
        if (!businessRuleMinutes || businessRuleMinutes <= 0) return appointment;
        return { ...appointment, StandardTimeMinutes: businessRuleMinutes };
      }),
    [activeAppointments, activeBusinessRuleMinutesByKey],
  );

  const detailQueries = useQueries({
    queries: activeAppointments.map((appointment) => ({
      queryKey: ["appointment-detail", appointment.Id],
      queryFn: () => appointmentsService.detail(appointment.Id),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      enabled: Boolean(appointment.Id),
    })),
  });

  const detailsByAppointmentId = useMemo(() => {
    const detailMap = {};
    detailQueries.forEach((query) => {
      if (query.data?.Id) {
        detailMap[query.data.Id] = query.data;
      }
    });
    return detailMap;
  }, [detailQueries]);

  const kpis = useMemo(() => buildLiveKpis(normalizedAppointments, nowMs), [normalizedAppointments, nowMs]);
  const currentClock = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date(nowMs)),
    [nowMs],
  );

  if (isLoading) {
    return (
      <div className="space-y-3 px-1 sm:px-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-[520px]" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="No fue posible cargar la vista operativa de muelles."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden px-1 sm:px-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm shadow-neutral-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center px-1 py-1 font-mono text-3xl font-bold tracking-wide text-neutral-800 sm:text-4xl">
              {currentClock}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5">
              <p className="font-medium text-neutral-500">Muelles activos</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                <Activity className="h-3.5 w-3.5 text-brand-600" strokeWidth={2} />
                {activeAppointments.length}
              </p>
            </div>
            <div className="rounded-xl border border-error-200 bg-error-50 px-2.5 py-1.5">
              <p className="font-medium text-error-700">Retrasados</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-error-700">
                <Siren className="h-3.5 w-3.5" strokeWidth={2} />
                {kpis.delayed}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        <DockGrid
          appointments={normalizedAppointments}
          detailsByAppointmentId={detailsByAppointmentId}
          nowMs={nowMs}
        />
      </div>
    </div>
  );
}
