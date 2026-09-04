import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Calendar,
  CalendarClock,
  CalendarDays,
  Clock3,
  List,
  Loader2,
  Phone,
  RefreshCw,
  Video,
} from "lucide-react"
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
import { PatientHealthSubcategoryDot } from "@/components/patient-health-subcategory-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import { CompleteMedicalReminderDialog } from "@/pages/pacientes/[id]/_components/complete-medical-reminder-dialog"
import {
  ReminderFormDialog,
  type ReminderFormValues,
} from "@/pages/pacientes/[id]/_components/reminder-form-dialog"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"
import { AgentAgendaCalendar } from "./_components/agent-agenda-calendar"
import { FollowUpDetailDialog } from "./_components/follow-up-detail-dialog"
import { FollowUpEditDialog } from "./_components/follow-up-edit-dialog"
import { ReminderDetailDialog } from "./_components/reminder-detail-dialog"
import {
  buildAgendaEvents,
  formatAgendaDate,
  formatAgendaDateTime,
  formatAgendaTime,
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
  const agent = agentsQuery.data?.find((item) => item.userId === user?.id)
  const agentId = agent?.id

  const followUpsQuery = useQuery({
    queryKey: ["agent-follow-ups", agentId],
    queryFn: () => followUpsApi.list({ agentId, status: "SCHEDULED" }),
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
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      followUpsApi.update(id, { scheduledAt }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["agent-follow-ups", agentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["follow-up", variables.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["patient-timeline"] }),
      ])
      setEditingFollowUp(null)
      toast.success("Seguimiento reagendado")
    },
    onError: (error: Error) =>
      toast.error("No se pudo reagendar el seguimiento", {
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
      <div className="text-muted-foreground flex h-64 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando tu agenda...
      </div>
    )
  }

  if (
    agentsQuery.isError ||
    !agentId ||
    followUpsQuery.isError ||
    remindersQuery.isError
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar tu agenda</CardTitle>
          <CardDescription>
            {agentsQuery.isError
              ? "Revisa la conexión con el servidor e intenta nuevamente."
              : !agentId
                ? "Tu usuario todavía no tiene un perfil de agente asociado."
                : "No se pudieron cargar tus seguimientos o recordatorios. Intenta nuevamente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => {
              void agentsQuery.refetch()
              void followUpsQuery.refetch()
              void remindersQuery.refetch()
            }}
          >
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
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
              `Cita: ${values.medicalAppointment.specialty}`
            : values.description,
        dueAt: new Date(values.dueAt).toISOString(),
        assignedAgentId: agentId,
        healthCenterId:
          values.kind === "MEDICAL_APPOINTMENT"
            ? values.medicalAppointment.healthCenterId || undefined
            : undefined,
      },
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.18em] uppercase">
            Tu espacio de trabajo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Mi agenda</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Organiza tus seguimientos, recordatorios y lo que tienes programado
            para los próximos días.
          </p>
        </div>
        <div className="bg-muted/40 flex w-fit items-center rounded-xl border p-1 text-xs">
          <ViewButton
            active={viewMode === "calendar"}
            icon={CalendarDays}
            onClick={() => setViewMode("calendar")}
          >
            Calendario
          </ViewButton>
          <ViewButton
            active={viewMode === "summary"}
            icon={List}
            onClick={() => setViewMode("summary")}
          >
            Resumen
          </ViewButton>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <AgendaMetric
          icon={CalendarClock}
          label="Tareas pendientes"
          value={events.length}
          tone="amber"
        />
        <AgendaMetric
          icon={CalendarDays}
          label="Para hoy"
          value={todayCount}
          tone="primary"
        />
        <AgendaMetric
          icon={Bell}
          label="Vencidas"
          value={overdueCount}
          tone="violet"
        />
      </section>

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
      />
      <FollowUpEditDialog
        key={editingFollowUp?.id ?? "follow-up-editor-closed"}
        open={Boolean(editingFollowUp)}
        followUp={editingFollowUp}
        isPending={rescheduleMutation.isPending}
        onOpenChange={(open) => !open && setEditingFollowUp(null)}
        onSave={({ scheduledAt }) => {
          if (editingFollowUp)
            rescheduleMutation.mutate({ id: editingFollowUp.id, scheduledAt })
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

function ViewButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean
  icon: typeof CalendarDays
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  )
}

function AgendaMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarClock
  label: string
  value: number
  tone: "amber" | "primary" | "violet"
}) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-600",
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-50 text-violet-600",
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl leading-none font-semibold">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AgendaSummary({
  followUpEvents,
  reminderEvents,
  sessions,
  patientInfo,
  volunteers,
  onSelectEvent,
  onOpenPatient,
}: {
  followUpEvents: Extract<AgendaEvent, { kind: "follow-up" }>[]
  reminderEvents: Extract<AgendaEvent, { kind: "reminder" }>[]
  sessions: Awaited<ReturnType<typeof psychooncologyAppointmentsApi.list>>
  patientInfo: Map<string, AgendaPatientInfo>
  volunteers: Map<string, { firstName: string; lastName: string }>
  onSelectEvent: (event: AgendaEvent) => void
  onOpenPatient: (patientId: string) => void
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <TaskBentoCard
        className="xl:row-span-2"
        title="Seguimientos"
        description="Contactos que tienes agendados"
        icon={Phone}
        tone="amber"
        events={followUpEvents}
        empty="No tienes seguimientos agendados."
        onSelectEvent={onSelectEvent}
      />
      <TaskBentoCard
        title="Recordatorios"
        description="Tareas pendientes para tus pacientes"
        icon={Bell}
        tone="violet"
        events={reminderEvents}
        empty="No tienes recordatorios pendientes."
        onSelectEvent={onSelectEvent}
      />
      <PsychooncologyCard
        sessions={sessions}
        patientInfo={patientInfo}
        volunteers={volunteers}
        onOpenPatient={onOpenPatient}
      />
    </section>
  )
}

function TaskBentoCard({
  className,
  title,
  description,
  icon: Icon,
  tone,
  events,
  empty,
  onSelectEvent,
}: {
  className?: string
  title: string
  description: string
  icon: typeof Phone
  tone: "amber" | "violet"
  events: AgendaEvent[]
  empty: string
  onSelectEvent: (event: AgendaEvent) => void
}) {
  const toneClasses = {
    amber: { icon: "bg-amber-100 text-amber-700", accent: "bg-amber-500" },
    violet: { icon: "bg-violet-100 text-violet-700", accent: "bg-violet-500" },
  }[tone]
  const visibleEvents = events.slice(0, 8)

  return (
    <Card className={className}>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-xl ${toneClasses.icon}`}
            >
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{events.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {visibleEvents.length === 0 ? (
          <EmptyState icon={Icon} message={empty} />
        ) : (
          <div className="divide-y">
            {visibleEvents.map((event) => (
              <BentoTaskRow
                key={`${event.kind}-${event.id}`}
                event={event}
                accent={toneClasses.accent}
                onClick={() => onSelectEvent(event)}
              />
            ))}
            {events.length > visibleEvents.length && (
              <p className="text-muted-foreground px-5 py-3 text-center text-xs">
                +{events.length - visibleEvents.length} tareas más en el
                calendario
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BentoTaskRow({
  event,
  accent,
  onClick,
}: {
  event: AgendaEvent
  accent: string
  onClick: () => void
}) {
  const overdue = isOverdue(event.startsAt)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors"
    >
      <span className={`h-10 w-1 shrink-0 rounded-full ${accent}`} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
          <PatientHealthSubcategoryDot subcategory={event.healthSubcategory} />
          <span className="truncate">{event.patientName}</span>
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {event.title} · {event.detail}
        </p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <Calendar className="size-3" />
          {formatAgendaDate(event.startsAt)}
          <Clock3 className="ml-1 size-3" />
          {formatAgendaTime(event.startsAt)}
        </p>
      </div>
      {overdue && (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-[10px] text-red-700"
        >
          Vencida
        </Badge>
      )}
      <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

function PsychooncologyCard({
  sessions,
  patientInfo,
  volunteers,
  onOpenPatient,
}: {
  sessions: Awaited<ReturnType<typeof psychooncologyAppointmentsApi.list>>
  patientInfo: Map<string, AgendaPatientInfo>
  volunteers: Map<string, { firstName: string; lastName: string }>
  onOpenPatient: (patientId: string) => void
}) {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Psicooncología</CardTitle>
              <CardDescription className="mt-1">
                Citas próximas del programa
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{sessions.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <EmptyState
            icon={BrainCircuit}
            message="No hay citas psicooncológicas próximas."
          />
        ) : (
          <div className="divide-y">
            {sessions.slice(0, 6).map((session) => {
              const volunteer = volunteers.get(session.volunteerId)
              const Icon = session.modality === "VIDEO_CALL" ? Video : Phone
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onOpenPatient(session.patientId)}
                  className="group hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <PatientHealthSubcategoryDot
                        subcategory={
                          patientInfo.get(session.patientId)?.healthSubcategory
                        }
                      />
                      <span className="truncate">
                        {patientInfo.get(session.patientId)?.name ??
                          "Paciente desconocido"}
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      Sesión {session.sessionNumber}
                      {volunteer
                        ? ` · ${volunteer.firstName} ${volunteer.lastName}`
                        : ""}
                    </p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                      <Calendar className="size-3" />
                      {formatAgendaDateTime(session.scheduledAt)}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Phone
  message: string
}) {
  return (
    <div className="text-muted-foreground flex min-h-36 flex-col items-center justify-center gap-2 px-5 text-center">
      <Icon className="size-8 opacity-25" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
