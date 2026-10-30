import type { HealthCenter } from "@/api/health-centers"

export type HospitalStatus = "active" | "inactive" | "all"

export type HospitalFilters = {
  search: string
  department: string | null
  level: string | null
  institution: string | null
  status: HospitalStatus
}

export const DEFAULT_HOSPITAL_FILTERS: HospitalFilters = {
  search: "",
  department: null,
  level: null,
  institution: null,
  status: "active",
}

const STATUSES = new Set<HospitalStatus>(["active", "inactive", "all"])

export function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function readHospitalFilters(params: URLSearchParams): HospitalFilters {
  const status = params.get("estado")
  return {
    search: params.get("q") ?? "",
    department: params.get("departamento"),
    level: params.get("nivel"),
    institution: params.get("institucion"),
    status: status && STATUSES.has(status as HospitalStatus) ? (status as HospitalStatus) : "active",
  }
}

export function writeHospitalFilters(params: URLSearchParams, filters: HospitalFilters) {
  const next = new URLSearchParams(params)
  set(next, "q", filters.search.trim())
  set(next, "departamento", filters.department)
  set(next, "nivel", filters.level)
  set(next, "institucion", filters.institution)
  set(next, "estado", filters.status === "active" ? null : filters.status)
  return next
}

function set(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function matchesHospital(center: HealthCenter, filters: HospitalFilters, status = true) {
  if (status) {
    if (filters.status === "active" && !center.isActive) return false
    if (filters.status === "inactive" && center.isActive) return false
  }
  if (filters.department && center.department !== filters.department) return false
  if (filters.level && center.careLevel !== filters.level) return false
  if (filters.institution && center.institution !== filters.institution) return false
  const query = fold(filters.search.trim())
  if (!query) return true
  return fold(center.name).includes(query) || fold(center.renipressCode ?? "").includes(query)
}

export function countByStatus(centers: HealthCenter[], filters: HospitalFilters) {
  const base = centers.filter((center) => matchesHospital(center, filters, false))
  return {
    active: base.filter((center) => center.isActive).length,
    inactive: base.filter((center) => !center.isActive).length,
    all: base.length,
  }
}

export function hasNarrowingFilters(filters: HospitalFilters) {
  return Boolean(filters.search.trim() || filters.department || filters.level || filters.institution || filters.status !== "active")
}
