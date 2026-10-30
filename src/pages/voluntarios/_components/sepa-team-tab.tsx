import { useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { foundationsApi, type Foundation } from "@/api/foundations"
import { Chip } from "@/components/ds/badge"
import { CopyValue } from "@/components/ds/copy-value"
import { DataTable } from "@/components/ds/data-table"

function fullName(member: Foundation) {
  return `${member.firstName} ${member.lastName}`.trim()
}

const columns: ColumnDef<Foundation, unknown>[] = [
  {
    id: "name",
    header: "Nombre",
    accessorFn: fullName,
    enableSorting: true,
    cell: ({ row }) => <p className="font-medium text-zinc-900">{fullName(row.original)}</p>,
  },
  {
    accessorKey: "email",
    header: "Correo",
    cell: ({ row }) => <CopyValue value={row.original.email} label="Correo" className="text-[13px] text-zinc-600" />,
  },
  {
    accessorKey: "phone",
    header: "Celular",
    cell: ({ row }) =>
      row.original.phone ? (
        <CopyValue value={row.original.phone} label="Celular" className="text-[13px] text-zinc-600" />
      ) : (
        <span className="text-[13px] text-zinc-500">Sin teléfono</span>
      ),
  },
  {
    accessorKey: "isActive",
    header: "Estado",
    cell: ({ row }) => (row.original.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>),
  },
]

export function SepaTeamTab() {
  const teamQuery = useQuery({
    queryKey: ["foundations"],
    queryFn: foundationsApi.list,
    staleTime: 60_000,
  })

  return (
    <DataTable
      data={teamQuery.data ?? []}
      columns={columns}
      isLoading={teamQuery.isLoading}
      emptyTitle="Todavía no hay equipo SEPA"
      emptyBody="Los perfiles de fundación aparecen aquí."
    />
  )
}
