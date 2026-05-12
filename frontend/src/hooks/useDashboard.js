import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";

export function useDashboard(params, options = {}) {
  const refetchInterval = options.refetchIntervalMs ?? (options.realtimeConnected ? false : 10_000);

  return useQuery({
    queryKey: ["dashboard-summary", params],
    queryFn: () => dashboardService.summary(params),
    refetchInterval,
    refetchIntervalInBackground: false, // solo refresca si la pestaña está activa
    staleTime: 5_000,                   // evita refetch "visual" innecesario
    refetchOnWindowFocus: true,         // refresca al volver a la pestaña (útil si pasó mucho tiempo)
  });
}
