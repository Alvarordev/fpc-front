import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { User } from "@/api/users"

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
  FOUNDATION: "Fundación",
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
  AGENT: "bg-blue-50 text-blue-700 border-blue-200",
  VOLUNTEER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FOUNDATION: "bg-violet-50 text-violet-700 border-violet-200",
}

function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface UserColumnsOptions {
  onEdit: (user: User) => void
  onToggleActive: (user: User) => void
}

export function userColumns({
  onEdit,
  onToggleActive,
}: UserColumnsOptions): ColumnDef<User>[] {
  return [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const u = row.original
        const initials = u.email
          .split("@")[0]
          .split(/[._-]/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-foreground text-sm font-medium">{u.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ getValue }) => {
        const role = getValue() as string
        return (
          <Badge className={cn("border font-medium", roleStyles[role] ?? "")}>
            {roleLabels[role] ?? role}
          </Badge>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = getValue() as boolean
        return (
          <Badge
            className={cn(
              "border font-medium",
              active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border-zinc-200",
            )}
          >
            {active ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registrado",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {shortDate(getValue() as string)}
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(user)}>
                  {user.isActive ? (
                    <>
                      <PowerOff className="size-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Power className="size-4" />
                      Reactivar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
