import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { foundationsApi } from "@/api/foundations"
import type { User } from "@/api/users"
import { AddButton, Button } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { Modal } from "@/components/ds/modal"
import { VolunteerCommitmentBanner } from "@/components/volunteer-commitment-banner"
import { useVolunteers } from "@/pages/voluntarios/_hooks/use-volunteers"
import { useAuthStore } from "@/store/auth-store"
import { matchesUser, readUserFilters } from "../_lib/user-filters"
import { useUpdateUser, useUsers } from "../_hooks/use-users"
import { ResetPasswordModal } from "./reset-password-modal"
import { UserFormModal } from "./user-form-modal"
import type { UserProfileMatch } from "./user-profile"
import { userColumns } from "./users-columns"
import { UsersFilters } from "./users-filters"

export function UsersContent() {
  const current = useAuthStore((state) => state.user)
  const [params] = useSearchParams()
  const filters = readUserFilters(params)
  const { data: users = [], isLoading } = useUsers()
  const { data: volunteers = [] } = useVolunteers()
  const { data: agents = [] } = useQuery({ queryKey: ["agents"], queryFn: agentsApi.list, staleTime: 60_000, enabled: current?.role === "ADMIN" })
  const { data: foundations = [] } = useQuery({ queryKey: ["foundations"], queryFn: foundationsApi.list, staleTime: 60_000, enabled: current?.role === "ADMIN" })
  const updateUser = useUpdateUser()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
  const [confirm, setConfirm] = useState<User | null>(null)

  const names = useMemo(() => {
    const map: Record<string, string> = {}
    for (const agent of agents) map[agent.userId] = agent.fullName
    for (const volunteer of volunteers) map[volunteer.userId] = `${volunteer.firstName} ${volunteer.lastName}`.trim()
    for (const foundation of foundations) map[foundation.userId] = `${foundation.firstName} ${foundation.lastName}`.trim()
    return map
  }, [agents, volunteers, foundations])

  const visible = useMemo(
    () => users.filter((user) => matchesUser(user, names[user.id] ?? "", filters)),
    [users, names, filters],
  )

  const profileMatch = useMemo((): UserProfileMatch | null => {
    if (!editing) return null
    if (editing.role === "AGENT") {
      const profile = agents.find((agent) => agent.userId === editing.id)
      return profile ? { role: "AGENT", profile } : null
    }
    if (editing.role === "FOUNDATION") {
      const profile = foundations.find((item) => item.userId === editing.id)
      return profile ? { role: "FOUNDATION", profile } : null
    }
    if (editing.role === "VOLUNTEER") {
      const profile = volunteers.find((item) => item.userId === editing.id)
      return profile ? { role: "VOLUNTEER", profile } : null
    }
    return { role: "ADMIN", profile: null }
  }, [editing, agents, foundations, volunteers])

  const columns = useMemo(
    () =>
      userColumns({
        names,
        onEdit: (user) => setEditing(user),
        onResetPassword: (user) => setResetting(user),
        onToggleActive: (user) => setConfirm(user),
      }),
    [names],
  )

  async function runToggle() {
    if (!confirm) return
    try {
      await updateUser.mutateAsync({ id: confirm.id, input: { isActive: !confirm.isActive } })
      toast.success(confirm.isActive ? "Usuario desactivado" : "Usuario reactivado", { description: confirm.email })
      setConfirm(null)
    } catch (error) {
      toast.error(confirm.isActive ? "No se pudo desactivar" : "No se pudo reactivar", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  if (current?.role !== "ADMIN") {
    return (
      <div className="font-ds flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-zinc-600">No tienes permisos para ver esta sección.</p>
      </div>
    )
  }

  const pending = updateUser.isPending
  const empty = users.length === 0

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Usuarios</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {visible.length === users.length ? `${visible.length} usuarios` : `${visible.length} de ${users.length}`}
          </p>
        </div>
        <AddButton onClick={() => setCreating(true)}>Nuevo usuario</AddButton>
      </header>

      <VolunteerCommitmentBanner volunteers={volunteers} />
      <UsersFilters users={users} names={names} />

      <DataTable
        data={visible}
        columns={columns}
        isLoading={isLoading}
        emptyTitle={empty ? "Todavía no hay usuarios" : "Ningún usuario coincide"}
        emptyBody={empty ? "Crea el primero para dar acceso al equipo." : "Prueba con otro nombre, rol o estado."}
        emptyAction={empty ? "Nuevo usuario" : undefined}
        onEmptyAction={empty ? () => setCreating(true) : undefined}
      />

      <UserFormModal open={creating} onClose={() => setCreating(false)} />
      <UserFormModal open={Boolean(editing)} user={editing} profileMatch={profileMatch} onClose={() => setEditing(null)} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />

      {confirm && (
        <Modal
          open
          onClose={() => !pending && setConfirm(null)}
          title={confirm.isActive ? "Desactivar usuario" : "Reactivar usuario"}
          description={confirm.email}
          footer={
            <>
              <Button onClick={() => setConfirm(null)} disabled={pending}>
                Volver
              </Button>
              <Button variant="dark" disabled={pending} onClick={() => void runToggle()}>
                {pending ? "Guardando…" : confirm.isActive ? "Desactivar" : "Reactivar"}
              </Button>
            </>
          }
        >
          <p className="text-sm text-zinc-700">
            {confirm.isActive
              ? "Deja de poder entrar. Los registros que ya hizo se conservan."
              : "Vuelve a poder entrar con el mismo correo."}
          </p>
        </Modal>
      )}
    </div>
  )
}
