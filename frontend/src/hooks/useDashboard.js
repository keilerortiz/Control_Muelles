import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";

export function useDashboard(params) {
  return useQuery({
    queryKey: ["dashboard-summary", params],
    queryFn: () => dashboardService.summary(params),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false, // solo refresca si la pestaña está activa
    staleTime: 5_000,                   // evita refetch "visual" innecesario
    refetchOnWindowFocus: true,         // refresca al volver a la pestaña (útil si pasó mucho tiempo)
  });
}