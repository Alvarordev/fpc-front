import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellPlus, Check, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { remindersApi, type Reminder } from "@/api/reminders"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"

interface RecordatoriosTabProps {
  pacienteId: string
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  DONE: "Completado",
  DISMISSED: "Descartado",
}

function toLocalDateTime(date: string) {
  const value = new Date(date)
  const timezoneOffset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function RecordatoriosTab({ pacienteId }: RecordatoriosTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder>()
  const [description, setDescription] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [agentId, setAgentId] = useState<string>()
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"
  const remindersQuery = useQuery({ queryKey: ["reminders"], queryFn: remindersApi.list })
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
      closeForm()
      toast.success("Recordatorio creado")
    },
    onError: (error: Error) => toast.error("No se pudo crear el recordatorio", { description: error.message }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof remindersApi.update>[1] }) => remindersApi.update(id, input),
    onSuccess: async () => {
      await invalidate()
      closeForm()
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
    .filter((reminder) => reminder.subjectPatientId === pacienteId)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  function closeForm() {
    setFormOpen(false)
    setEditingReminder(undefined)
    setDescription("")
    setDueAt("")
    setAgentId(undefined)
  }

  function openCreate() {
    closeForm()
    setFormOpen(true)
  }

  function openEdit(reminder: Reminder) {
    setEditingReminder(reminder)
    setDescription(reminder.description)
    setDueAt(toLocalDateTime(reminder.dueAt))
    setAgentId(reminder.assignedAgentId)
    setFormOpen(true)
  }

  function submit() {
    if (!description || !dueAt) return
    const ownAgentId = agentsQuery.data?.find((agent) => agent.userId === user?.id)?.id
    const assignedAgentId = requiresAgentSelection ? agentId : ownAgentId

    if (!assignedAgentId) {
      toast.error("Seleccioná un agente responsable")
      return
    }

    if (editingReminder) {
      updateMutation.mutate({
        id: editingReminder.id,
        input: { description, dueAt: new Date(dueAt).toISOString(), assignedAgentId },
      })
      return
    }

    createMutation.mutate({
      subjectPatientId: pacienteId,
      description,
      dueAt: new Date(dueAt).toISOString(),
      assignedAgentId,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Recordatorios</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{reminders.filter((reminder) => reminder.status === "PENDING").length} pendientes</p>
        </div>
        {canManage && <Button size="sm" className="gap-1.5" onClick={openCreate}><BellPlus className="size-4" />Agregar</Button>}
      </div>

      {formOpen && (
        <Card size="sm">
          <CardContent className="space-y-4">
            <p className="font-medium">{editingReminder ? "Editar recordatorio" : "Nuevo recordatorio"}</p>
            <div className="space-y-2">
              <Label htmlFor="reminder-description">Descripción</Label>
              <Input id="reminder-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-due-at">Fecha y hora</Label>
              <Input id="reminder-due-at" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            </div>
            {requiresAgentSelection && (
              <div className="space-y-2">
                <Label>Agente responsable</Label>
                <Select value={agentId} onValueChange={(value) => setAgentId(value ?? undefined)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar agente" /></SelectTrigger>
                  <SelectContent>
                    {(agentsQuery.data ?? []).map((agent) => <SelectItem key={agent.id} value={agent.id}>{agent.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>{editingReminder ? "Guardar" : "Crear"}</Button>
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {remindersQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Cargando recordatorios...</div>
      ) : reminders.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Sin recordatorios para este paciente.</div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id} size="sm">
              <CardContent className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{reminder.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(reminder.dueAt)}</p>
                </div>
                <Badge variant="outline">{statusLabels[reminder.status]}</Badge>
                {canManage && reminder.status === "PENDING" && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Editar recordatorio" onClick={() => openEdit(reminder)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Completar recordatorio" onClick={() => completeMutation.mutate(reminder.id)}><Check className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Descartar recordatorio" onClick={() => dismissMutation.mutate(reminder.id)}><X className="size-4" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
