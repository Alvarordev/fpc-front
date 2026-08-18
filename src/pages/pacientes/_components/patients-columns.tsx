import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PatientListItem } from "@/api/patients"

const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-"

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
    accessorKey: "currentDepartment",
    header: "Departamento",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {row.original.currentDepartment ?? "-"}
      </span>
    ),
  },
  {
    accessorKey: "primaryPhone",
    header: "Teléfono",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "latestFollowUp",
    header: "Último seguimiento",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {date(row.original.latestFollowUp?.occurredAt ?? null)}
      </span>
    ),
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
