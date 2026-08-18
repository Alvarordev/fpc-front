import { useMemo, useState, type ComponentType } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
  Users,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { agentsApi } from "@/api/agents"
import { patientsApi } from "@/api/patients"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import {
  patientTimelineApi,
  type PatientTimelineEvent,
} from "@/api/patient-timeline"
import { useAuthStore } from "@/store/auth-store"
import { formatFollowUpTitle } from "@/lib/follow-up-labels"
import { ScheduleFollowUpsDialog } from "./schedule-follow-ups-dialog"
import type { ScheduleFollowUpFormValues } from "./schedule-follow-up-schema"
import { TimelineEventCard } from "./timeline-event-card"

interface SeguimientoTabProps {
  pacienteId: string
}

type ScheduledFollowUp = FollowUp & { scheduledAt: string }

const followUpTypeIcons: Record<
  FollowUp["type"],
  ComponentType<{ className?: string }>
> = {
  CALL: PhoneCall,
  WHATSAPP: MessageSquare,
  VIDEO_CALL: Video,
  EMAIL: Mail,
  IN_PERSON: Users,
  FACEBOOK: MessageSquare,
}

function isScheduledFollowUp(
  followUp: FollowUp,
): followUp is ScheduledFollowUp {
  return followUp.status === "SCHEDULED" && Boolean(followUp.scheduledAt)
}

function formatShortDate(date: string | null | undefined): string {
  if (!date) return "Sin seguimientos"

  return new Date(date).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatMonth(date: Date) {
  return date
    .toLocaleDateString("es-PE", { month: "short" })
    .replace(".", "")
    .toUpperCase()
}

function formatScheduledAt(date: string) {
  const value = new Date(date)
  return {
    day: value.toLocaleDateString("es-PE", { day: "numeric" }),
    month: formatMonth(value),
    year: value.toLocaleDateString("es-PE", { year: "numeric" }),
    date: value.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: value.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function relativeScheduleLabel(date: string) {
  const target = startOfDay(new Date(date))
  const today = startOfDay(new Date())
  const difference = Math.round(
    (target.valueOf() - today.valueOf()) / (24 * 60 * 60 * 1000),
  )

  if (difference < 0) return "Vencido"
  if (difference === 0) return "Hoy"
  if (difference === 1) return "Mañana"
  if (difference < 7) return `En ${difference} días`
  return "Planificado"
}

function toScheduledAt(date: string, time: string) {
  const value = new Date(`${date}T${time}:00`)
  if (Number.isNaN(value.valueOf())) {
    throw new Error("La fecha del seguimiento no es válida")
  }

  return value.toISOString()
}

function historyDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function historyDateLabel(value: string) {
  const label = new Date(value).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return label.charAt(0).toUpperCase() + label.slice(1)
}

function groupHistory(events: PatientTimelineEvent[]) {
  const groups = new Map<
    string,
    { label: string; events: PatientTimelineEvent[] }
  >()

  for (const event of events) {
    const key = historyDateKey(event.occurredAt)
    const group = groups.get(key)
    if (group) {
      group.events.push(event)
    } else {
      groups.set(key, {
        label: historyDateLabel(event.occurredAt),
        events: [event],
      })
    }
  }

  return [...groups.values()]
}

function isIndependentHistoryEvent(event: PatientTimelineEvent) {
  if (event.kind === "FOLLOW_UP") return event.status !== "SCHEDULED"
  return event.followUpId === null
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  tone: "amber" | "green" | "slate"
}) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-600",
    slate: "bg-muted text-muted-foreground",
  }

  return (
    <Card className="ring-foreground/5 flex-row items-center gap-3 rounded-xl px-4 py-4 ring-1">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${toneClasses[tone]}`}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg leading-none font-semibold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-xs">{label}</p>
      </div>
    </Card>
  )
}

function ScheduledFollowUpCard({
  followUp,
  onClick,
}: {
  followUp: ScheduledFollowUp
  onClick: () => void
}) {
  const Icon = followUpTypeIcons[followUp.type]
  const date = formatScheduledAt(followUp.scheduledAt)
  const relativeLabel = relativeScheduleLabel(followUp.scheduledAt)
  const isOverdue = relativeLabel === "Vencido"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group focus-visible:ring-ring/50 flex w-full items-stretch gap-3 rounded-2xl border p-3 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-sm focus-visible:ring-3 focus-visible:outline-none active:translate-y-px sm:gap-5 sm:p-4 ${
        isOverdue
          ? "border-red-200 bg-amber-50/70 hover:border-red-300"
          : "border-amber-200/90 bg-amber-50/60 hover:border-amber-300"
      }`}
    >
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-100/80 py-2 text-amber-900 sm:w-16">
        <span className="text-2xl leading-none font-semibold tracking-tight">
          {date.day}
        </span>
        <span className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wider">
          {date.month}
        </span>
        <span className="text-muted-foreground text-[10px]">{date.year}</span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Icon className="size-3.5" />
          </span>
          <p className="min-w-0 truncate text-sm font-semibold sm:text-base">
            {formatFollowUpTitle(followUp.type, followUp.purpose)}
          </p>
          <Badge
            variant="outline"
            className={
              isOverdue
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-100/70 text-amber-800"
            }
          >
            {relativeLabel}
          </Badge>
        </div>
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            <span className="capitalize">{date.date}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {date.time}
          </span>
        </div>
        {followUp.notes && (
          <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
            {followUp.notes}
          </p>
        )}
      </div>

      <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

export function SeguimientoTab({ pacienteId }: SeguimientoTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const requiresAgentSelection =
    user?.role === "ADMIN" || user?.role === "FOUNDATION"

  const timelineQuery = useQuery({
    queryKey: ["patient-timeline", pacienteId],
    queryFn: () => patientTimelineApi.list(pacienteId),
    enabled: Boolean(pacienteId),
  })
  const followUpsQuery = useQuery({
    queryKey: ["patient-follow-ups", pacienteId],
    queryFn: () => followUpsApi.list({ patientId: pacienteId }),
    enabled: Boolean(pacienteId),
  })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })
  const companionsQuery = useQuery({
    queryKey: ["patient-companions", pacienteId],
    queryFn: () => patientsApi.companions(pacienteId),
    enabled: Boolean(pacienteId),
    staleTime: 30_000,
  })
  const primaryContactId =
    companionsQuery.data?.find((link) => link.isPrimaryContact)?.companionId ??
    pacienteId
  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFollowUpFormValues[]) => {
      const ownAgent = agentsQuery.data?.find(
        (agent) => agent.userId === user?.id,
      )
      const agentId = requiresAgentSelection ? values[0]?.agentId : ownAgent?.id

      if (!agentId) {
        throw new Error("No se encontró un agente asociado a tu cuenta")
      }

      return followUpsApi.createBatch({
        followUps: values.map((value) => ({
          subjectPatientId: pacienteId,
           interlocutorId: primaryContactId,
          agentId,
          type: value.type,
          purpose: value.purpose,
          scheduledAt: toScheduledAt(value.date, value.time),
          notes: value.notes || undefined,
        })),
      })
    },
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["patient-timeline", pacienteId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patient-follow-ups", pacienteId],
        }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      setScheduleOpen(false)
      toast.success(
        `${created.length} ${created.length === 1 ? "seguimiento planificado" : "seguimientos planificados"}`,
      )
    },
    onError: (error: Error) =>
      toast.error("No se pudieron planificar los seguimientos", {
        description: error.message,
      }),
  })

  const events = timelineQuery.data?.data
  const followUps = followUpsQuery.data
  const scheduledFollowUps = useMemo(
    () =>
      (followUps ?? [])
        .filter(isScheduledFollowUp)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).valueOf() -
            new Date(b.scheduledAt).valueOf(),
        ),
    [followUps],
  )
  const completedFollowUps = (followUps ?? []).filter(
    (followUp) => followUp.status === "COMPLETED",
  )
  const lastContact = [...(followUps ?? [])]
    .filter(
      (followUp) =>
        followUp.status === "COMPLETED" || followUp.status === "NO_ANSWER",
    )
    .sort((a, b) => {
      const aDate = a.completedAt ?? a.scheduledAt ?? a.createdAt
      const bDate = b.completedAt ?? b.scheduledAt ?? b.createdAt
      return bDate.localeCompare(aDate)
    })[0]
  const historyEvents = useMemo(
    () =>
      (events ?? [])
        .filter(isIndependentHistoryEvent)
        .sort(
          (a, b) =>
            new Date(b.occurredAt).valueOf() - new Date(a.occurredAt).valueOf(),
        ),
    [events],
  )
  const historyGroups = useMemo(
    () => groupHistory(historyEvents),
    [historyEvents],
  )
  const isLoading = timelineQuery.isLoading || followUpsQuery.isLoading
  const isError = timelineQuery.isError || followUpsQuery.isError

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Seguimiento
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Plan de seguimientos
          </h2>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Organizá los próximos seguimientos y consultá lo que ya ocurrió.
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            className="w-full gap-1.5 sm:w-auto"
            onClick={() => setScheduleOpen(true)}
          >
            <CalendarPlus className="size-4" />
            Planificar seguimientos
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
          Cargando seguimiento...
        </div>
      ) : isError ? (
        <Card className="ring-foreground/5 flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center ring-1">
          <AlertCircle className="text-destructive size-5" />
          <p className="text-sm font-medium">
            No se pudo cargar el seguimiento
          </p>
          <p className="text-muted-foreground text-xs">
            Intentá volver a cargar la página.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={CalendarClock}
              label="Seguimientos pendientes"
              value={scheduledFollowUps.length}
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="Seguimientos completados"
              value={completedFollowUps.length}
              tone="green"
            />
            <StatCard
              icon={Phone}
              label="Último seguimiento"
              value={formatShortDate(
                lastContact?.completedAt ?? lastContact?.scheduledAt,
              )}
              tone="slate"
            />
          </div>

          <section
            className="space-y-4"
            aria-labelledby="planned-follow-ups-title"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3
                  id="planned-follow-ups-title"
                  className="text-base font-semibold"
                >
                  Seguimientos pendientes
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {scheduledFollowUps.length === 0
                    ? "Todavía no hay seguimientos futuros."
                    : "Ordenados desde el más próximo."}
                </p>
              </div>
              {scheduledFollowUps.length > 0 && (
                <Badge variant="secondary">
                  {scheduledFollowUps.length}{" "}
                  {scheduledFollowUps.length === 1 ? "pendiente" : "pendientes"}
                </Badge>
              )}
            </div>

            {scheduledFollowUps.length > 0 ? (
              <div className="space-y-3">
                {scheduledFollowUps.map((followUp) => (
                  <ScheduledFollowUpCard
                    key={followUp.id}
                    followUp={followUp}
                    onClick={() =>
                      navigate(
                        `/pacientes/${pacienteId}/seguimientos/${followUp.id}`,
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <Card className="ring-foreground/5 flex flex-col items-center justify-center gap-3 border-dashed p-8 text-center ring-1">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-full">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    No hay seguimientos pendientes
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    El próximo seguimiento aparecerá acá.
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setScheduleOpen(true)}
                  >
                    <CalendarPlus className="size-4" />
                    Planificar ahora
                  </Button>
                )}
              </Card>
            )}
          </section>

          <section className="space-y-4" aria-labelledby="history-title">
            <div>
              <h3 id="history-title" className="text-base font-semibold">
                Historial de seguimientos
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Actividad registrada durante los seguimientos.
              </p>
            </div>

            {historyGroups.length > 0 ? (
              <div className="relative space-y-8 pl-4 sm:pl-8">
                <div className="bg-border absolute top-1 bottom-1 left-1.5 w-px sm:left-5" />
                {historyGroups.map((group) => (
                  <div key={group.label} className="relative space-y-3">
                    <div className="relative flex items-center gap-3">
                      <span className="bg-muted-foreground/60 ring-background relative z-10 size-3 rounded-full ring-4" />
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {group.label}
                      </p>
                    </div>
                    <div className="space-y-3">
                      {group.events.map((event) => (
                        <TimelineEventCard
                          key={`${event.kind}-${event.id}`}
                          event={event}
                          onClick={
                            event.kind === "FOLLOW_UP"
                              ? () =>
                                  navigate(
                                    `/pacientes/${pacienteId}/seguimientos/${event.followUpId}`,
                                  )
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="ring-foreground/5 flex min-h-36 flex-col items-center justify-center gap-2 border-dashed p-6 text-center ring-1">
                <Clock3 className="text-muted-foreground size-5" />
                <p className="text-sm font-medium">
                  Todavía no hay actividad registrada
                </p>
              </Card>
            )}
          </section>
        </>
      )}

      <ScheduleFollowUpsDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSubmit={async (values) => {
          await scheduleMutation.mutateAsync(values)
        }}
        isPending={scheduleMutation.isPending}
        agents={agentsQuery.data}
        requiresAgentSelection={requiresAgentSelection}
      />
    </div>
  )
}
