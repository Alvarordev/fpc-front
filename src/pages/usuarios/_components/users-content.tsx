import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, ShieldUser } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { useAuthStore } from "@/store/auth-store"
import { VolunteerCommitmentBanner } from "@/components/volunteer-commitment-banner"
import { agentsApi } from "@/api/agents"
import { foundationsApi } from "@/api/foundations"
import type { User } from "@/api/users"
import { useVolunteers } from "@/pages/voluntarios/_hooks/use-volunteers"
import { useUpdateUser, useUsers } from "../_hooks/use-users"
import { userColumns } from "./users-columns"
import { CreateUserDialog } from "./create-user-dialog"
import {
  EditUserDialog,
  type UserProfileMatch,
} from "./edit-user-dialog"

export function UsersContent() {
  const user = useAuthStore((s) => s.user)
  const { data: users = [], isLoading } = useUsers()
  const { data: volunteers = [] } = useVolunteers()
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
    enabled: user?.role === "ADMIN",
  })
  const { data: foundations = [] } = useQuery({
    queryKey: ["foundations"],
    queryFn: foundationsApi.list,
    staleTime: 60_000,
    enabled: user?.role === "ADMIN",
  })

  const updateUser = useUpdateUser()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const profileMatch = useMemo((): UserProfileMatch | null => {
    if (!editingUser) return null
    if (editingUser.role === "ADMIN") {
      return { role: "ADMIN", profile: null }
    }
    if (editingUser.role === "AGENT") {
      const profile = agents.find((a) => a.userId === editingUser.id)
      return profile ? { role: "AGENT", profile } : null
    }
    if (editingUser.role === "FOUNDATION") {
      const profile = foundations.find((f) => f.userId === editingUser.id)
      return profile ? { role: "FOUNDATION", profile } : null
    }
    if (editingUser.role === "VOLUNTEER") {
      const profile = volunteers.find((v) => v.userId === editingUser.id)
      return profile ? { role: "VOLUNTEER", profile } : null
    }
    return null
  }, [editingUser, agents, foundations, volunteers])

  const handleEdit = useCallback((target: User) => {
    if (target.role === "ADMIN") return
    setEditingUser(target)
    setEditOpen(true)
  }, [])

  const handleToggleActive = useCallback(
    async (target: User) => {
      if (target.role === "ADMIN") return
      try {
        await updateUser.mutateAsync({
          id: target.id,
          input: { isActive: !target.isActive },
        })
        toast.success(
          target.isActive
            ? `${target.email} desactivado`
            : `${target.email} reactivado`,
        )
      } catch (err) {
        toast.error(
          target.isActive ? "Error al desactivar" : "Error al reactivar",
          {
            description:
              err instanceof Error ? err.message : "Error inesperado",
          },
        )
      }
    },
    [updateUser],
  )

  const columns = useMemo(
    () =>
      userColumns({
        onEdit: handleEdit,
        onToggleActive: handleToggleActive,
      }),
    [handleEdit, handleToggleActive],
  )

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldUser className="text-muted-foreground/30 mb-4 size-12" />
        <p className="text-muted-foreground text-sm">
          No tenés permisos para ver esta sección.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Usuarios
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {users.length} usuario{users.length !== 1 ? "s" : ""} registrado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      <VolunteerCommitmentBanner volunteers={volunteers} />

      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No hay usuarios registrados"
      />

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog
        user={editingUser}
        profileMatch={profileMatch}
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next)
          if (!next) setEditingUser(null)
        }}
      />
    </div>
  )
}
