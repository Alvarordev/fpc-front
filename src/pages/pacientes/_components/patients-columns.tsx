import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { PatientHealthSubcategoryBadge } from "@/components/patient-health-subcategory-badge"
import { cn } from "@/lib/utils"
import type { PatientListItem, PatientHealthPhase } from "@/api/patients"
import { healthPhaseLabels } from "@/pages/pacientes/[id]/_lib/clinical-labels"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"

const healthPhaseStyles: Record<PatientHealthPhase, string> = {
  CANCER_DIAGNOSIS: "bg-rose-50 text-rose-700 border-rose-200",
  ANNUAL_CHECKUP: "bg-sky-50 text-sky-700 border-sky-200",
  SIGNS_AND_SYMPTOMS: "bg-amber-50 text-amber-700 border-amber-200",
}

export const patientColumns: ColumnDef<PatientListItem>[] = [
  {
    accessorKey: "fullName",
    header: "Paciente",
    cell: ({ row }) => {
      const patient = row.original
      const initials = patient.fullName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">{patient.fullName}</p>
            <p className="text-muted-foreground text-xs">
              {patient.dni ? `DNI ${patient.dni}` : "Sin DNI"}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "currentDiagnosis",
    header: "Diagnóstico",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.currentDiagnosis?.diagnosis ?? "-"}
      </span>
    ),
  },
  {
    id: "currentDepartment",
    header: "Departamento",
    cell: ({ row }) => {
      const department = row.original.currentDepartment
      if (!department) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      return (
        <span className="text-muted-foreground text-sm">
          {DEPARTMENT_LABELS[department] ?? department}
        </span>
      )
    },
  },
  {
    id: "healthPhase",
    header: "Fase de salud",
    cell: ({ row }) => {
      const phase = row.original.healthPhase
      if (!phase) {
        return (
          <span className="text-muted-foreground text-sm">Sin clasificar</span>
        )
      }
      return (
        <Badge className={cn("border font-medium", healthPhaseStyles[phase])}>
          {healthPhaseLabels[phase]}
        </Badge>
      )
    },
  },
  {
    id: "healthSubcategory",
    header: "Subcategoría",
    cell: ({ row }) => (
      <PatientHealthSubcategoryBadge
        subcategory={row.original.healthSubcategory}
      />
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => {
      const patient = row.original
      const activityClass =
        patient.activityStatus === "ACTIVE"
          ? "bg-emerald-50 text-emerald-700"
          : patient.activityStatus === "INACTIVE"
            ? "bg-zinc-100 text-zinc-600"
            : "bg-orange-50 text-orange-700"
      const activityLabel =
        patient.activityStatus === "ACTIVE"
          ? "Activo"
          : patient.activityStatus === "INACTIVE"
            ? "Inactivo"
            : "Reactivo"
      return (
        <Badge className={cn("border", activityClass)}>{activityLabel}</Badge>
      )
    },
  },
]
