import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { DashboardParams, DashboardSummary } from "../domain/types/dashboard";

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
    refetchOnWindowFocus: true,         // refresca al volver a la pestaña (útil si pasó mucho tiempo)
    meta: {
      userErrorMessage: "Error loading data: invalid response format",
    },
  });
}
