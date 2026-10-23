import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Building2 } from "lucide-react"
import { foundationsApi, type Foundation } from "@/api/foundations"
import { DataTable } from "@/components/data-table"

function fullName(member: Foundation) {
  return `${member.firstName} ${member.lastName}`.trim()
}

export function SepaTeamTab() {
  const teamQuery = useQuery({
    queryKey: ["foundations"],
    queryFn: foundationsApi.list,
    staleTime: 60_000,
  })

  const members = teamQuery.data ?? []

  if (teamQuery.isError) {
    return (
      <div className="text-destructive flex h-40 items-center justify-center text-sm">
        No se pudo cargar el equipo SEPA.
      </div>
    )
  }

  const columns: ColumnDef<Foundation>[] = [
    {
      id: "name",
      header: "Nombre",
      accessorFn: (member) => fullName(member),
      cell: ({ row }) => {
        const member = row.original
        const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`
          .toUpperCase()
          .trim()

        return (
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {initials || "FPC"}
            </span>
            <span className="text-foreground text-sm font-medium">
              {fullName(member)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Correo electrónico",
      cell: ({ getValue }) => (
        <span className="text-foreground text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Celular",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue() as string}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Building2 className="size-4" />
        <span>Perfiles de tipo Fundación</span>
      </div>
      <DataTable
        data={members}
        columns={columns}
        isLoading={teamQuery.isLoading}
        emptyMessage="Sin perfiles FPC registrados"
      />
    </div>
  )
}
