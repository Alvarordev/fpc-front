import { Search, X } from "lucide-react"
import { Button } from "@/components/ds/button"
import { SelectField, TextInput } from "@/components/ds/form"
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

const ALL = "ALL"

const activityStatusOptions: { value: PatientActivityStatus | typeof ALL; label: string }[] = [
  { value: ALL, label: "Todos los estados" },
  { value: "ACTIVE", label: "Activo" },
  { value: "REACTIVE", label: "Reenrolado" },
  { value: "INACTIVE", label: "Inactivo" },
]

const activityStatusLabels: Record<PatientActivityStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reenrolado",
}

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
  const phaseOptions = [
    { value: ALL, label: "Todas las fases" },
    ...Object.entries(patientHealthPhaseLabels).map(([value, label]) => ({ value, label })),
  ]
  const subcategoryOptions = [
    { value: ALL, label: "Todas las subcategorías" },
    { value: "UNASSIGNED", label: "Sin subcategoría" },
    ...patientHealthSubcategoryOptions.map(({ value, label }) => ({ value, label })),
  ]
  const chips = [
    activityStatusFilter
      ? { key: "status", label: activityStatusLabels[activityStatusFilter], clear: () => onActivityStatusFilterChange(null) }
      : null,
    healthPhaseFilter
      ? { key: "phase", label: patientHealthPhaseLabels[healthPhaseFilter], clear: () => onHealthPhaseFilterChange(null) }
      : null,
    healthSubcategoryFilter
      ? {
          key: "sub",
          label:
            healthSubcategoryFilter === "UNASSIGNED"
              ? "Sin subcategoría"
              : (patientHealthSubcategoryLabels[
                  healthSubcategoryFilter as keyof typeof patientHealthSubcategoryLabels
                ] ?? healthSubcategoryFilter),
          clear: () => onHealthSubcategoryFilterChange(null),
        }
      : null,
  ].filter((chip) => chip !== null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
          <TextInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre, documento o celular"
            aria-label="Buscar pacientes"
            className="pl-9"
          />
        </div>
        <div className="w-44">
          <SelectField
            value={activityStatusFilter ?? ALL}
            onChange={(value) =>
              onActivityStatusFilterChange(value === ALL ? null : (value as PatientActivityStatus))
            }
            options={activityStatusOptions}
            placeholder="Todos los estados"
          />
        </div>
        <div className="w-48">
          <SelectField
            value={healthPhaseFilter ?? ALL}
            onChange={(value) =>
              onHealthPhaseFilterChange(value === ALL ? null : (value as PatientHealthPhase))
            }
            options={phaseOptions}
            placeholder="Todas las fases"
          />
        </div>
        <div className="w-64">
          <SelectField
            value={healthSubcategoryFilter ?? ALL}
            onChange={(value) =>
              onHealthSubcategoryFilterChange(
                value === ALL ? null : (value as PatientHealthSubcategoryFilter),
              )
            }
            options={subcategoryOptions}
            placeholder="Todas las subcategorías"
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              onSearchChange("")
              onActivityStatusFilterChange(null)
              onHealthPhaseFilterChange(null)
              onHealthSubcategoryFilterChange(null)
            }}
          >
            Limpiar
          </Button>
        </div>
      )}
    </div>
  )
}
