import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, X } from "lucide-react"
import { CATALOG_KIND_LABELS, type CatalogItem, type CatalogKind } from "@/api/catalogs"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { Field, TextInput } from "@/components/ds/form"
import { SearchSelect } from "@/components/ds/search-select"
import {
  countCatalogStatus,
  readCatalogFilters,
  readCatalogKind,
  writeCatalogQuery,
  type CatalogFilters,
  type CatalogStatus,
} from "../_lib/catalog-filters"

export function CatalogsFilters({
  allowed,
  items,
}: {
  allowed: readonly CatalogKind[]
  items: CatalogItem[]
}) {
  const [params, setParams] = useSearchParams()
  const kind = readCatalogKind(params, allowed)
  const filters = readCatalogFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }

  useEffect(() => {
    const raw = params.get("catalogo")
    if (raw && (allowed as readonly string[]).includes(raw)) return
    setParams(writeCatalogQuery(params, kind, filters), { replace: true })
  }, [params, kind, filters, allowed, setParams])

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const currentFilters = readCatalogFilters(current)
        if (currentFilters.search === searchInput) return current
        return writeCatalogQuery(current, readCatalogKind(current, allowed), { ...currentFilters, search: searchInput })
      }, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, allowed, setParams])

  function commit(partial: Partial<CatalogFilters>, nextKind = kind) {
    const next = { ...readCatalogFilters(params), ...partial }
    setParams(writeCatalogQuery(params, nextKind, next), { replace: true })
  }

  const counts = useMemo(() => countCatalogStatus(items, filters), [items, filters])
  const chips = [
    filters.search.trim() ? { id: "search" as const, text: `“${filters.search.trim()}”` } : null,
    filters.status === "inactive" ? { id: "status" as const, text: "Inactivos" } : null,
    filters.status === "all" ? { id: "status" as const, text: "Todos los estados" } : null,
  ].filter((chip) => chip !== null)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label="Catálogo">
          {(id) => (
            <SearchSelect
              id={id}
              value={kind}
              onChange={(value) => commit({}, value as CatalogKind)}
              options={allowed.map((item) => ({ value: item, label: CATALOG_KIND_LABELS[item] }))}
              placeholder="Elegir catálogo"
              searchPlaceholder="Buscar catálogo"
            />
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por etiqueta o código"
            aria-label="Buscar opciones"
            className="pl-9"
          />
        </div>
        <FilterToggles
          value={filters.status}
          onChange={(status) => commit({ status })}
          options={[
            { id: "active" as CatalogStatus, label: "Activos", count: counts.active },
            { id: "inactive", label: "Inactivos", count: counts.inactive },
            { id: "all", label: "Todos", count: counts.all },
          ]}
        />
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                if (chip.id === "search") setSearchInput("")
                commit({ [chip.id]: chip.id === "search" ? "" : "active" })
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              {chip.text}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSearchInput("")
              commit({ search: "", status: "active" })
            }}
            className="text-[13px] text-zinc-600 underline decoration-zinc-300 underline-offset-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
