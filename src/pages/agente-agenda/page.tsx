import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { patientsApi } from "@/api/patients"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import {
  remindersApi,
  type CompleteReminderInput,
  type Reminder,
} from "@/api/reminders"
import { volunteersApi } from "@/api/volunteers"
import { Button } from "@/components/ds/button"
import { EmptyState } from "@/components/ds/empty-state"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { useAuthStore } from "@/store/auth-store"
import { resolveSpecialtyLabel } from "@/components/medical-appointment-fields"
import { useCatalog } from "@/hooks/use-catalog"
import { reminderScheduleInput } from "@/lib/reminder-labels"
import { CompleteMedicalReminderDialog } from "@/pages/pacientes/[id]/_components/complete-medical-reminder-dialog"
import {
  ReminderFormDialog,
  type ReminderFormValues,
} from "@/pages/pacientes/[id]/_components/reminder-form-dialog"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"
import { NeedsReassignmentPanel } from "@/pages/voluntarios/_components/needs-reassignment-panel"
import { AgentSurveysPanel } from "./_components/agent-surveys-panel"
import { AgentAgendaCalendar } from "./_components/agent-agenda-calendar"
import { AgendaSummary } from "./_components/agenda-summary"
import { FollowUpDetailDialog } from "./_components/follow-up-detail-dialog"
import { FollowUpEditDialog } from "./_components/follow-up-edit-dialog"
import { ReminderDetailDialog } from "./_components/reminder-detail-dialog"
import {
  buildAgendaEvents,
  isOverdue,
  isToday,
  type AgendaPatientInfo,
  type AgendaEvent,
} from "./_lib/agenda"

type ViewMode = "calendar" | "summary"

export default function AgentAgendaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(
    null,
  )
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null,
  )
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [completingReminder, setCompletingReminder] = useState<Reminder | null>(
    null,
  )

  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    staleTime: 60_000,
  })
  const { data: specialtyItems = [] } = useCatalog("medical_specialty")
  const agent = agentsQuery.data?.find((item) => item.userId === user?.id)
  const agentId = agent?.id

  const followUpsQuery = useQuery({
    queryKey: ["agent-follow-ups", agentId],
    queryFn: async () => {
      const [scheduled, overdue] = await Promise.all([
        followUpsApi.list({ agentId, status: "SCHEDULED" }),
        followUpsApi.list({ agentId, status: "OVERDUE" }),
      ])
      return [...scheduled, ...overdue]
    },
    enabled: Boolean(agentId),
    staleTime: 30_000,
  })
  const remindersQuery = useQuery({
    queryKey: ["agent-reminders", agentId],
    queryFn: () => remindersApi.list(),
    enabled: Boolean(agentId),
    staleTime: 30_000,
  })
  const sessionsQuery = useQuery({
    queryKey: ["agent-upcoming-sessions"],
    queryFn: () => psychooncologyAppointmentsApi.list({ status: "SCHEDULED" }),
    staleTime: 30_000,
  })
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    staleTime: 300_000,
  })
  const patientsQuery = useQuery({
    queryKey: ["agenda-patients"],
    queryFn: () => patientsApi.list({ segment: "CARE", limit: 100 }),
    staleTime: 60_000,
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({
      id,
      scheduledAt,
      status,
    }: {
      id: string
      scheduledAt: string
      status: FollowUp["status"]
    }) =>
      status === "OVERDUE" || status === "CANCELLED"
        ? followUpsApi.reschedule(id, { scheduledAt })
        : followUpsApi.update(id, { scheduledAt }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["agent-follow-ups", agentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["follow-up", variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups"] }),
      ])
      setEditingFollowUp(null)
      toast.success("Seguimiento reagendado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo reagendar el seguimiento", {
        description: error.message,
      }),
  })

  const cancelFollowUpMutation = useMutation({
    mutationFn: (followUp: FollowUp) =>
      followUpsApi.update(followUp.id, { status: "CANCELLED" }),
    onSuccess: async (_data, followUp) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["agent-follow-ups", agentId],
        }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups"] }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
      ])
      setSelectedFollowUp(null)
      toast.success("Seguimiento cancelado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo cancelar el seguimiento", {
        description: error.message,
      }),
  })

  async function invalidateReminderQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["agent-reminders", agentId],
      }),
      queryClient.invalidateQueries({ queryKey: ["reminders"] }),
      queryClient.invalidateQueries({ queryKey: ["medical-appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
      queryClient.invalidateQueries({ queryKey: ["patient"] }),
    ])
  }

  const reminderUpdateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof remindersApi.update>[1]
    }) => remindersApi.update(id, input),
    onSuccess: async () => {
      await invalidateReminderQueries()
      setEditingReminder(null)
      toast.success("Recordatorio actualizado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar el recordatorio", {
        description: error.message,
      }),
  })

  const reminderCompleteMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input?: CompleteReminderInput
    }) => remindersApi.complete(id, input),
    onSuccess: async () => {
      await invalidateReminderQueries()
      setCompletingReminder(null)
      setSelectedReminder(null)
      toast.success("Recordatorio completado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo completar el recordatorio", {
        description: error.message,
      }),
  })

  const followUps = followUpsQuery.data ?? []
  const reminders = (remindersQuery.data ?? []).filter(
    (reminder) =>
      reminder.status === "PENDING" && reminder.assignedAgentId === agentId,
  )
  const patientInfo = new Map<string, AgendaPatientInfo>(
    (patientsQuery.data?.data ?? []).map((patient) => [
      patient.id,
      {
        name: patient.fullName,
        healthSubcategory: patient.healthSubcategory,
      },
    ]),
  )
  const events = buildAgendaEvents(followUps, reminders, patientInfo)
  const followUpEvents = events.filter(
    (event): event is Extract<AgendaEvent, { kind: "follow-up" }> =>
      event.kind === "follow-up",
  )
  const reminderEvents = events.filter(
    (event): event is Extract<AgendaEvent, { kind: "reminder" }> =>
      event.kind === "reminder",
  )
  const sessions = (sessionsQuery.data ?? [])
    .filter((session) => session.scheduledAt !== null)
    .slice()
    .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))
  const volunteers = new Map(
    (volunteersQuery.data ?? []).map((volunteer) => [volunteer.id, volunteer]),
  )
  const todayCount = events.filter((event) => isToday(event.startsAt)).length
  const overdueCount = events.filter((event) =>
    isOverdue(event.startsAt),
  ).length

  if (
    agentsQuery.isLoading ||
    (Boolean(agentId) && (followUpsQuery.isLoading || remindersQuery.isLoading))
  ) {
    return (
      <div className="font-ds flex h-64 items-center justify-center gap-2 text-[13px] text-zinc-500">
        <Loader2 className="size-4 animate-spin" />
        Cargando tu agenda…
      </div>
    )
  }

  if (
    agentsQuery.isError ||
    !agentId ||
    followUpsQuery.isError ||
    remindersQuery.isError
  ) {
    const message = agentsQuery.isError
      ? "Revisa la conexión con el servidor e intenta de nuevo."
      : !agentId
        ? "Tu usuario todavía no tiene un perfil de agente asociado. Pide a un administrador que lo vincule."
        : "No se pudieron cargar tus seguimientos o recordatorios. Intenta de nuevo."
    return (
      <div className="font-ds space-y-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mi agenda</h1>
        <EmptyState title="No se pudo cargar tu agenda" body={message} />
        {agentId || agentsQuery.isError ? (
          <Button
            icon={RefreshCw}
            onClick={() => {
              void agentsQuery.refetch()
              void followUpsQuery.refetch()
              void remindersQuery.refetch()
            }}
          >
            Reintentar
          </Button>
        ) : null}
      </div>
    )
  }

  function openEvent(event: AgendaEvent) {
    if (event.kind === "follow-up") setSelectedFollowUp(event.followUp)
    else setSelectedReminder(event.reminder)
  }

  function goToFollowUp(followUp: FollowUp) {
    setSelectedFollowUp(null)
    navigate(
      `/pacientes/${followUp.subjectPatientId}/seguimientos/${followUp.id}`,
    )
  }

  function openFollowUpEditor(followUp: FollowUp) {
    setSelectedFollowUp(null)
    setEditingFollowUp(followUp)
  }

  function openReminderEditor(reminder: Reminder) {
    setSelectedReminder(null)
    setEditingReminder(reminder)
  }

  function handleReminderComplete(reminder: Reminder) {
    setSelectedReminder(null)
    if (reminder.kind === "MEDICAL_APPOINTMENT") {
      setCompletingReminder(reminder)
      return
    }
    reminderCompleteMutation.mutate({ id: reminder.id })
  }

  function handleReminderSave(values: ReminderFormValues) {
    if (!editingReminder || !agentId) return
    reminderUpdateMutation.mutate({
      id: editingReminder.id,
      input: {
        description:
          values.kind === "MEDICAL_APPOINTMENT"
            ? values.description.trim() ||
              `Cita: ${resolveSpecialtyLabel(specialtyItems, values.medicalAppointment)}`
            : values.description,
        dueAt: new Date(values.dueAt).toISOString(),
        assignedAgentId: agentId,
        healthCenterId:
          values.kind === "MEDICAL_APPOINTMENT"
            ? values.medicalAppointment.healthCenterId || undefined
            : undefined,
        ...reminderScheduleInput(values),
      },
    })
  }

  return (
    <div className="font-ds space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mi agenda</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {events.length === 0 ? (
              "No tienes tareas pendientes."
            ) : (
              <>
                {events.length} pendiente{events.length === 1 ? "" : "s"} ·{" "}
                {todayCount} para hoy
                {overdueCount > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-red-700">
                      {overdueCount} vencida{overdueCount === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <SlidingTabs
          label="Vista de la agenda"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { id: "calendar", label: "Calendario" },
            { id: "summary", label: "Resumen" },
          ]}
        />
      </header>

      <NeedsReassignmentPanel />
      <AgentSurveysPanel
        patients={(followUpsQuery.data ?? []).flatMap((followUp) =>
          followUp.subjectPatientName
            ? [
                {
                  id: followUp.subjectPatientId,
                  name: followUp.subjectPatientName,
                },
              ]
            : [],
        )}
      />

      {viewMode === "calendar" ? (
        <AgentAgendaCalendar events={events} onSelectEvent={openEvent} />
      ) : (
        <AgendaSummary
          followUpEvents={followUpEvents}
          reminderEvents={reminderEvents}
          sessions={sessions}
          patientInfo={patientInfo}
          volunteers={volunteers}
          onSelectEvent={openEvent}
          onOpenPatient={(patientId) =>
            navigate(patientTabUrl(patientId, "psicooncologia"))
          }
        />
      )}

      <FollowUpDetailDialog
        followUp={selectedFollowUp}
        onClose={() => setSelectedFollowUp(null)}
        onGoToFollowUp={goToFollowUp}
        onEdit={openFollowUpEditor}
        onCancel={(followUp) => cancelFollowUpMutation.mutate(followUp)}
        isCancelling={cancelFollowUpMutation.isPending}
      />
      <FollowUpEditDialog
        key={editingFollowUp?.id ?? "follow-up-editor-closed"}
        open={Boolean(editingFollowUp)}
        followUp={editingFollowUp}
        isPending={rescheduleMutation.isPending}
        onOpenChange={(open) => !open && setEditingFollowUp(null)}
        onSave={({ scheduledAt }) => {
          if (editingFollowUp)
            rescheduleMutation.mutate({
              id: editingFollowUp.id,
              scheduledAt,
              status: editingFollowUp.status,
            })
        }}
      />
      <ReminderDetailDialog
        reminder={selectedReminder}
        patientName={
          selectedReminder
            ? (patientInfo.get(selectedReminder.subjectPatientId)?.name ??
              "Paciente desconocido")
            : ""
        }
        onClose={() => setSelectedReminder(null)}
        onViewPatient={(reminder) => {
          setSelectedReminder(null)
          navigate(patientTabUrl(reminder.subjectPatientId, "recordatorios"))
        }}
        onEdit={openReminderEditor}
        onComplete={handleReminderComplete}
      />
      <ReminderFormDialog
        open={Boolean(editingReminder)}
        onOpenChange={(open) => !open && setEditingReminder(null)}
        reminder={editingReminder}
        agents={agent ? [agent] : []}
        requiresAgentSelection={false}
        isPending={reminderUpdateMutation.isPending}
        onSave={handleReminderSave}
      />
      <CompleteMedicalReminderDialog
        open={Boolean(completingReminder)}
        onOpenChange={(open) => !open && setCompletingReminder(null)}
        reminder={completingReminder}
        isPending={reminderCompleteMutation.isPending}
        onConfirm={(input) => {
          if (!completingReminder) return
          reminderCompleteMutation.mutate({
            id: completingReminder.id,
            input,
          })
        }}
      />
    </div>
  )
}
