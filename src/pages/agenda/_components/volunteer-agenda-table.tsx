import type { ColumnDef } from "@tanstack/react-table"
import { CalendarDays, Phone, Video } from "lucide-react"
import type { PatientDetailsResponse } from "@/api/patients"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatAgendaDateTime } from "@/pages/agente-agenda/_lib/agenda"
import { cn } from "@/lib/utils"

interface VolunteerAgendaTableProps {
  appointments: PsychooncologyAppointment[]
  patients: Map<string, PatientDetailsResponse>
  onSelectAppointment: (appointment: PsychooncologyAppointment) => void
  onRegister: (appointment: PsychooncologyAppointment) => void
}

const statusLabels: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
}

const statusStyles: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "border-violet-200 bg-violet-50 text-violet-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-600",
  NO_ANSWER: "border-amber-200 bg-amber-50 text-amber-700",
}

export function VolunteerAgendaTable({
  appointments,
  patients,
  onSelectAppointment,
  onRegister,
}: VolunteerAgendaTableProps) {
  const columns: ColumnDef<PsychooncologyAppointment>[] = [
    {
      id: "patient",
      header: "Paciente",
      accessorFn: (appointment) =>
        patients.get(appointment.patientId)?.fullName ?? "Paciente desconocido",
      cell: ({ row }) => {
        const appointment = row.original
        const patientName =
          patients.get(appointment.patientId)?.fullName ??
          "Paciente desconocido"
        const companionName = textValue(appointment.companionFullName)

        return (
          <div className="flex min-w-40 items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
              {appointment.beneficiaryType === "COMPANION" ? (
                <span className="text-xs font-semibold">A</span>
              ) : (
                <CalendarDays className="size-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">
                {patientName}
              </p>
              {appointment.beneficiaryType === "COMPANION" && (
                <p className="text-muted-foreground truncate text-xs">
                  {companionName ?? "Acompañante"}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "sessionNumber",
      header: "Sesión",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.sessionNumber
            ? `Sesión ${row.original.sessionNumber}`
            : "Sesión extra"}
        </span>
      ),
    },
    {
      accessorKey: "modality",
      header: "Modalidad",
      cell: ({ row }) => {
        const isVideo = row.original.modality === "VIDEO_CALL"
        const Icon = isVideo ? Video : Phone
        return (
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Icon className="size-3.5" />
            {isVideo ? "Videollamada" : "Llamada"}
          </span>
        )
      },
    },
    {
      accessorKey: "scheduledAt",
      header: "Fecha y hora",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {formatAgendaDateTime(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const status = getValue() as PsychooncologyAppointment["status"]
        return (
          <Badge className={cn("border font-medium", statusStyles[status])}>
            {statusLabels[status]}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === "SCHEDULED" ? (
          <Button
            size="sm"
            onClick={(event) => {
              event.stopPropagation()
              onRegister(row.original)
            }}
          >
            Registrar
          </Button>
        ) : null,
    },
  ]

  return (
    <DataTable
      data={appointments}
      columns={columns}
      onRowClick={onSelectAppointment}
      emptyMessage="No hay sesiones para mostrar."
    />
  )
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const result = String(value).trim()
  return result || null
}
