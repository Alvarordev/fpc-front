import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, X } from "lucide-react"
import type { HealthCenter } from "@/api/health-centers"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { Field, SelectField, TextInput } from "@/components/ds/form"
import {
  CARE_LEVELS,
  CARE_LEVEL_LABELS,
  HEALTH_CENTER_INSTITUTIONS,
  HEALTH_CENTER_INSTITUTION_LABELS,
  careLevelLabel,
  institutionLabel,
} from "@/lib/health-center-labels"
import { DEPARTMENT_LABELS, DEPARTMENTS } from "../_utils/departments"
import {
  DEFAULT_HOSPITAL_FILTERS,
  countByStatus,
  readHospitalFilters,
  writeHospitalFilters,
  type HospitalFilters,
  type HospitalStatus,
} from "../_lib/hospital-filters"

const ALL = "all"

export function HospitalsFilters({ centers }: { centers: HealthCenter[] }) {
  const [params, setParams] = useSearchParams()
  const filters = readHospitalFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const currentFilters = readHospitalFilters(current)
        if (currentFilters.search === searchInput) return current
        return writeHospitalFilters(current, { ...currentFilters, search: searchInput })
      }, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, setParams])

  function commit(partial: Partial<HospitalFilters>) {
    const next = { ...readHospitalFilters(params), ...partial }
    setParams(writeHospitalFilters(params, next), { replace: true })
  }

  const counts = useMemo(() => countByStatus(centers, filters), [centers, filters])
  const chips = filterChips(filters)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre"
            aria-label="Buscar hospitales"
            className="pl-9"
          />
        </div>
        <FilterToggles
          value={filters.status}
          onChange={(status) => commit({ status })}
          options={[
            { id: "active" as HospitalStatus, label: "Activos", count: counts.active },
            { id: "inactive", label: "Inactivos", count: counts.inactive },
            { id: "all", label: "Todos", count: counts.all },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Departamento">
          {(id) => (
            <SelectField
              id={id}
              value={filters.department ?? ALL}
              onChange={(value) => commit({ department: value === ALL ? null : value })}
              options={[{ value: ALL, label: "Todos" }, ...DEPARTMENTS]}
            />
          )}
        </Field>
        <Field label="Nivel de atención">
          {(id) => (
            <SelectField
              id={id}
              value={filters.level ?? ALL}
              onChange={(value) => commit({ level: value === ALL ? null : value })}
              options={[{ value: ALL, label: "Todos" }, ...CARE_LEVELS.map((level) => ({ value: level, label: CARE_LEVEL_LABELS[level] }))]}
            />
          )}
        </Field>
        <Field label="Institución">
          {(id) => (
            <SelectField
              id={id}
              value={filters.institution ?? ALL}
              onChange={(value) => commit({ institution: value === ALL ? null : value })}
              options={[
                { value: ALL, label: "Todas" },
                ...HEALTH_CENTER_INSTITUTIONS.map((item) => ({ value: item, label: HEALTH_CENTER_INSTITUTION_LABELS[item] })),
              ]}
            />
          )}
        </Field>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => commit({ [chip.id]: chip.id === "search" ? "" : chip.id === "status" ? "active" : null })}
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
              setParams(writeHospitalFilters(params, DEFAULT_HOSPITAL_FILTERS), { replace: true })
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

function filterChips(filters: HospitalFilters) {
  const chips: { id: keyof HospitalFilters; text: string }[] = []
  if (filters.search.trim()) chips.push({ id: "search", text: `“${filters.search.trim()}”` })
  if (filters.department) chips.push({ id: "department", text: DEPARTMENT_LABELS[filters.department] ?? filters.department })
  if (filters.level) chips.push({ id: "level", text: careLevelLabel(filters.level) ?? filters.level })
  if (filters.institution) chips.push({ id: "institution", text: institutionLabel(filters.institution) ?? filters.institution })
  if (filters.status === "inactive") chips.push({ id: "status", text: "Inactivos" })
  if (filters.status === "all") chips.push({ id: "status", text: "Todos los estados" })
  return chips
}
