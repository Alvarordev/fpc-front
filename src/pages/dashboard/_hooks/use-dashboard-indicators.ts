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
  const management = useQuery({
    queryKey: ["dashboard-indicators", "management", ...key],
    queryFn: () => dashboardIndicatorsApi.getManagement(query),
    staleTime: 30_000,
  })
  const productivity = useQuery({
    queryKey: ["dashboard-indicators", "productivity", ...key],
    queryFn: () => dashboardIndicatorsApi.getProductivity(query),
    staleTime: 30_000,
  })
  const adherence = useQuery({
    queryKey: ["dashboard-indicators", "adherence", ...key],
    queryFn: () => dashboardIndicatorsApi.getAdherence(query),
    staleTime: 30_000,
  })
  const abandonment = useQuery({
    queryKey: ["dashboard-indicators", "abandonment", ...key],
    queryFn: () => dashboardIndicatorsApi.getAbandonment(query),
    staleTime: 30_000,
  })

  return {
    demographics,
    epidemiology,
    management,
    productivity,
    adherence,
    abandonment,
  }
}
