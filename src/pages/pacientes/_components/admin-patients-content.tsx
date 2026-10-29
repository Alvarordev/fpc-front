import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CircleHelp } from "lucide-react"
import { IconButton } from "@/components/ds/button"
import { PatientHealthSubcategoryProtocolDialog } from "@/components/patient-health-subcategory-protocol-dialog"
import type {
  PatientActivityStatus,
  PatientHealthPhase,
  PatientHealthSubcategoryFilter,
} from "@/api/patients"
import { usePatients } from "../_hooks/use-patients"
import { PatientsToolbar } from "./patients-toolbar"
import { PatientsTable } from "./patients-table"
import { patientColumns } from "./patients-columns"

export function AdminPatientsContent() {
  const [search, setSearch] = useState("")
  const [activityStatusFilter, setActivityStatusFilter] =
    useState<PatientActivityStatus | null>(null)
  const [healthPhaseFilter, setHealthPhaseFilter] =
    useState<PatientHealthPhase | null>(null)
  const [healthSubcategoryFilter, setHealthSubcategoryFilter] =
    useState<PatientHealthSubcategoryFilter | null>(null)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const navigate = useNavigate()

  const hasFilters = Boolean(
    search || activityStatusFilter || healthPhaseFilter || healthSubcategoryFilter,
  )
  const baseFilters = { segment: "CARE" as const, role: "PATIENT" as const }
  const { data: allPatients } = usePatients({ filters: baseFilters })
  const { data: patientPage, isLoading } = usePatients({
    filters: {
      ...baseFilters,
      search: search || undefined,
      activityStatus: activityStatusFilter ?? undefined,
      healthPhase: healthPhaseFilter ?? undefined,
      healthSubcategory: healthSubcategoryFilter ?? undefined,
    },
  })
  const patients = patientPage?.data ?? []
  const total = allPatients?.total ?? patientPage?.total ?? 0
  const shown = patientPage?.total ?? patients.length

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Pacientes</h1>
            <IconButton
              icon={CircleHelp}
              label="Ver protocolo de subcategorías"
              onClick={() => setProtocolOpen(true)}
            />
          </div>
          <p className="text-[13px] text-zinc-500">
            {isLoading && !patientPage
              ? "Cargando…"
              : hasFilters
                ? `${shown} de ${total}`
                : `${total} en seguimiento`}
          </p>
        </div>
      </header>

      <PatientsToolbar
        search={search}
        onSearchChange={setSearch}
        activityStatusFilter={activityStatusFilter}
        onActivityStatusFilterChange={setActivityStatusFilter}
        healthPhaseFilter={healthPhaseFilter}
        onHealthPhaseFilterChange={setHealthPhaseFilter}
        healthSubcategoryFilter={healthSubcategoryFilter}
        onHealthSubcategoryFilterChange={setHealthSubcategoryFilter}
      />

      <PatientsTable
        data={patients}
        columns={patientColumns}
        isLoading={isLoading}
        onRowClick={(patient) => navigate(`/pacientes/${patient.id}`)}
        emptyTitle="Sin pacientes"
        emptyBody="Prueba con otro nombre, documento o celular."
      />

      <PatientHealthSubcategoryProtocolDialog
        open={protocolOpen}
        onOpenChange={setProtocolOpen}
      />
    </div>
  )
}
