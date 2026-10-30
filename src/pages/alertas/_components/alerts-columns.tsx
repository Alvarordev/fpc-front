import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import type { Alert } from "@/api/alerts"
import { Chip } from "@/components/ds/badge"
import { CopyValue } from "@/components/ds/copy-value"
import { alertSeverityChip, alertStatusChip, relativeAge } from "../_lib/alert-copy"

export function alertColumns(): ColumnDef<Alert, unknown>[] {
  return [
    {
      accessorKey: "title",
      header: "Incidencia",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-zinc-900">{row.original.title}</p>
          {row.original.ticketNumber && (
            <CopyValue value={row.original.ticketNumber} label="Ticket" className="mt-0.5 text-[13px] text-zinc-500" />
          )}
        </div>
      ),
    },
    {
      id: "patient",
      header: "Paciente",
      accessorFn: (row) => row.patientFullName,
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          to={`/pacientes/${row.original.patientId}`}
          className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2"
        >
          {row.original.patientFullName}
        </Link>
      ),
    },
    {
      accessorKey: "healthCenterName",
      header: "Establecimiento",
      enableSorting: true,
      cell: ({ row }) => <span className="text-zinc-800">{row.original.healthCenterName}</span>,
    },
    {
      id: "category",
      header: "Categoría",
      accessorFn: (row) => row.categoryLabel ?? row.category,
      enableSorting: true,
      cell: ({ row }) => <span className="text-zinc-800">{row.original.categoryLabel ?? "Sin categoría"}</span>,
    },
    {
      accessorKey: "severity",
      header: "Severidad",
      enableSorting: true,
      cell: ({ row }) => {
        const chip = alertSeverityChip[row.original.severity]
        return <Chip tone={chip.tone}>{chip.label}</Chip>
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      enableSorting: true,
      cell: ({ row }) => {
        const chip = alertStatusChip[row.original.status]
        return <Chip tone={chip.tone}>{chip.label}</Chip>
      },
    },
    {
      accessorKey: "createdAt",
      header: "Antigüedad",
      enableSorting: true,
      cell: ({ row }) => <span className="text-zinc-600">{relativeAge(row.original.createdAt)}</span>,
    },
  ]
}
