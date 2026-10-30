import type { CatalogItem, CatalogKind } from "@/api/catalogs"

export type CatalogStatus = "active" | "inactive" | "all"

export type CatalogFilters = {
  search: string
  status: CatalogStatus
}

const STATUSES = new Set<CatalogStatus>(["active", "inactive", "all"])

export function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function readCatalogKind(params: URLSearchParams, allowed: readonly CatalogKind[]): CatalogKind {
  const kind = params.get("catalogo")
  return kind && (allowed as readonly string[]).includes(kind) ? (kind as CatalogKind) : allowed[0]
}

export function readCatalogFilters(params: URLSearchParams): CatalogFilters {
  const status = params.get("estado")
  return {
    search: params.get("q") ?? "",
    status: status && STATUSES.has(status as CatalogStatus) ? (status as CatalogStatus) : "active",
  }
}

export function writeCatalogQuery(params: URLSearchParams, kind: CatalogKind, filters: CatalogFilters) {
  const next = new URLSearchParams(params)
  next.set("catalogo", kind)
  if (filters.search.trim()) next.set("q", filters.search.trim())
  else next.delete("q")
  if (filters.status === "active") next.delete("estado")
  else next.set("estado", filters.status)
  return next
}

export function matchesCatalogItem(item: CatalogItem, filters: CatalogFilters, status = true) {
  if (status) {
    if (filters.status === "active" && !item.isActive) return false
    if (filters.status === "inactive" && item.isActive) return false
  }
  const query = fold(filters.search.trim())
  if (!query) return true
  return fold(item.label).includes(query) || fold(item.code).includes(query)
}

export function countCatalogStatus(items: CatalogItem[], filters: CatalogFilters) {
  const base = items.filter((item) => matchesCatalogItem(item, filters, false))
  return {
    active: base.filter((item) => item.isActive).length,
    inactive: base.filter((item) => !item.isActive).length,
    all: base.length,
  }
}

export function catalogFiltersNarrow(filters: CatalogFilters) {
  return Boolean(filters.search.trim() || filters.status !== "active")
}
