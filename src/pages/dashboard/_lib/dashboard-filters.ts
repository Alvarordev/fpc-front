import type {
  DashboardIndicatorQuery,
  DashboardPopulation,
  DashboardQuery,
} from "@/api/dashboard"

export type DashboardFilterState = {
  period: "month" | "year"
  year: number
  month: number
  population: DashboardPopulation
  from: string
  to: string
  department: string
  healthCenterId: string
  agentId: string
  healthPhase: string
  healthSubcategory: string
}

const POPULATIONS: DashboardPopulation[] = [
  "all_active",
  "active_in_period",
  "enrolled_in_period",
]

export function defaultDashboardFilters(today = new Date()): DashboardFilterState {
  return {
    period: "year",
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    population: "all_active",
    from: "",
    to: "",
    department: "",
    healthCenterId: "",
    agentId: "",
    healthPhase: "",
    healthSubcategory: "",
  }
}

export function readDashboardFilters(
  params: URLSearchParams,
  today = new Date(),
): DashboardFilterState {
  const defaults = defaultDashboardFilters(today)
  const period = params.get("period") === "month" ? "month" : defaults.period
  const year = numberOr(params.get("year"), defaults.year)
  const month = numberOr(params.get("month"), defaults.month)
  const population = POPULATIONS.find((item) => item === params.get("population"))
  return {
    period,
    year,
    month: Math.min(12, Math.max(1, month)),
    population: population ?? defaults.population,
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    department: params.get("department") ?? "",
    healthCenterId: params.get("healthCenterId") ?? "",
    agentId: params.get("agentId") ?? "",
    healthPhase: params.get("healthPhase") ?? "",
    healthSubcategory: params.get("healthSubcategory") ?? "",
  }
}

export function writeDashboardFilters(filters: DashboardFilterState) {
  const defaults = defaultDashboardFilters()
  const params = new URLSearchParams()
  if (filters.period !== defaults.period) params.set("period", filters.period)
  if (filters.year !== defaults.year) params.set("year", String(filters.year))
  if (filters.period === "month") params.set("month", String(filters.month))
  if (filters.population !== defaults.population) {
    params.set("population", filters.population)
  }
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (filters.department) params.set("department", filters.department)
  if (filters.healthCenterId) params.set("healthCenterId", filters.healthCenterId)
  if (filters.agentId) params.set("agentId", filters.agentId)
  if (filters.healthPhase) params.set("healthPhase", filters.healthPhase)
  if (filters.healthSubcategory) {
    params.set("healthSubcategory", filters.healthSubcategory)
  }
  return params
}

export function indicatorQuery(
  filters: DashboardFilterState,
): DashboardIndicatorQuery {
  const customRange = Boolean(filters.from && filters.to)
  return {
    timezone: "America/Lima",
    population: filters.population,
    ...(customRange
      ? { from: filters.from, to: nextDay(filters.to) }
      : {
          period: filters.period,
          year: filters.year,
          ...(filters.period === "month" ? { month: filters.month } : {}),
        }),
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.healthCenterId
      ? { healthCenterId: filters.healthCenterId }
      : {}),
    ...(filters.agentId ? { agentId: filters.agentId } : {}),
    ...(filters.healthPhase
      ? { healthPhase: filters.healthPhase as DashboardIndicatorQuery["healthPhase"] }
      : {}),
    ...(filters.healthSubcategory
      ? {
          healthSubcategory:
            filters.healthSubcategory as DashboardIndicatorQuery["healthSubcategory"],
        }
      : {}),
  }
}

export function summaryQuery(filters: DashboardFilterState): DashboardQuery {
  return {
    period: filters.period,
    year: filters.year,
    timezone: "America/Lima",
    ...(filters.period === "month" ? { month: filters.month } : {}),
  }
}

function numberOr(value: string | null, fallback: number) {
  if (value == null || value.trim() === "") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// La API toma `to` como fecha exclusiva; "Hasta" en la UI es inclusivo.
function nextDay(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return next.toISOString().slice(0, 10)
}
