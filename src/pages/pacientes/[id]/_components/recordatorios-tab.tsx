import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellPlus, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import {
  remindersApi,
  type CompleteReminderInput,
  type Reminder,
} from "@/api/reminders"
import { resolveSpecialty } from "@/components/medical-appointment-fields"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { CompleteMedicalReminderDialog } from "./complete-medical-reminder-dialog"
import { ReminderCard } from "./reminder-card"
import {
  ReminderFormDialog,
  type ReminderFormValues,
} from "./reminder-form-dialog"

interface RecordatoriosTabProps {
  pacienteId: string
}

export function RecordatoriosTab({ pacienteId }: RecordatoriosTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [completingReminder, setCompletingReminder] = useState<Reminder | null>(
    null,
  )
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const requiresAgentSelection =
    user?.role === "ADMIN" || user?.role === "FOUNDATION"
  const remindersQuery = useQuery({
    queryKey: ["reminders", pacienteId],
    queryFn: () => remindersApi.list({ patientId: pacienteId }),
  })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["patient", pacienteId] }),
      queryClient.invalidateQueries({
        queryKey: ["patient-timeline", pacienteId],
      }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: remindersApi.create,
    onSuccess: async () => {
      await invalidate()
      setDialogOpen(false)
      toast.success("Recordatorio creado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo crear el recordatorio", {
        description: error.message,
      }),
  })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof remindersApi.update>[1]
    }) => remindersApi.update(id, input),
    onSuccess: async () => {
      await invalidate()
      setDialogOpen(false)
      toast.success("Recordatorio actualizado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar el recordatorio", {
        description: error.message,
      }),
  })
  const completeMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input?: CompleteReminderInput
    }) => remindersApi.complete(id, input),
    onSuccess: async () => {
      await invalidate()
      setCompletingReminder(null)
      toast.success("Recordatorio completado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo completar el recordatorio", {
        description: error.message,
      }),
  })
  const dismissMutation = useMutation({
    mutationFn: remindersApi.dismiss,
    onSuccess: async () => {
      await invalidate()
      toast.success("Recordatorio descartado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo descartar el recordatorio", {
        description: error.message,
      }),
  })

  const reminders = (remindersQuery.data ?? []).sort((a, b) =>
    a.dueAt.localeCompare(b.dueAt),
  )
  const pendientes = reminders.filter(
    (reminder) => reminder.status === "PENDING",
  )
  const completados = reminders.filter(
    (reminder) => reminder.status !== "PENDING",
  )

  function openCreate() {
    setEditingReminder(null)
    setDialogOpen(true)
  }

  function openEdit(reminder: Reminder) {
    setEditingReminder(reminder)
    setDialogOpen(true)
  }

  function handleComplete(reminder: Reminder) {
    if (reminder.kind === "MEDICAL_APPOINTMENT") {
      setCompletingReminder(reminder)
      return
    }
    completeMutation.mutate({ id: reminder.id })
  }

  function handleSave(values: ReminderFormValues) {
    const ownAgentId = agentsQuery.data?.find(
      (agent) => agent.userId === user?.id,
    )?.id
    const assignedAgentId = requiresAgentSelection
      ? values.assignedAgentId
      : ownAgentId

    if (!assignedAgentId) {
      toast.error("Seleccioná un agente responsable")
      return
    }

    const specialty = resolveSpecialty(values.medicalAppointment)
    const dueAt = new Date(values.dueAt).toISOString()

    if (editingReminder) {
      updateMutation.mutate({
        id: editingReminder.id,
        input: {
          description:
            values.kind === "MEDICAL_APPOINTMENT"
              ? values.description.trim() || `Cita: ${specialty}`
              : values.description,
          dueAt,
          assignedAgentId,
          healthCenterId:
            values.kind === "MEDICAL_APPOINTMENT"
              ? values.medicalAppointment.healthCenterId || undefined
              : undefined,
        },
      })
      return
    }

    if (values.kind === "MEDICAL_APPOINTMENT") {
      createMutation.mutate({
        subjectPatientId: pacienteId,
        description: values.description.trim() || `Cita: ${specialty}`,
        dueAt,
        assignedAgentId,
        kind: "MEDICAL_APPOINTMENT",
        medicalAppointment: {
          specialty,
          healthCenterId:
            values.medicalAppointment.healthCenterId || undefined,
          isFirstConsultation: values.medicalAppointment.isFirstConsultation,
        },
      })
      return
    }

    createMutation.mutate({
      subjectPatientId: pacienteId,
      description: values.description,
      dueAt,
      assignedAgentId,
      kind: "GENERIC",
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground text-sm font-semibold">
            Recordatorios
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            {completados.length > 0 &&
              ` · ${completados.length} completado${completados.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <BellPlus className="size-4" />
            Agregar
          </Button>
        )}
      </div>

      {remindersQuery.isLoading ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          Cargando recordatorios...
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <ClipboardList className="text-muted-foreground/30 size-10" />
          <p className="text-foreground text-sm font-medium">
            Sin recordatorios
          </p>
          <p className="text-muted-foreground max-w-xs text-center text-xs">
            Registrá citas médicas, procedimientos o medicaciones.
          </p>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={openCreate}
            >
              <BellPlus className="size-3.5" />
              Crear recordatorio
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
                  onComplete={handleComplete}
                  onDismiss={(r) => dismissMutation.mutate(r.id)}
                />
              ))}
            </div>
          )}

          {completados.length > 0 && (
            <details className="group">
              <summary className="text-muted-foreground/80 hover:text-muted-foreground cursor-pointer py-1 text-xs font-semibold select-none">
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

      <CompleteMedicalReminderDialog
        open={Boolean(completingReminder)}
        onOpenChange={(open) => {
          if (!open) setCompletingReminder(null)
        }}
        reminder={completingReminder}
        isPending={completeMutation.isPending}
        onConfirm={(input) => {
          if (!completingReminder) return
          completeMutation.mutate({
            id: completingReminder.id,
            input,
          })
        }}
      />
    </div>
  )
}
