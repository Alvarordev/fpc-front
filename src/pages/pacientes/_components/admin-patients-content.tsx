import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CircleHelp } from "lucide-react"
import { usePatients } from "../_hooks/use-patients"
import { PatientsToolbar } from "./patients-toolbar"
import { PatientsTable } from "./patients-table"
import { patientColumns } from "./patients-columns"
import type {
  PatientActivityStatus,
  PatientHealthPhase,
  PatientHealthSubcategoryFilter,
} from "@/api/patients"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PatientHealthSubcategoryProtocolDialog } from "@/components/patient-health-subcategory-protocol-dialog"

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

  const { data: patientPage, isLoading } = usePatients({
    filters: {
      segment: "CARE",
      search: search || undefined,
      activityStatus: activityStatusFilter ?? undefined,
      healthPhase: healthPhaseFilter ?? undefined,
      healthSubcategory: healthSubcategoryFilter ?? undefined,
      role: "PATIENT",
    },
  })
  const patients = patientPage?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Pacientes
            </h1>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground size-7"
                    aria-label="Ver protocolo de subcategorías"
                    onClick={() => setProtocolOpen(true)}
                  >
                    <CircleHelp className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Ver protocolo de subcategorías</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {patientPage?.total ?? 0} pacientes en seguimiento
          </p>
        </div>
      </div>

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
        onRowClick={(p) => navigate(`/pacientes/${p.id}`)}
      />

      <PatientHealthSubcategoryProtocolDialog
        open={protocolOpen}
        onOpenChange={setProtocolOpen}
      />
    </div>
  )
}
