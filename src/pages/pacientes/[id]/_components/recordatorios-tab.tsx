import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellPlus, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { remindersApi, type Reminder } from "@/api/reminders"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { ReminderCard } from "./reminder-card"
import { ReminderFormDialog, type ReminderFormValues } from "./reminder-form-dialog"

interface RecordatoriosTabProps {
  pacienteId: string
}

export function RecordatoriosTab({ pacienteId }: RecordatoriosTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"
  const remindersQuery = useQuery({ queryKey: ["reminders", pacienteId], queryFn: () => remindersApi.list({ patientId: pacienteId }) })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: remindersApi.create,
    onSuccess: async () => {
      await invalidate()
      setDialogOpen(false)
      toast.success("Recordatorio creado")
    },
    onError: (error: Error) => toast.error("No se pudo crear el recordatorio", { description: error.message }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof remindersApi.update>[1] }) => remindersApi.update(id, input),
    onSuccess: async () => {
      await invalidate()
      setDialogOpen(false)
      toast.success("Recordatorio actualizado")
    },
    onError: (error: Error) => toast.error("No se pudo actualizar el recordatorio", { description: error.message }),
  })
  const completeMutation = useMutation({
    mutationFn: remindersApi.complete,
    onSuccess: async () => {
      await invalidate()
      toast.success("Recordatorio completado")
    },
    onError: (error: Error) => toast.error("No se pudo completar el recordatorio", { description: error.message }),
  })
  const dismissMutation = useMutation({
    mutationFn: remindersApi.dismiss,
    onSuccess: async () => {
      await invalidate()
      toast.success("Recordatorio descartado")
    },
    onError: (error: Error) => toast.error("No se pudo descartar el recordatorio", { description: error.message }),
  })

  const reminders = (remindersQuery.data ?? [])
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const pendientes = reminders.filter((reminder) => reminder.status === "PENDING")
  const completados = reminders.filter((reminder) => reminder.status !== "PENDING")

  function openCreate() {
    setEditingReminder(null)
    setDialogOpen(true)
  }

  function openEdit(reminder: Reminder) {
    setEditingReminder(reminder)
    setDialogOpen(true)
  }

  function handleSave(values: ReminderFormValues) {
    const ownAgentId = agentsQuery.data?.find((agent) => agent.userId === user?.id)?.id
    const assignedAgentId = requiresAgentSelection ? values.assignedAgentId : ownAgentId

    if (!assignedAgentId) {
      toast.error("Seleccioná un agente responsable")
      return
    }

    if (editingReminder) {
      updateMutation.mutate({
        id: editingReminder.id,
        input: { description: values.description, dueAt: new Date(values.dueAt).toISOString(), assignedAgentId },
      })
      return
    }

    createMutation.mutate({
      subjectPatientId: pacienteId,
      description: values.description,
      dueAt: new Date(values.dueAt).toISOString(),
      assignedAgentId,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recordatorios</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            {completados.length > 0 && ` · ${completados.length} completado${completados.length !== 1 ? "s" : ""}`}
          </p>
          {reminders.length > 0 && (
            <p className="mt-0.5 text-[10px] text-muted-foreground/50">
              Los recordatorios se ordenan por fecha programada
            </p>
          )}
        </div>
        {canManage && <Button size="sm" className="gap-1.5" onClick={openCreate}><BellPlus className="size-4" />Agregar</Button>}
      </div>

      {remindersQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Cargando recordatorios...</div>
      ) : reminders.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <ClipboardList className="size-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Sin recordatorios</p>
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Registrá citas, procedimientos o medicaciones para hacer seguimiento.
          </p>
          {canManage && (
            <Button type="button" variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreate}>
              <BellPlus className="size-3.5" />Crear recordatorio
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendientes.length > 0 && (
            <div className="space-y-2">
              {pendientes.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  canManage={canManage}
                  onEdit={openEdit}
                  onComplete={(r) => completeMutation.mutate(r.id)}
                  onDismiss={(r) => dismissMutation.mutate(r.id)}
                />
              ))}
            </div>
          )}

          {completados.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer select-none py-1 text-xs font-semibold text-muted-foreground/80 hover:text-muted-foreground">
                Completados / Descartados ({completados.length})
              </summary>
              <div className="mt-2 space-y-2">
                {completados.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    canManage={false}
                    onEdit={() => {}}
                    onComplete={() => {}}
                    onDismiss={() => {}}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <ReminderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reminder={editingReminder}
        agents={agentsQuery.data ?? []}
        requiresAgentSelection={requiresAgentSelection}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSave={handleSave}
      />
    </div>
  )
}
