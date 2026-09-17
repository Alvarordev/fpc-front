import { useQuery } from "@tanstack/react-query"
import {
  catalogsApi,
  type CatalogItem,
  type CatalogKind,
} from "@/api/catalogs"
import { RESERVED_CATALOG_CODE } from "@/lib/catalog-code"

export const catalogQueryKey = (kind: CatalogKind) => ["catalogs", kind] as const

export function useCatalog(kind: CatalogKind, includeInactive = false) {
  return useQuery({
    queryKey: [...catalogQueryKey(kind), includeInactive],
    queryFn: () => catalogsApi.list({ kind, includeInactive }),
    staleTime: 5 * 60_000,
  })
}

export function catalogLabel(
  items: CatalogItem[],
  code: string | null | undefined,
): string {
  if (!code) return "—"
  return items.find((item) => item.code === code)?.label ?? code
}

export function formatCatalogValue(
  items: CatalogItem[],
  code: string | null | undefined,
  other?: string | null,
): string {
  if (!code) return "—"
  const label = catalogLabel(items, code)
  if (code === RESERVED_CATALOG_CODE && other?.trim()) {
    return `Otro: ${other.trim()}`
  }
  return label
}

export function catalogSelectItems(items: CatalogItem[]) {
  return items
    .filter((item) => item.isActive && item.code !== RESERVED_CATALOG_CODE)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "es"))
    .map((item) => ({ value: item.code, label: item.label }))
}

export function formatCatalogCodesList(
  items: CatalogItem[],
  codes: string[] | null | undefined,
  separator = ", ",
): string {
  if (!codes?.length) return "—"
  return codes.map((code) => catalogLabel(items, code)).join(separator)
}
