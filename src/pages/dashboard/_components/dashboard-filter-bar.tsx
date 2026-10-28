import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { agentsApi } from "@/api/agents"
import { HealthCenterCombobox } from "@/components/health-center-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const agentItems = [
    { value: ALL, label: "Todos los agentes" },
    ...(agentsQuery.data ?? []).map((agent) => ({
      value: agent.id,
      label: agent.fullName,
    })),
  ]

  return (
    <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-4">
      <Field label="Desde">
        <Input
          type="date"
          value={filters.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </Field>
      <Field label="Hasta">
        <Input
          type="date"
          value={filters.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </Field>
      <Field label="Departamento">
        <Select
          items={departmentItems}
          value={filters.department || ALL}
          onValueChange={(value) =>
            onChange({ department: !value || value === ALL ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Hospital">
        <HealthCenterCombobox
          value={filters.healthCenterId || null}
          onValueChange={(value) => onChange({ healthCenterId: value ?? "" })}
          placeholder="Buscar hospital..."
        />
      </Field>
      <Field label="Agente">
        <Select
          items={agentItems}
          value={filters.agentId || ALL}
          onValueChange={(value) =>
            onChange({ agentId: !value || value === ALL ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Todos los agentes" />
          </SelectTrigger>
          <SelectContent>
            {agentItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Fase">
        <Select
          items={phaseItems}
          value={filters.healthPhase || ALL}
          onValueChange={(value) =>
            onChange({ healthPhase: !value || value === ALL ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {phaseItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Subcategoría">
        <Select
          items={subcategoryItems}
          value={filters.healthSubcategory || ALL}
          onValueChange={(value) =>
            onChange({ healthSubcategory: !value || value === ALL ? "" : value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subcategoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="flex items-end gap-2">
        <DashboardExportButton query={query} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
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
          Limpiar
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
