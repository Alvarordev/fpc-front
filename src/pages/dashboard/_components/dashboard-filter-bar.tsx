import { useQuery } from "@tanstack/react-query"
import { agentsApi } from "@/api/agents"
import { HealthCenterCombobox } from "@/components/health-center-combobox"
import { Card } from "@/components/ds/card"
import { Field, SelectField, TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { PERU_DEPARTMENTS } from "@/lib/peru-departments"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoryLabels,
} from "@/lib/patient-health-subcategory"
import type { DashboardFilterState } from "../_lib/dashboard-filters"
import type { DashboardIndicatorQuery } from "@/api/dashboard"
import { DashboardExportButton } from "./dashboard-export-button"

const ALL = "all"

export function DashboardFilterBar({
  filters,
  query,
  onChange,
}: {
  filters: DashboardFilterState
  query: DashboardIndicatorQuery
  onChange: (patch: Partial<DashboardFilterState>) => void
}) {
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
  })
  const departmentItems = [
    { value: ALL, label: "Todos los departamentos" },
    ...PERU_DEPARTMENTS.map((item) => ({ value: item.value, label: item.label })),
  ]
  const phaseItems = [
    { value: ALL, label: "Todas las fases" },
    ...Object.entries(patientHealthPhaseLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ]
  const subcategoryItems = [
    { value: ALL, label: "Todas las subcategorías" },
    ...Object.entries(patientHealthSubcategoryLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ]
  const agents = agentsQuery.data ?? []
  const agentItems = [
    { value: ALL, label: "Todos los agentes" },
    ...agents.map((agent) => ({ value: agent.id, label: agent.fullName })),
  ]
  // Un agente que llega por la URL antes de cargar la lista (o que ya no está)
  // no debe mostrarse como UUID crudo en el select.
  if (filters.agentId && !agents.some((agent) => agent.id === filters.agentId)) {
    agentItems.push({
      value: filters.agentId,
      label: agentsQuery.isLoading ? "Cargando agente…" : "Agente no disponible",
    })
  }
  const partialRange = Boolean(filters.from) !== Boolean(filters.to)
  const invertedRange = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  )
  const hasFilters = Boolean(
    filters.from ||
      filters.to ||
      filters.department ||
      filters.healthCenterId ||
      filters.agentId ||
      filters.healthPhase ||
      filters.healthSubcategory,
  )

  const pick =
    (key: "department" | "agentId" | "healthPhase" | "healthSubcategory") =>
    (value: string) =>
      onChange({ [key]: value === ALL ? "" : value })

  return (
    <Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Desde">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => onChange({ from: event.target.value })}
            />
          )}
        </Field>
        <Field label="Hasta">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => onChange({ to: event.target.value })}
            />
          )}
        </Field>
        <Field label="Departamento">
          {(id) => (
            <SelectField
              id={id}
              value={filters.department || ALL}
              options={departmentItems}
              onChange={pick("department")}
            />
          )}
        </Field>
        <Field label="Hospital">
          {() => (
            <HealthCenterCombobox
              value={filters.healthCenterId || null}
              onValueChange={(value) => onChange({ healthCenterId: value ?? "" })}
              placeholder="Buscar hospital..."
            />
          )}
        </Field>
        <Field label="Agente">
          {(id) => (
            <SelectField
              id={id}
              value={filters.agentId || ALL}
              options={agentItems}
              onChange={pick("agentId")}
            />
          )}
        </Field>
        <Field label="Fase">
          {(id) => (
            <SelectField
              id={id}
              value={filters.healthPhase || ALL}
              options={phaseItems}
              onChange={pick("healthPhase")}
            />
          )}
        </Field>
        <Field label="Subcategoría">
          {(id) => (
            <SelectField
              id={id}
              value={filters.healthSubcategory || ALL}
              options={subcategoryItems}
              onChange={pick("healthSubcategory")}
            />
          )}
        </Field>
        <div className="flex items-end gap-3">
          <DashboardExportButton query={query} />
          {hasFilters && (
            <button
              type="button"
              className="h-8 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
              onClick={() =>
                onChange({
                  from: "",
                  to: "",
                  department: "",
                  healthCenterId: "",
                  agentId: "",
                  healthPhase: "",
                  healthSubcategory: "",
                })
              }
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      {(partialRange || invertedRange) && (
        <div className="mt-4">
          <InlineAlert tone="warning">
            {invertedRange
              ? "La fecha «Desde» es posterior a «Hasta». Corrígela para aplicar el rango."
              : "Completa «Desde» y «Hasta» para aplicar el rango. Mientras tanto se usa el mes o año elegido."}
          </InlineAlert>
        </div>
      )}
    </Card>
  )
}
