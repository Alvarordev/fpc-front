import type { Volunteer } from "@/api/volunteers"

export type VolunteerTab = "calendario" | "voluntarios" | "sepa"
export type VolunteerStatus = "active" | "inactive" | "all"

export type VolunteerFilters = {
  tab: VolunteerTab
  search: string
  status: VolunteerStatus
}

export const DEFAULT_VOLUNTEER_FILTERS: VolunteerFilters = {
  tab: "calendario",
  search: "",
  status: "active",
}

const TABS = new Set<VolunteerTab>(["calendario", "voluntarios", "sepa"])
const STATUSES = new Set<VolunteerStatus>(["active", "inactive", "all"])

export function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function readVolunteerFilters(params: URLSearchParams): VolunteerFilters {
  const tab = params.get("tab")
  const status = params.get("estado")
  return {
    tab: tab && TABS.has(tab as VolunteerTab) ? (tab as VolunteerTab) : "calendario",
    search: params.get("q") ?? "",
    status: status && STATUSES.has(status as VolunteerStatus) ? (status as VolunteerStatus) : "active",
  }
}

export function writeVolunteerFilters(params: URLSearchParams, filters: VolunteerFilters) {
  const next = new URLSearchParams(params)
  set(next, "tab", filters.tab === "calendario" ? null : filters.tab)
  set(next, "q", filters.search.trim())
  set(next, "estado", filters.status === "active" ? null : filters.status)
  return next
}

function set(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function volunteerName(volunteer: Volunteer) {
  return `${volunteer.firstName} ${volunteer.lastName}`.trim()
}

export function matchesVolunteer(volunteer: Volunteer, filters: VolunteerFilters) {
  if (filters.status === "active" && !volunteer.isActive) return false
  if (filters.status === "inactive" && volunteer.isActive) return false
  const query = fold(filters.search.trim())
  if (!query) return true
  return fold(volunteerName(volunteer)).includes(query) || fold(volunteer.specialty).includes(query)
}
