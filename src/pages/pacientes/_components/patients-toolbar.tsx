import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  PatientActivityStatus,
  PatientHealthPhase,
  PatientHealthSubcategoryFilter,
} from "@/api/patients"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoryLabels,
  patientHealthSubcategoryOptions,
} from "@/lib/patient-health-subcategory"

interface PatientsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  activityStatusFilter: PatientActivityStatus | null
  onActivityStatusFilterChange: (status: PatientActivityStatus | null) => void
  healthPhaseFilter: PatientHealthPhase | null
  onHealthPhaseFilterChange: (phase: PatientHealthPhase | null) => void
  healthSubcategoryFilter: PatientHealthSubcategoryFilter | null
  onHealthSubcategoryFilterChange: (
    subcategory: PatientHealthSubcategoryFilter | null,
  ) => void
}

const ALL_FILTER_VALUE = "ALL"

const activityStatusOptions: {
  value: PatientActivityStatus
  label: string
}[] = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "REACTIVE", label: "Reactivo" },
]

const activityStatusLabels: Record<PatientActivityStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reactivo",
}

const healthPhaseOptions = Object.entries(patientHealthPhaseLabels).map(
  ([value, label]) => ({ value, label }),
)

const healthSubcategoryOptions = [
  { value: ALL_FILTER_VALUE, label: "Todas las subcategorías" },
  { value: "UNASSIGNED", label: "Sin subcategoría" },
  ...patientHealthSubcategoryOptions.map(({ value, label }) => ({
    value,
    label,
  })),
]

export function PatientsToolbar({
  search,
  onSearchChange,
  activityStatusFilter,
  onActivityStatusFilterChange,
  healthPhaseFilter,
  onHealthPhaseFilterChange,
  healthSubcategoryFilter,
  onHealthSubcategoryFilterChange,
}: PatientsToolbarProps) {
  const hasFilters = Boolean(
    search ||
      activityStatusFilter ||
      healthPhaseFilter ||
      healthSubcategoryFilter,
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background h-8 pl-8 text-sm"
          />
        </div>

        <Select
          items={[
            { value: ALL_FILTER_VALUE, label: "Todos los estados" },
            ...activityStatusOptions,
          ]}
          value={activityStatusFilter ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onActivityStatusFilterChange(
              value === ALL_FILTER_VALUE
                ? null
                : (value as PatientActivityStatus),
            )
          }
        >
          <SelectTrigger
            aria-label="Filtrar por estado"
            className="bg-background h-8 w-40 text-xs"
          >
            <SlidersHorizontal className="text-muted-foreground size-3.5" />
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Todos los estados</SelectItem>
            {activityStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={[
            { value: ALL_FILTER_VALUE, label: "Todas las fases" },
            ...healthPhaseOptions,
          ]}
          value={healthPhaseFilter ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onHealthPhaseFilterChange(
              value === ALL_FILTER_VALUE
                ? null
                : (value as PatientHealthPhase),
            )
          }
        >
          <SelectTrigger
            aria-label="Filtrar por fase de salud"
            className="bg-background h-8 w-44 text-xs"
          >
            <SelectValue placeholder="Todas las fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>Todas las fases</SelectItem>
            {healthPhaseOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={healthSubcategoryOptions}
          value={healthSubcategoryFilter ?? ALL_FILTER_VALUE}
          onValueChange={(value) =>
            onHealthSubcategoryFilterChange(
              value === ALL_FILTER_VALUE
                ? null
                : (value as PatientHealthSubcategoryFilter),
            )
          }
        >
          <SelectTrigger
            aria-label="Filtrar por subcategoría"
            className="bg-background h-8 w-56 text-xs"
          >
            <SelectValue placeholder="Todas las subcategorías" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL_FILTER_VALUE}>
              Todas las subcategorías
            </SelectItem>
            <SelectItem value="UNASSIGNED">Sin subcategoría</SelectItem>
            {patientHealthSubcategoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 text-xs"
            onClick={() => {
              onSearchChange("")
              onActivityStatusFilterChange(null)
              onHealthPhaseFilterChange(null)
              onHealthSubcategoryFilterChange(null)
            }}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Filtros:</span>
          {activityStatusFilter && (
            <Badge
              variant="outline"
              className="hover:bg-muted h-6 cursor-pointer gap-1 px-2 text-xs font-normal"
              onClick={() => onActivityStatusFilterChange(null)}
            >
              {activityStatusLabels[activityStatusFilter]}
              <X className="size-3" />
            </Badge>
          )}
          {healthPhaseFilter && (
            <Badge
              variant="outline"
              className="hover:bg-muted h-6 cursor-pointer gap-1 px-2 text-xs font-normal"
              onClick={() => onHealthPhaseFilterChange(null)}
            >
              {patientHealthPhaseLabels[healthPhaseFilter]}
              <X className="size-3" />
            </Badge>
          )}
          {healthSubcategoryFilter && (
            <Badge
              variant="outline"
              className="hover:bg-muted h-6 cursor-pointer gap-1 px-2 text-xs font-normal"
              onClick={() => onHealthSubcategoryFilterChange(null)}
            >
              {healthSubcategoryFilter === "UNASSIGNED"
                ? "Sin subcategoría"
                : patientHealthSubcategoryLabels[healthSubcategoryFilter]}
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
