import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { CircleHelp } from "lucide-react"
import { IconButton } from "@/components/ds/button"
import { PatientHealthSubcategoryProtocolDialog } from "@/components/patient-health-subcategory-protocol-dialog"
import type { PatientListFilters } from "@/api/patients"
import { usePatients } from "../_hooks/use-patients"
import { PatientsFilters } from "./patients-filters"
import { PatientsTable } from "./patients-table"
import { patientColumns } from "./patients-columns"
import {
  filterPatients,
  hasPatientFilters,
  readPatientFilters,
} from "../_lib/patient-filters"

function serverFilters(
  filters: ReturnType<typeof readPatientFilters>,
  includeStatus: boolean,
): PatientListFilters {
  return {
    segment: "CARE",
    role: "PATIENT",
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.healthPhase ? { healthPhase: filters.healthPhase } : {}),
    ...(filters.healthSubcategory ? { healthSubcategory: filters.healthSubcategory } : {}),
    ...(includeStatus && filters.activityStatus ? { activityStatus: filters.activityStatus } : {}),
  }
}

export function AdminPatientsContent() {
  const [params] = useSearchParams()
  const filters = readPatientFilters(params)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const navigate = useNavigate()

  const { data: everyone } = usePatients({
    filters: { segment: "CARE", role: "PATIENT" },
  })
  const { data: poolPage } = usePatients({
    filters: serverFilters(filters, false),
  })
  const { data: listedPage, isLoading } = usePatients({
    filters: serverFilters(filters, true),
  })

  const rows = useMemo(
    () =>
      filterPatients(listedPage?.data ?? [], {
        activityStatus: null,
        diagnosis: filters.diagnosis,
        hospital: filters.hospital,
        department: filters.department,
        followUp: filters.followUp,
        age: filters.age,
        companion: filters.companion,
      }),
    [
      listedPage?.data,
      filters.diagnosis,
      filters.hospital,
      filters.department,
      filters.followUp,
      filters.age,
      filters.companion,
    ],
  )
  const total = everyone?.total ?? listedPage?.total ?? 0
  const filtering = hasPatientFilters(filters)

  return (
    <div className="font-ds space-y-5">
      <header>
        <div className="flex items-center gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Pacientes</h1>
          <IconButton
            icon={CircleHelp}
            label="Ver protocolo de subcategorías"
            onClick={() => setProtocolOpen(true)}
          />
        </div>
        <p className="text-[13px] text-zinc-500">
          {isLoading && !listedPage
            ? "Cargando…"
            : filtering
              ? `${rows.length} de ${total}`
              : `${total} en seguimiento`}
        </p>
      </header>

      <PatientsFilters source={poolPage?.data ?? []} />

      <PatientsTable
        data={rows}
        columns={patientColumns}
        isLoading={isLoading}
        onRowClick={(patient) => navigate(`/pacientes/${patient.id}`)}
        emptyTitle="Sin pacientes"
        emptyBody="Prueba con otro nombre, documento o filtro."
      />

      <PatientHealthSubcategoryProtocolDialog
        open={protocolOpen}
        onOpenChange={setProtocolOpen}
      />
    </div>
  )
}
