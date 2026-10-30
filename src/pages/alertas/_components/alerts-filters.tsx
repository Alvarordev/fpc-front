import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import type { Alert } from "@/api/alerts"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { SelectField } from "@/components/ds/form"
import { SearchSelect } from "@/components/ds/search-select"
import { useHealthCenters } from "@/pages/hospitales/_hooks/use-health-centers"
import { alertSeverityChip, alertStatusLabels } from "../_lib/alert-copy"
import {
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

  return (
    <div className="flex flex-wrap items-center gap-3">
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
      <div className="flex w-full gap-3 sm:ml-auto sm:w-auto">
        <div className="w-44">
          <SelectField
            value={filters.severity ?? ALL}
            onChange={(value) => commit({ severity: value === ALL ? null : value })}
            options={[
              { value: ALL, label: "Toda severidad" },
              { value: "HIGH", label: `Severidad ${alertSeverityChip.HIGH.label.toLowerCase()}` },
              { value: "MEDIUM", label: `Severidad ${alertSeverityChip.MEDIUM.label.toLowerCase()}` },
              { value: "LOW", label: `Severidad ${alertSeverityChip.LOW.label.toLowerCase()}` },
            ]}
          />
        </div>
        <div className="min-w-0 flex-1 sm:w-72">
          <SearchSelect
            value={filters.center ?? ALL}
            onChange={(value) => commit({ center: value === ALL ? null : value })}
            options={[{ value: ALL, label: "Todos los establecimientos" }, ...centers.map((center) => ({ value: center.id, label: center.name }))]}
            placeholder="Todos los establecimientos"
            searchPlaceholder="Buscar establecimiento"
          />
        </div>
      </div>
    </div>
  )
}
