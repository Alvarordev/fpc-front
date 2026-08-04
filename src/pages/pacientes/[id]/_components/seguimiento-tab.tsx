import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, CalendarPlus, Phone, PhoneCall } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { agentsApi } from "@/api/agents"
import { followUpsApi } from "@/api/follow-ups"
import { patientTimelineApi } from "@/api/patient-timeline"
import { useAuthStore } from "@/store/auth-store"
import { ScheduleFollowUpDialog, type ScheduleFollowUpFormValues } from "./schedule-follow-up-dialog"
import { TimelineEventCard } from "./timeline-event-card"

interface SeguimientoTabProps {
  pacienteId: string
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function SeguimientoTab({ pacienteId }: SeguimientoTabProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"

  const timelineQuery = useQuery({
    queryKey: ["patient-timeline", pacienteId],
    queryFn: () => patientTimelineApi.list(pacienteId),
    enabled: Boolean(pacienteId),
  })
  const agentsQuery = useQuery({
    queryKey: ["agents"],
    queryFn: agentsApi.list,
    enabled: canManage,
    staleTime: 60_000,
  })
  const scheduleMutation = useMutation({
    mutationFn: followUpsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] })
      toast.success("Seguimiento agendado correctamente")
    },
    onError: (error: Error) => toast.error("No se pudo agendar el seguimiento", { description: error.message }),
  })

  const events = timelineQuery.data?.data ?? []
  const followUps = events.filter((event) => event.kind === "FOLLOW_UP")
  const completedFollowUps = followUps.filter((event) => event.status === "COMPLETED")
  const nextScheduled = followUps
    .filter((event) => event.status === "SCHEDULED")
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))[0]
  const lastCompleted = [...completedFollowUps].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0]

  async function schedule(values: ScheduleFollowUpFormValues) {
    const ownAgent = agentsQuery.data?.find((agent) => agent.userId === user?.id)
    const agentId = requiresAgentSelection ? values.agentId : ownAgent?.id

    if (!agentId) {
      throw new Error("No se encontró un agente asociado a tu cuenta")
    }

    await scheduleMutation.mutateAsync({
      subjectPatientId: pacienteId,
      interlocutorId: pacienteId,
      agentId,
      type: values.type,
      purpose: values.purpose,
      scheduledAt: `${values.date}T${values.time}:00`,
      notes: values.notes || undefined,
    })
  }

  function openSchedule() {
    if (nextScheduled) {
      toast.error("Ya existe un seguimiento agendado", {
        description: "Completá, cancelá o marcá como no contestado el seguimiento actual antes de agendar otro.",
      })
      return
    }

    setScheduleOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-50">
              <Phone className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">{completedFollowUps.length}</p>
              <p className="text-xs text-muted-foreground">seguimientos completados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex size-8 items-center justify-center rounded-full bg-muted">
              <PhoneCall className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {lastCompleted ? formatShortDate(lastCompleted.occurredAt) : "Sin contactos"}
              </p>
              <p className="text-xs text-muted-foreground">último contacto</p>
            </div>
          </div>
        </div>
        {canManage && (
          <Button size="sm" className="shrink-0 gap-1.5" onClick={openSchedule}>
            <CalendarPlus className="size-4" />
            Agendar seguimiento
          </Button>
        )}
      </div>

      {nextScheduled && (
        <button
          type="button"
          onClick={() => navigate(`/pacientes/${pacienteId}/seguimientos/${nextScheduled.followUpId}`)}
          className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <CalendarClock className="size-4 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900">
              Seguimiento agendado para {formatShortDate(nextScheduled.occurredAt)}
            </p>
            <p className="text-xs text-amber-700/80">Abrílo para registrar el resultado</p>
          </div>
        </button>
      )}

      {timelineQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Cargando historial...</div>
      ) : timelineQuery.isError ? (
        <div className="flex h-48 items-center justify-center text-sm text-destructive">No se pudo cargar el historial.</div>
      ) : events.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium">Sin historial de seguimiento</p>
          <p className="text-xs text-muted-foreground">Los seguimientos, recordatorios y sesiones aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {events.map((event) => (
            <TimelineEventCard
              key={`${event.kind}-${event.id}`}
              event={event}
              onClick={event.kind === "FOLLOW_UP" ? () => navigate(`/pacientes/${pacienteId}/seguimientos/${event.followUpId}`) : undefined}
            />
          ))}
        </div>
      )}

      <ScheduleFollowUpDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onSubmit={schedule}
        isPending={scheduleMutation.isPending}
        agents={agentsQuery.data}
        requiresAgentSelection={requiresAgentSelection}
      />
    </div>
  )
}
