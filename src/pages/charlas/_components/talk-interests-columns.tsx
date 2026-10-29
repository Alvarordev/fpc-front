import { useMemo } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import type { TalkInterest } from "@/api/talk-interests"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "—"
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function useTalkInterestColumns(): ColumnDef<TalkInterest>[] {
  return useMemo(
    () => [
      {
        accessorKey: "companionFullName",
        header: "Acompañante",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.companionFullName}
          </span>
        ),
      },
      {
        accessorKey: "companionPhone",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.companionPhone ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "companionEmail",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.companionEmail ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "talkLabel",
        header: "Charla",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.talkLabel}</span>
        ),
      },
      {
        accessorKey: "patientFullName",
        header: "Paciente",
        cell: ({ row }) => (
          <Link
            to={`/pacientes/${row.original.patientId}`}
            className="text-primary text-sm font-medium hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.patientFullName}
          </Link>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  )
}
