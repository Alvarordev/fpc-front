import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, CheckCircle2, History, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import { agentsApi } from "@/api/agents"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { patientsApi } from "@/api/patients"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { DateTile } from "@/components/ds/date-tile"
import { EmptyState } from "@/components/ds/empty-state"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { StatTile } from "@/components/ds/stat-tile"
import type { Tone } from "@/components/ds/tone"
import { Skeleton } from "@/components/ui/skeleton"
import { followUpStatusLabels, formatFollowUpTitle } from "@/lib/follow-up-labels"
import { useAuthStore } from "@/store/auth-store"
import { capitalize, daysFromToday, formatDate, formatTime, relativeDay } from "../_lib/ficha-format"
import type { ScheduleFollowUpFormValues } from "./schedule-follow-up-schema"
import { ScheduleFollowUpsDialog } from "./schedule-follow-ups-dialog"

// Seguimientos del paciente: una sola lista en orden cronológico con filtros.
// Lo de hoy se resalta en su lugar; cada tarjeta abre el seguimiento.

const STATUS_TONE: Record<FollowUp["status"], Tone> = { SCHEDULED: "blue", OVERDUE: "red", COMPLETED: "green", NO_ANSWER: "amber", CANCELLED: "gray" }

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "pendientes", label: "Pendientes" },
  { id: "completados", label: "Completados" },
  { id: "no-contestados", label: "No contestaron" },
  { id: "cancelados", label: "Cancelados" },
] as const
type Filter = (typeof FILTERS)[number]["id"]

const isOpen = (f: FollowUp) => f.status === "SCHEDULED" || f.status === "OVERDUE"
const dateOf = (f: FollowUp) => f.completedAt ?? f.completedOn ?? f.scheduledAt ?? f.scheduledOn ?? f.createdAt
/**
 * Cuándo se habló (o se intentó) con el paciente. Un No contestó no tiene fecha de
 * realización: vale su último intento. Uno histórico ocurrió en su fecha
 * programada (ya pasada); uno operativo sin intentos, cuando se cerró.
 */
const contactDateOf = (f: FollowUp) => {
  if (f.completedAt ?? f.completedOn) return (f.completedAt ?? f.completedOn)!
  if (f.status !== "NO_ANSWER") return dateOf(f)
  const lastAttempt = f.attempts?.map((attempt) => attempt.occurredAt).sort().at(-1)
  return lastAttempt ?? (f.isHistorical ? (f.scheduledAt ?? f.scheduledOn ?? f.updatedAt) : f.updatedAt)
}

function matches(f: FollowUp, filter: Filter) {
  if (filter === "pendientes") return isOpen(f)
  if (filter === "completados") return f.status === "COMPLETED"
  if (filter === "no-contestados") return f.status === "NO_ANSWER"
  if (filter === "cancelados") return f.status === "CANCELLED"
  return true
}

function toScheduledAt(date: string, time: string) {
  const value = new Date(`${date}T${time}:00`)
  if (Number.isNaN(value.valueOf())) throw new Error("La fecha del seguimiento no es válida")
  return value.toISOString()
}

export function SeguimientoTab({ pacienteId }: { pacienteId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const canManage = user?.role === "ADMIN" || user?.role === "FOUNDATION" || user?.role === "AGENT"
  const requiresAgentSelection = user?.role === "ADMIN" || user?.role === "FOUNDATION"
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>("todos")

  // "Agendar seguimiento" de la cabecera llega con ?agendar=1.
  const requested = canManage && searchParams.get("agendar") === "1"
  const dialogOpen = scheduleOpen || requested
  function setDialogOpen(open: boolean) {
    setScheduleOpen(open)
    if (!open && requested) {
      const next = new URLSearchParams(searchParams)
      next.delete("agendar")
      setSearchParams(next, { replace: true })
    }
  }

  const followUpsQuery = useQuery({ queryKey: ["patient-follow-ups", pacienteId], queryFn: () => followUpsApi.list({ patientId: pacienteId }) })
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: agentsApi.list, enabled: canManage, staleTime: 60_000 })
  const companionsQuery = useQuery({ queryKey: ["patient-companions", pacienteId], queryFn: () => patientsApi.companions(pacienteId), staleTime: 30_000 })
  const primaryContactId = companionsQuery.data?.find((link) => link.isPrimaryContact)?.companionId ?? pacienteId

  const schedule = useMutation({
    mutationFn: async (values: ScheduleFollowUpFormValues[]) => {
      const own = agentsQuery.data?.find((agent) => agent.userId === user?.id)
      const agentId = requiresAgentSelection ? values[0]?.agentId : own?.id
      if (!agentId) throw new Error("No se encontró un agente asociado a tu cuenta")
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
        queryClient.invalidateQueries({ queryKey: ["patient-timeline", pacienteId] }),
        queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", pacienteId] }),
        queryClient.invalidateQueries({ queryKey: ["agent-follow-ups"] }),
      ])
      setDialogOpen(false)
      toast.success(`${created.length} ${created.length === 1 ? "seguimiento agendado" : "seguimientos agendados"}`)
    },
    onError: (error: Error) => toast.error("No se pudieron agendar los seguimientos", { description: error.message }),
  })

  const all = useMemo(() => [...(followUpsQuery.data ?? [])].sort((a, b) => dateOf(b).localeCompare(dateOf(a))), [followUpsQuery.data])
  const pending = all.filter(isOpen)
  const nextPending = [...pending].sort((a, b) => dateOf(a).localeCompare(dateOf(b)))[0]
  const last = all
    .filter((f) => f.status === "COMPLETED" || f.status === "NO_ANSWER")
    .sort((a, b) => contactDateOf(b).localeCompare(contactDateOf(a)))[0]
  const list = all.filter((f) => matches(f, filter))
  const agentName = (id: string) => agentsQuery.data?.find((a) => a.id === id)?.fullName

  if (followUpsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-[20px] bg-white" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[20px] bg-white" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile icon={CalendarClock} label="Pendientes" value={pending.length} hint={nextPending ? `El próximo ${relativeDay(dateOf(nextPending))}` : "Ninguno agendado"} />
        <StatTile icon={CheckCircle2} label="Completados" value={all.filter((f) => f.status === "COMPLETED").length} hint={`De ${all.length} registrados`} />
        <StatTile icon={History} label="Último contacto" value={last ? formatDate(contactDateOf(last), false) : "Ninguno"} hint={last ? capitalize(relativeDay(contactDateOf(last))) : "Aún no se contacta"} />
      </div>
      <Card title="Seguimientos" description="Incluye los de todos los agentes; cada tarjeta dice quién lo tiene" action={canManage ? <AddButton onClick={() => setScheduleOpen(true)}>Agendar seguimiento</AddButton> : undefined}>
        {followUpsQuery.isError ? (
          <p className="text-[13px] text-red-700">No se pudieron cargar los seguimientos. Recarga la página para intentarlo de nuevo.</p>
        ) : all.length === 0 ? (
          <EmptyState title="Sin seguimientos" body="Agenda el primero y asígnale un tipo: llamada, WhatsApp, visita u otro." action={canManage ? "Agendar seguimiento" : undefined} onAction={() => setScheduleOpen(true)} />
        ) : (
          <>
            <div className="mb-4">
              <FilterToggles value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ id: f.id, label: f.label, count: all.filter((x) => matches(x, f.id)).length }))} />
            </div>
            <div key={filter} className="space-y-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
              {list.length === 0 && <p className="py-6 text-center text-[13px] text-zinc-500">No hay seguimientos con este filtro.</p>}
              {list.map((f) => {
                const when = dateOf(f)
                const today = isOpen(f) && daysFromToday(when) === 0
                const attempts = f.attempts?.length ?? 0
                return (
                  <Item
                    key={f.id}
                    highlight={today || f.status === "OVERDUE"}
                    leading={<DateTile date={when} urgent={today || f.status === "OVERDUE"} />}
                    title={formatFollowUpTitle(f.type, f.purpose)}
                    tags={
                      <>
                        <Chip tone={STATUS_TONE[f.status]}>{followUpStatusLabels[f.status]}</Chip>
                        {today && <Chip tone="red">Hoy</Chip>}
                        {f.isHistorical && <Chip>Carga histórica</Chip>}
                      </>
                    }
                    meta={[formatTime(f.completedAt ?? f.scheduledAt), agentName(f.agentId), attempts ? `${attempts} ${attempts === 1 ? "intento" : "intentos"}` : null, f.nextFollowUpId ? "reagendado" : null].filter(Boolean).join(", ")}
                    body={
                      f.notes && (
                        <span className="flex gap-2">
                          <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
                          <span className="line-clamp-2">{f.notes}</span>
                        </span>
                      )
                    }
                    footer={today && canManage ? <Button variant="brand" onClick={() => navigate(`/pacientes/${pacienteId}/seguimientos/${f.id}`)}>Registrar resultado</Button> : undefined}
                    onOpen={() => navigate(`/pacientes/${pacienteId}/seguimientos/${f.id}`)}
                    openLabel="Abrir seguimiento"
                  />
                )
              })}
            </div>
          </>
        )}
      </Card>
      <ScheduleFollowUpsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (values) => {
          await schedule.mutateAsync(values)
        }}
        isPending={schedule.isPending}
        agents={agentsQuery.data}
        requiresAgentSelection={requiresAgentSelection}
      />
    </div>
  )
}
