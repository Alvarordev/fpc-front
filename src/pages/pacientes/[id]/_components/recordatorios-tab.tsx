import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import {
  remindersApi,
  type CompleteReminderInput,
  type Reminder,
} from "@/api/reminders"
import {
  resolveSpecialty,
  resolveSpecialtyLabel,
} from "@/components/medical-appointment-fields"
import { useCatalog } from "@/hooks/use-catalog"
import { reminderScheduleInput } from "@/lib/reminder-labels"
import { AddButton } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
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
  const { data: specialtyItems = [] } = useCatalog("medical_specialty")

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
    (a.dueOn ?? a.dueAt ?? "").localeCompare(b.dueOn ?? b.dueAt ?? ""),
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
      toast.error("Selecciona un agente responsable")
      return
    }

    const specialty = resolveSpecialty(values.medicalAppointment)
    const specialtyLabel =
      values.kind === "MEDICAL_APPOINTMENT"
        ? resolveSpecialtyLabel(specialtyItems, values.medicalAppointment)
        : ""
    const dueAt = new Date(values.dueAt).toISOString()
    const schedule = reminderScheduleInput(values)

    if (editingReminder) {
      updateMutation.mutate({
        id: editingReminder.id,
        input: {
          description:
            values.kind === "MEDICAL_APPOINTMENT"
              ? values.description.trim() || `Cita: ${specialtyLabel}`
              : values.description,
          dueAt,
          assignedAgentId,
          healthCenterId:
            values.kind === "MEDICAL_APPOINTMENT"
              ? values.medicalAppointment.healthCenterId || undefined
              : undefined,
          ...schedule,
        },
      })
      return
    }

    if (values.kind === "MEDICAL_APPOINTMENT") {
      createMutation.mutate({
        subjectPatientId: pacienteId,
        description: values.description.trim() || `Cita: ${specialtyLabel}`,
        dueAt,
        assignedAgentId,
        kind: "MEDICAL_APPOINTMENT",
        ...schedule,
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
      channel: values.channel,
    })
  }

  return (
    <div className="space-y-4">
      <Card
        title="Próximos"
        description={pendientes.length ? `${pendientes.length} por cumplir. El aviso sale según la anticipación elegida.` : undefined}
        action={canManage ? <AddButton onClick={openCreate}>Crear recordatorio</AddButton> : undefined}
      >
        {remindersQuery.isLoading ? (
          <div className="grid gap-2 lg:grid-cols-2">
            <Skeleton className="h-28 rounded-[14px] bg-zinc-100" />
            <Skeleton className="h-28 rounded-[14px] bg-zinc-100" />
          </div>
        ) : pendientes.length === 0 ? (
          <EmptyState title="Sin recordatorios pendientes" body="Registra citas médicas, procedimientos o medicaciones para avisarle a tiempo." action={canManage ? "Crear recordatorio" : undefined} onAction={openCreate} />
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {pendientes.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} canManage={canManage} onEdit={openEdit} onComplete={handleComplete} onDismiss={(r) => dismissMutation.mutate(r.id)} />
            ))}
          </div>
        )}
      </Card>
      {completados.length > 0 && (
        <Card title="Anteriores" description={`${completados.length} completados o descartados`}>
          <div className="space-y-2">
            {[...completados].reverse().map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} canManage={false} onEdit={() => {}} onComplete={() => {}} onDismiss={() => {}} />
            ))}
          </div>
        </Card>
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
