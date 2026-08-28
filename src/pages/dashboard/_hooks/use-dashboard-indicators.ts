import { useQuery } from "@tanstack/react-query"
import {
  dashboardIndicatorsApi,
  type DashboardIndicatorQuery,
} from "@/api/dashboard"

export function useDashboardIndicators(query: DashboardIndicatorQuery) {
  const key = [
    query.period ?? null,
    query.year ?? null,
    query.month ?? null,
    query.from ?? null,
    query.to ?? null,
    query.timezone ?? "America/Lima",
  ]

  const demographics = useQuery({
    queryKey: ["dashboard-indicators", "demographics", ...key],
    queryFn: () => dashboardIndicatorsApi.getDemographics(query),
    staleTime: 30_000,
  })
  const epidemiology = useQuery({
    queryKey: ["dashboard-indicators", "epidemiology", ...key],
    queryFn: () => dashboardIndicatorsApi.getEpidemiology(query),
    staleTime: 30_000,
  })

  return { demographics, epidemiology }
}
