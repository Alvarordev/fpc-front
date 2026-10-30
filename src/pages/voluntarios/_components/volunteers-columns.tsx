import type { ColumnDef } from "@tanstack/react-table"
import type { Volunteer } from "@/api/volunteers"
import { Chip } from "@/components/ds/badge"
import { volunteerName } from "../_lib/volunteer-filters"

export function volunteerColumns({
  patientsByVolunteer,
  weekSlotsByVolunteer,
}: {
  patientsByVolunteer: Record<string, number>
  weekSlotsByVolunteer: Record<string, number>
}): ColumnDef<Volunteer, unknown>[] {
  return [
    {
      id: "name",
      header: "Voluntario",
      accessorFn: volunteerName,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{volunteerName(row.original)}</p>
          <p className="mt-0.5 text-[13px] text-zinc-500">{row.original.specialty}</p>
        </div>
      ),
    },
    {
      id: "patients",
      header: "Pacientes",
      accessorFn: (volunteer) => patientsByVolunteer[volunteer.id] ?? 0,
      enableSorting: true,
      meta: { align: "right" },
      cell: ({ row }) => <span className="tabular-nums">{patientsByVolunteer[row.original.id] ?? 0}</span>,
    },
    {
      id: "week",
      header: "Esta semana",
      accessorFn: (volunteer) => weekSlotsByVolunteer[volunteer.id] ?? 0,
      enableSorting: true,
      meta: { align: "right" },
      cell: ({ row }) => {
        const count = weekSlotsByVolunteer[row.original.id] ?? 0
        return <span className="tabular-nums">{count === 1 ? "1 hueco" : `${count} huecos`}</span>
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      enableSorting: true,
      cell: ({ row }) => (row.original.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>),
    },
  ]
}
