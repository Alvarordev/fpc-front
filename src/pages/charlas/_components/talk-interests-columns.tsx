import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import type { TalkInterest } from "@/api/talk-interests"
import { CopyValue } from "@/components/ds/copy-value"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "Sin fecha"
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
}

export function talkInterestColumns(): ColumnDef<TalkInterest, unknown>[] {
  return [
    {
      accessorKey: "companionFullName",
      header: "Persona",
      enableSorting: true,
      cell: ({ row }) => {
        const phone = row.original.companionPhone
        const email = row.original.companionEmail
        return (
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">{row.original.companionFullName}</p>
            {phone ? (
              <CopyValue value={phone} label="Teléfono" className="mt-0.5 text-[13px] text-zinc-500" />
            ) : (
              <p className="mt-0.5 text-[13px] text-zinc-500">Sin teléfono</p>
            )}
            {email && <p className="mt-0.5 truncate text-[13px] text-zinc-500">{email}</p>}
          </div>
        )
      },
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
      accessorKey: "talkLabel",
      header: "Charla",
      enableSorting: true,
      cell: ({ row }) => <span className="text-zinc-800">{row.original.talkLabel}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Registro",
      enableSorting: true,
      cell: ({ row }) => <span className="text-zinc-600">{formatDate(row.original.createdAt)}</span>,
    },
  ]
}
