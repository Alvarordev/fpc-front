import type { ColumnDef } from "@tanstack/react-table"
import type { PatientDetailsResponse } from "@/api/patients"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { Status } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { formatAgendaDateTime } from "@/pages/agente-agenda/_lib/agenda"
import { appointmentStatus, canRegisterResult, sessionLabel } from "./agenda-status"

interface VolunteerAgendaTableProps {
  appointments: PsychooncologyAppointment[]
  patients: Map<string, PatientDetailsResponse>
  onSelectAppointment: (appointment: PsychooncologyAppointment) => void
  onRegister: (appointment: PsychooncologyAppointment) => void
}

export function VolunteerAgendaTable({
  appointments,
  patients,
  onSelectAppointment,
  onRegister,
}: VolunteerAgendaTableProps) {
  const columns: ColumnDef<PsychooncologyAppointment, unknown>[] = [
    {
      id: "patient",
      header: "Paciente",
      accessorFn: (appointment) =>
        patients.get(appointment.patientId)?.fullName ?? "Paciente desconocido",
      cell: ({ row }) => {
        const appointment = row.original
        return (
          <div className="min-w-40">
            <p className="truncate text-sm font-medium text-zinc-900">
              {patients.get(appointment.patientId)?.fullName ?? "Paciente desconocido"}
            </p>
            {appointment.beneficiaryType === "COMPANION" && (
              <p className="truncate text-[13px] text-zinc-500">
                Acompañante: {textValue(appointment.companionFullName) ?? "sin nombre"}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "sessionNumber",
      header: "Sesión",
      cell: ({ row }) => (
        <span className="text-[13px] text-zinc-700">{sessionLabel(row.original.sessionNumber)}</span>
      ),
    },
    {
      accessorKey: "modality",
      header: "Modalidad",
      cell: ({ row }) => (
        <span className="text-[13px] text-zinc-700">
          {row.original.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada"}
        </span>
      ),
    },
    {
      accessorKey: "scheduledAt",
      header: "Fecha y hora",
      cell: ({ getValue }) => (
        <span className="text-[13px] whitespace-nowrap text-zinc-700 tabular-nums">
          {formatAgendaDateTime(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const status = appointmentStatus[getValue() as PsychooncologyAppointment["status"]]
        return <Status tone={status.tone}>{status.label}</Status>
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      meta: { align: "right" },
      cell: ({ row }) =>
        canRegisterResult(row.original) ? (
          <Button
            variant={row.original.status === "OVERDUE" ? "brand" : "outline"}
            onClick={() => onRegister(row.original)}
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
      emptyTitle="Sin sesiones"
      emptyBody="Aún no tienes sesiones asignadas. Cuando el equipo programe una, aparecerá aquí."
    />
  )
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const result = String(value).trim()
  return result || null
}
