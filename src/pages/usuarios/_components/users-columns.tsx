import type { ColumnDef } from "@tanstack/react-table"
import { KeyRound, Pencil, Power, PowerOff } from "lucide-react"
import type { User } from "@/api/users"
import { Chip } from "@/components/ds/badge"
import { RowMenu } from "@/components/ds/row-menu"
import { userRoleLabels } from "@/lib/user-questions"

const roleTone: Record<User["role"], "amber" | "blue" | "green" | "violet"> = {
  ADMIN: "amber",
  AGENT: "blue",
  VOLUNTEER: "green",
  FOUNDATION: "violet",
}

export function userColumns({
  names,
  onEdit,
  onResetPassword,
  onToggleActive,
}: {
  names: Record<string, string>
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onToggleActive: (user: User) => void
}): ColumnDef<User, unknown>[] {
  return [
    {
      id: "user",
      header: "Usuario",
      accessorFn: (user) => names[user.id] || user.email,
      enableSorting: true,
      cell: ({ row }) => {
        const name = names[row.original.id]
        return (
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">{name || row.original.email}</p>
            {name && <p className="mt-0.5 truncate text-[13px] text-zinc-500">{row.original.email}</p>}
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      enableSorting: true,
      cell: ({ row }) => <Chip tone={roleTone[row.original.role]}>{userRoleLabels[row.original.role]}</Chip>,
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.isActive ? <Chip tone="green">Activo</Chip> : <Chip tone="gray">Inactivo</Chip>,
    },
    {
      accessorKey: "createdAt",
      header: "Alta",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-zinc-600">
          {new Date(row.original.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original
        if (user.role === "ADMIN") return null
        return (
          <div className="flex justify-end">
            <RowMenu
              label={`Acciones de ${names[user.id] || user.email}`}
              items={[
                { label: "Editar", icon: Pencil, onSelect: () => onEdit(user) },
                { label: "Restablecer contraseña", icon: KeyRound, onSelect: () => onResetPassword(user) },
                user.isActive
                  ? { label: "Desactivar", icon: PowerOff, destructive: true, onSelect: () => onToggleActive(user) }
                  : { label: "Reactivar", icon: Power, onSelect: () => onToggleActive(user) },
              ]}
            />
          </div>
        )
      },
    },
  ]
}
