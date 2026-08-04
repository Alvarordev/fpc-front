import { useQuery } from "@tanstack/react-query"
import { dashboardApi, type DashboardQuery } from "@/api/dashboard"

export function useDashboardData(query: DashboardQuery) {
  return useQuery({
    queryKey: ["dashboard", query.period, query.year, query.month ?? null],
    queryFn: () => dashboardApi.get(query),
    staleTime: 30_000,
  })
}
