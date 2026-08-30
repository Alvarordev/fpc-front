import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { Building2 } from "lucide-react"
import { usersApi, type User } from "@/api/users"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function SepaTeamTab() {
  const teamQuery = useQuery({
    queryKey: ["users", "foundation-team"],
    queryFn: async () => {
      const page = await usersApi.list({ role: "FOUNDATION", limit: 100 })
      return page.data
    },
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

  const columns: ColumnDef<User>[] = [
    {
      id: "profile",
      header: "Perfil FPC",
      cell: () => (
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            FPC
          </span>
          <span className="text-muted-foreground text-sm italic">
            Sin datos de perfil
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Correo electrónico",
      cell: ({ getValue }) => (
        <span className="text-foreground text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Fecha de registro",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = getValue() as boolean
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {active ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
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
