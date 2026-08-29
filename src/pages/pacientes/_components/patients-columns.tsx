import type { ColumnDef } from "@tanstack/react-table"
import { Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PatientListItem, PatientHealthPhase } from "@/api/patients"
import { healthPhaseLabels } from "@/pages/pacientes/[id]/_lib/clinical-labels"

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
    id: "healthPhase",
    header: "Tipo",
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
    id: "primaryCompanion",
    header: "Acompañante principal",
    cell: ({ row }) => {
      const name = row.original.primaryCompanionName
      if (!name) {
        return (
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Users className="size-3.5 opacity-50" />
            Sin acompañante
          </span>
        )
      }
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm">{name}</span>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            Principal
          </Badge>
        </div>
      )
    },
  },
  {
    id: "status",
    header: "Estado",
    cell: ({ row }) => {
      const patient = row.original
      const typeLabel =
        patient.role === "COMPANION"
          ? "Acompañante"
          : patient.status === "ENROLLED"
            ? "Enrolado"
            : "Prospecto"
      const typeClass =
        patient.role === "COMPANION"
          ? "bg-amber-50 text-amber-700"
          : patient.status === "ENROLLED"
            ? "bg-blue-50 text-blue-700"
            : "bg-violet-50 text-violet-700"
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
        <div className="flex flex-wrap gap-1">
          <Badge className={cn("border", typeClass)}>{typeLabel}</Badge>
          <Badge className={cn("border", activityClass)}>{activityLabel}</Badge>
        </div>
      )
    },
  },
]
