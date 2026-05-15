import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type {
  DashboardKpisTimeline,
  DashboardParams,
  DashboardSummary,
  OperatorPerformanceResponse,
} from "../domain/types/dashboard";

interface UseDashboardOptions {
  refetchIntervalMs?: number | false;
  realtimeConnected?: boolean;
}

export function useDashboard(params: DashboardParams, options: UseDashboardOptions = {}) {
  const refetchInterval = options.refetchIntervalMs ?? (options.realtimeConnected ? false : 10_000);

  return useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary", params],
    queryFn: () => dashboardService.summary(params),
    refetchInterval,
    refetchIntervalInBackground: false, // solo refresca si la pestaña está activa
    staleTime: 5_000,                   // evita refetch "visual" innecesario
    refetchOnWindowFocus: false,        // evita doble refetch después de mutaciones e invalidaciones
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}

export function useDashboardKpisTimeline(params: DashboardParams, options: UseDashboardOptions = {}) {
  const refetchInterval = options.refetchIntervalMs ?? (options.realtimeConnected ? false : 10_000);
  return useQuery<DashboardKpisTimeline>({
    queryKey: ["dashboard-kpis-timeline", params],
    queryFn: () => dashboardService.kpisTimeline(params),
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    meta: {
      userErrorMessage: "Error loading timeline data",
    },
  });
}

export function useOperatorPerformance(params: DashboardParams, options: UseDashboardOptions = {}) {
  const refetchInterval = options.refetchIntervalMs ?? (options.realtimeConnected ? false : 10_000);
  return useQuery<OperatorPerformanceResponse>({
    queryKey: ["operator-performance", params],
    queryFn: () => dashboardService.operatorPerformance(params),
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    meta: {
      userErrorMessage: "Error loading operator performance",
    },
  });
}
