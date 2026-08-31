import { useMemo } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import type { FamilyTalkInterest } from "@/api/family-talk-interests"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "—"
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function useFamilyTalkInterestColumns(): ColumnDef<FamilyTalkInterest>[] {
  return useMemo(
    () => [
      {
        accessorKey: "familyMemberName",
        header: "Familiar",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.familyMemberName}
          </span>
        ),
      },
      {
        accessorKey: "familyMemberPhone",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.familyMemberPhone ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "familyMemberEmail",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.familyMemberEmail ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "talkName",
        header: "Charla",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.talkName}</span>
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
