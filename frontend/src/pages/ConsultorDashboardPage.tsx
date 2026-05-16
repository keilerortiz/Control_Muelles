import { useMemo } from "react";

import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { useDashboardKpisTimeline, useLogisticsDashboard } from "../hooks/useDashboard";
import { useDateRangeStore } from "../store/dateRangeStore";
import { getDateRangeParams } from "../utils/dateRange";
import { ConsultorSummaryCards } from "./consultor/ConsultorSummaryCards";
import { ConsultorKpiTimelineCard } from "./consultor/ConsultorKpiTimelineCard";
import {
  OtsBreakdownCard,
  ProcessDurationsCard,
  SeniorOperatorOtsCard,
  SupervisorAssignmentsCard,
} from "./consultor/ConsultorCharts";

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;

export function ConsultorDashboardPage() {
  const range = useDateRangeStore((state) => state.range);
  const dateRangeParams = useMemo(() => getDateRangeParams(range), [range]);

  const logisticsQuery = useLogisticsDashboard(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });
  const timelineQuery = useDashboardKpisTimeline(dateRangeParams, { refetchIntervalMs: REFRESH_INTERVAL_MS });

  const logistics = logisticsQuery.data;
  const summary = logistics?.summary || {};
  const timelineBuckets = timelineQuery.data?.buckets || [];

  if (logisticsQuery.isLoading || timelineQuery.isLoading) {
    return (
      <div className="space-y-3 px-2 sm:px-3 lg:px-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (logisticsQuery.isError || timelineQuery.isError) {
    return <ErrorState message="No se pudo cargar el dashboard consultivo" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex flex-col gap-4 px-2 pb-8 sm:px-3 lg:px-4">
      <div className="shrink-0">
        <ConsultorSummaryCards
          scheduledVehicles={summary.scheduledVehicles ?? 0}
          attendedVehicles={summary.attendedVehicles ?? 0}
          movedWeightKg={summary.movedWeightKg ?? 0}
          otsRate={summary.otsRate ?? null}
          otcRate={summary.otcRate ?? null}
          onTimeArrivalRate={summary.onTimeArrivalRate ?? null}
          evaluatedOperations={summary.evaluatedOperations ?? 0}
          supervisorsWithAssignments={summary.supervisorsWithAssignments ?? 0}
          seniorOperatorsMeasured={summary.seniorOperatorsMeasured ?? 0}
          cancelledOperations={summary.cancelledOperations ?? 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-h-[400px]">
          <SeniorOperatorOtsCard operators={logistics?.seniorOperatorOts || []} />
        </div>

        <div className="min-h-[400px]">
          <ProcessDurationsCard data={logistics?.processDurations || []} />
        </div>

        <div className="min-h-[400px]">
          <OtsBreakdownCard title="OTS por cliente" data={logistics?.otsByClient || []} />
        </div>

        <div className="min-h-[400px]">
          <ConsultorKpiTimelineCard
            buckets={timelineBuckets}
            rangePreset={range.preset}
            isLoading={timelineQuery.isLoading}
          />
        </div>

        <div className="min-h-[260px] lg:col-span-2">
          <SupervisorAssignmentsCard supervisors={logistics?.supervisorAssignments || []} />
        </div>

        <div className="min-h-[320px] lg:col-span-2">
          <OtsBreakdownCard title="OTS por tipo de operación" data={logistics?.otsByOperationType || []} />
        </div>
      </div>
    </div>
  );
}
