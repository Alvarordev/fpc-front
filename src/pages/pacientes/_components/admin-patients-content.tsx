import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePatients } from "../_hooks/use-patients"
import { PatientsToolbar } from "./patients-toolbar"
import { PatientsTable } from "./patients-table"
import { patientColumns } from "./patients-columns"
import type { PatientActivityStatus } from "@/api/patients"

export function AdminPatientsContent() {
  const [search, setSearch] = useState("")
  const [activityStatusFilter, setActivityStatusFilter] =
    useState<PatientActivityStatus | null>(null)
  const [roleFilter, setRoleFilter] = useState<"COMPANION" | null>(null)
  const navigate = useNavigate()

  const { data: patientPage, isLoading } = usePatients({
    filters: {
      segment: "CARE",
      search: search || undefined,
      activityStatus: activityStatusFilter ?? undefined,
      role: roleFilter ?? undefined,
    },
  })
  const patients = patientPage?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Pacientes
          </h1>
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
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      <PatientsTable
        data={patients}
        columns={patientColumns}
        isLoading={isLoading}
        onRowClick={(p) => navigate(`/pacientes/${p.id}`)}
      />
    </div>
  )
}
