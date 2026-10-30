import type { Alert } from "@/api/alerts"

export type AlertStatusFilter = Alert["status"] | "all"

export type AlertFilters = {
  status: AlertStatusFilter
  severity: Alert["severity"] | null
  center: string | null
}

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  status: "REPORTED",
  severity: null,
  center: null,
}

const STATUS_PARAM: Record<Exclude<AlertStatusFilter, "REPORTED">, string> = {
  IN_REVIEW: "revision",
  RESOLVED: "resuelta",
  all: "todas",
}

const STATUS_FROM_PARAM: Record<string, AlertStatusFilter> = {
  revision: "IN_REVIEW",
  resuelta: "RESOLVED",
  todas: "all",
}

const SEVERITY_PARAM: Record<Alert["severity"], string> = {
  HIGH: "alta",
  MEDIUM: "media",
  LOW: "baja",
}

const SEVERITY_FROM_PARAM: Record<string, Alert["severity"]> = {
  alta: "HIGH",
  media: "MEDIUM",
  baja: "LOW",
}

export function readAlertFilters(params: URLSearchParams): AlertFilters {
  const status = STATUS_FROM_PARAM[params.get("estado") ?? ""]
  const severity = SEVERITY_FROM_PARAM[params.get("severidad") ?? ""]
  return {
    status: status ?? "REPORTED",
    severity: severity ?? null,
    center: params.get("establecimiento"),
  }
}

export function writeAlertFilters(params: URLSearchParams, filters: AlertFilters) {
  const next = new URLSearchParams(params)
  set(next, "estado", filters.status === "REPORTED" ? null : STATUS_PARAM[filters.status])
  set(next, "severidad", filters.severity ? SEVERITY_PARAM[filters.severity] : null)
  set(next, "establecimiento", filters.center)
  return next
}

function set(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function matchesAlert(alert: Alert, filters: AlertFilters, status = true) {
  if (status && filters.status !== "all" && alert.status !== filters.status) return false
  if (filters.severity && alert.severity !== filters.severity) return false
  if (filters.center && alert.healthCenterId !== filters.center) return false
  return true
}

export function countByStatus(alerts: Alert[], filters: AlertFilters) {
  const base = alerts.filter((alert) => matchesAlert(alert, filters, false))
  return {
    REPORTED: base.filter((alert) => alert.status === "REPORTED").length,
    IN_REVIEW: base.filter((alert) => alert.status === "IN_REVIEW").length,
    RESOLVED: base.filter((alert) => alert.status === "RESOLVED").length,
    all: base.length,
  }
}

export function hasNarrowingFilters(filters: AlertFilters) {
  return Boolean(filters.status !== "REPORTED" || filters.severity || filters.center)
}
