import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { PatientListItem } from "@/api/patients"
import { Button } from "@/components/ds/button"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { ChoiceGroup, Field, SelectField, TextInput } from "@/components/ds/form"
import { SearchSelect } from "@/components/ds/search-select"
import { useCatalog, catalogLabel } from "@/hooks/use-catalog"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import {
  ALL_FILTER,
  ageOptions,
  companionOptions,
  filterChips,
  followUpOptions,
  phaseChoices,
  subcategoryChoices,
} from "../_lib/patient-filter-options"
import {
  EMPTY_PATIENT_FILTERS,
  countActivity,
  filterPatients,
  panelFilterCount,
  readPatientFilters,
  subcategoryFitsPhase,
  writePatientFilters,
  type PatientFilterState,
} from "../_lib/patient-filters"

export function PatientsFilters({ source }: { source: PatientListItem[] }) {
  const [params, setParams] = useSearchParams()
  const filters = readPatientFilters(params)
  const [searchInput, setSearchInput] = useState(filters.search)
  const [syncedSearch, setSyncedSearch] = useState(filters.search)
  if (syncedSearch !== filters.search) {
    setSyncedSearch(filters.search)
    setSearchInput(filters.search)
  }
  const [open, setOpen] = useState(() => panelFilterCount(filters) > 0)
  const { data: diagnosisCatalog = [] } = useCatalog("cancer_diagnosis")

  useEffect(() => {
    if (searchInput === filters.search) return
    const timer = window.setTimeout(() => {
      setParams((current) => {
        const currentFilters = readPatientFilters(current)
        if (currentFilters.search === searchInput) return current
        return writePatientFilters(current, { ...currentFilters, search: searchInput })
      }, { replace: true })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput, filters.search, setParams])

  function commit(partial: Partial<PatientFilterState>) {
    const next = { ...readPatientFilters(params), ...partial }
    if (!subcategoryFitsPhase(next.healthSubcategory, next.healthPhase)) {
      next.healthSubcategory = null
    }
    setParams(writePatientFilters(params, next), { replace: true })
  }

  const withoutStatus = useMemo(
    () => filterPatients(source, { ...filters, activityStatus: null }),
    [source, filters],
  )
  const counts = countActivity(withoutStatus)
  const panelCount = panelFilterCount(filters)

  const diagnosisOptions = useMemo(() => {
    const codes = new Set<string>()
    for (const patient of source) {
      const code = patient.currentDiagnosis?.diagnosis
      if (code) codes.add(code)
    }
    return [...codes]
      .map((code) => ({ value: code, label: catalogLabel(diagnosisCatalog, code) }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  }, [source, diagnosisCatalog])

  const hospitalOptions = useMemo(() => {
    const names = new Set<string>()
    for (const patient of source) {
      const name = patient.currentDiagnosis?.healthCenterName
      if (name) names.add(name)
    }
    return [...names]
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }))
  }, [source])

  const departmentOptions = useMemo(() => {
    const codes = new Set<string>()
    for (const patient of source) {
      if (patient.currentDepartment) codes.add(patient.currentDepartment)
    }
    return [...codes]
      .map((code) => ({ value: code, label: DEPARTMENT_LABELS[code] ?? code }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"))
  }, [source])

  const subcategoryOptions = subcategoryChoices(filters.healthPhase)
  const chips = filterChips(filters, diagnosisOptions)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, documento o celular"
            aria-label="Buscar pacientes"
            className="pl-9"
          />
        </div>
        <FilterToggles
          value={filters.activityStatus ?? "ALL"}
          onChange={(value) => commit({ activityStatus: value === "ALL" ? null : value })}
          options={[
            { id: "ALL", label: "Todos", count: counts.ALL },
            { id: "ACTIVE", label: "Activos", count: counts.ACTIVE },
            { id: "REACTIVE", label: "Reenrolados", count: counts.REACTIVE },
            { id: "INACTIVE", label: "Inactivos", count: counts.INACTIVE },
          ]}
        />
      </div>

      <div>
        <Button
          variant="outline"
          icon={SlidersHorizontal}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {panelCount > 0 ? `Filtros · ${panelCount}` : "Filtros"}
        </Button>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-3 rounded-[14px] bg-white p-4 ring-1 ring-zinc-200 sm:grid-cols-3">
            <Field label="Fase de salud">
              {(id) => (
                <SelectField
                  id={id}
                  value={filters.healthPhase ?? ALL_FILTER}
                  onChange={(value) => commit({ healthPhase: value === ALL_FILTER ? null : (value as PatientFilterState["healthPhase"]) })}
                  options={[{ value: ALL_FILTER, label: "Todas" }, ...phaseChoices()]}
                />
              )}
            </Field>
            <Field label="Subcategoría">
              {(id) => (
                <SelectField
                  id={id}
                  value={filters.healthSubcategory ?? ALL_FILTER}
                  onChange={(value) => commit({ healthSubcategory: value === ALL_FILTER ? null : value })}
                  options={subcategoryOptions}
                />
              )}
            </Field>
            <Field label="Diagnóstico">
              {(id) => (
                <SearchSelect
                  id={id}
                  value={filters.diagnosis}
                  onChange={(value) => commit({ diagnosis: value })}
                  options={diagnosisOptions}
                  placeholder="Todos"
                  searchPlaceholder="Buscar diagnóstico"
                />
              )}
            </Field>
            <Field label="Hospital">
              {(id) => (
                <SearchSelect
                  id={id}
                  value={filters.hospital}
                  onChange={(value) => commit({ hospital: value })}
                  options={hospitalOptions}
                  placeholder="Todos"
                  searchPlaceholder="Buscar hospital"
                />
              )}
            </Field>
            <Field label="Departamento">
              {(id) => (
                <SelectField
                  id={id}
                  value={filters.department ?? ALL_FILTER}
                  onChange={(value) => commit({ department: value === ALL_FILTER ? null : value })}
                  options={[{ value: ALL_FILTER, label: "Todos" }, ...departmentOptions]}
                />
              )}
            </Field>
            <Field label="Seguimiento">
              {(id) => (
                <SelectField
                  id={id}
                  value={filters.followUp ?? ALL_FILTER}
                  onChange={(value) => commit({ followUp: value === ALL_FILTER ? null : (value as PatientFilterState["followUp"]) })}
                  options={followUpOptions}
                />
              )}
            </Field>
            <Field label="Edad">
              {(id) => (
                <SelectField
                  id={id}
                  value={filters.age ?? ALL_FILTER}
                  onChange={(value) => commit({ age: value === ALL_FILTER ? null : (value as PatientFilterState["age"]) })}
                  options={ageOptions}
                />
              )}
            </Field>
            <Field label="Acompañante principal">
              {() => (
                <ChoiceGroup
                  label="Acompañante principal"
                  value={filters.companion}
                  options={companionOptions}
                  onChange={(value) => commit({ companion: filters.companion === value ? null : value })}
                />
              )}
            </Field>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => commit({ [chip.id]: chip.id === "search" ? "" : null })}
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
              setParams(writePatientFilters(params, EMPTY_PATIENT_FILTERS), { replace: true })
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
