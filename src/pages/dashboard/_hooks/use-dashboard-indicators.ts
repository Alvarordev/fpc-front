import { useQuery } from "@tanstack/react-query"
import {
  dashboardIndicatorsApi,
  type DashboardIndicatorQuery,
} from "@/api/dashboard"

export function useDashboardIndicators(
  query: DashboardIndicatorQuery,
  options?: { territoryOnly?: boolean; enabled?: boolean },
) {
  const enabled = options?.enabled ?? true
  const territoryOnly = options?.territoryOnly ?? false
  const key = [
    query.period ?? null,
    query.year ?? null,
    query.month ?? null,
    query.from ?? null,
    query.to ?? null,
    query.timezone ?? "America/Lima",
    query.population ?? "all_active",
    query.department ?? null,
  ]

  const demographics = useQuery({
    queryKey: ["dashboard-indicators", "demographics", ...key],
    queryFn: () => dashboardIndicatorsApi.getDemographics(query),
    staleTime: 30_000,
    enabled,
  })
  const epidemiology = useQuery({
    queryKey: ["dashboard-indicators", "epidemiology", ...key],
    queryFn: () => dashboardIndicatorsApi.getEpidemiology(query),
    staleTime: 30_000,
    enabled,
  })
  const management = useQuery({
    queryKey: ["dashboard-indicators", "management", ...key],
    queryFn: () => dashboardIndicatorsApi.getManagement(query),
    staleTime: 30_000,
    enabled: enabled && !territoryOnly,
  })
  const productivity = useQuery({
    queryKey: ["dashboard-indicators", "productivity", ...key],
    queryFn: () => dashboardIndicatorsApi.getProductivity(query),
    staleTime: 30_000,
    enabled: enabled && !territoryOnly,
  })
  const adherence = useQuery({
    queryKey: ["dashboard-indicators", "adherence", ...key],
    queryFn: () => dashboardIndicatorsApi.getAdherence(query),
    staleTime: 30_000,
    enabled: enabled && !territoryOnly,
  })
  const abandonment = useQuery({
    queryKey: ["dashboard-indicators", "abandonment", ...key],
    queryFn: () => dashboardIndicatorsApi.getAbandonment(query),
    staleTime: 30_000,
    enabled: enabled && !territoryOnly,
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
