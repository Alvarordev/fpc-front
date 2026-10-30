import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { X } from "lucide-react"
import type { Alert } from "@/api/alerts"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { Field, SelectField } from "@/components/ds/form"
import { SearchSelect } from "@/components/ds/search-select"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"
import { alertSeverityChip, alertStatusLabels } from "../_lib/alert-copy"
import {
  DEFAULT_ALERT_FILTERS,
  countByStatus,
  readAlertFilters,
  writeAlertFilters,
  type AlertFilters,
  type AlertStatusFilter,
} from "../_lib/alert-filters"

const ALL = "all"

export function AlertsFilters({ alerts }: { alerts: Alert[] }) {
  const [params, setParams] = useSearchParams()
  const filters = readAlertFilters(params)
  const { data: centers = [] } = useHealthCenters()

  function commit(partial: Partial<AlertFilters>) {
    setParams(writeAlertFilters(params, { ...readAlertFilters(params), ...partial }), { replace: true })
  }

  const counts = useMemo(() => countByStatus(alerts, filters), [alerts, filters])
  const chips = filterChips(filters, centers)

  return (
    <div className="space-y-3">
      <FilterToggles
        value={filters.status}
        onChange={(status) => commit({ status })}
        options={[
          { id: "REPORTED" as AlertStatusFilter, label: alertStatusLabels.REPORTED, count: counts.REPORTED },
          { id: "IN_REVIEW", label: alertStatusLabels.IN_REVIEW, count: counts.IN_REVIEW },
          { id: "RESOLVED", label: alertStatusLabels.RESOLVED, count: counts.RESOLVED },
          { id: "all", label: alertStatusLabels.all, count: counts.all },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Severidad">
          {(id) => (
            <SelectField
              id={id}
              value={filters.severity ?? ALL}
              onChange={(value) => commit({ severity: value === ALL ? null : value })}
              options={[
                { value: ALL, label: "Todas" },
                { value: "HIGH", label: alertSeverityChip.HIGH.label },
                { value: "MEDIUM", label: alertSeverityChip.MEDIUM.label },
                { value: "LOW", label: alertSeverityChip.LOW.label },
              ]}
            />
          )}
        </Field>
        <Field label="Establecimiento">
          {(id) => (
            <SearchSelect
              id={id}
              value={filters.center ?? ALL}
              onChange={(value) => commit({ center: value === ALL ? null : value })}
              options={[{ value: ALL, label: "Todos" }, ...centers.map((center) => ({ value: center.id, label: center.name }))]}
              placeholder="Todos"
              searchPlaceholder="Buscar establecimiento"
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
              onClick={() => commit({ [chip.id]: chip.id === "status" ? "REPORTED" : null })}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              {chip.text}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setParams(writeAlertFilters(params, DEFAULT_ALERT_FILTERS), { replace: true })}
            className="text-[13px] text-zinc-600 underline decoration-zinc-300 underline-offset-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}

function filterChips(filters: AlertFilters, centers: { id: string; name: string }[]) {
  const chips: { id: keyof AlertFilters; text: string }[] = []
  if (filters.status === "IN_REVIEW") chips.push({ id: "status", text: alertStatusLabels.IN_REVIEW })
  if (filters.status === "RESOLVED") chips.push({ id: "status", text: alertStatusLabels.RESOLVED })
  if (filters.status === "all") chips.push({ id: "status", text: "Todos los estados" })
  if (filters.severity) chips.push({ id: "severity", text: alertSeverityChip[filters.severity].label })
  if (filters.center) {
    const name = centers.find((center) => center.id === filters.center)?.name
    chips.push({ id: "center", text: name ?? "Establecimiento" })
  }
  return chips
}
