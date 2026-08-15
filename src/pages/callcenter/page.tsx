import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarClock,
  Clock,
  Headset,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react"
import { callCenterApi, type CallCenterWorkload } from "@/api/call-center"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const typeLabels: Record<string, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Email",
  IN_PERSON: "Presencial",
  FACEBOOK: "Facebook",
}
const purposeLabels: Record<string, string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
}

type WorkloadGroup = {
  id: string
  name: string
  followUps: CallCenterWorkload["scheduledFollowUps"]
  reminders: CallCenterWorkload["pendingReminders"]
}

function formatDate(date: string | null): string {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function formatTime(datetime: string | null): string {
  return datetime
    ? new Date(datetime).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sin hora"
}

export default function CallcenterPage() {
  const navigate = useNavigate()
  const workloadQuery = useQuery({
    queryKey: ["callcenter-workload"],
    queryFn: callCenterApi.workload,
    staleTime: 30_000,
  })

  if (workloadQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
        Cargando la carga del call center...
      </div>
    )
  }
  if (workloadQuery.isError || !workloadQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar la carga del call center</CardTitle>
          <CardDescription>
            {workloadQuery.error instanceof Error
              ? workloadQuery.error.message
              : "Verifica la conexión con el servidor y vuelve a intentar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => workloadQuery.refetch()}>
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { agents, scheduledFollowUps, pendingReminders } = workloadQuery.data
  const groups = new Map<string, WorkloadGroup>(
    agents.map((agent) => [
      agent.id,
      { id: agent.id, name: agent.fullName, followUps: [], reminders: [] },
    ]),
  )
  const unassigned: WorkloadGroup = {
    id: "unassigned",
    name: "Sin agente asignado",
    followUps: [],
    reminders: [],
  }
  scheduledFollowUps.forEach((followUp) =>
    (groups.get(followUp.agentId) ?? unassigned).followUps.push(followUp),
  )
  pendingReminders.forEach((reminder) =>
    (groups.get(reminder.assignedAgentId) ?? unassigned).reminders.push(
      reminder,
    ),
  )
  const workloadGroups = [
    ...groups.values(),
    ...(unassigned.followUps.length || unassigned.reminders.length
      ? [unassigned]
      : []),
  ]
  const assignedAgents = workloadGroups.filter(
    (group) =>
      group.id !== "unassigned" &&
      (group.followUps.length || group.reminders.length),
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Call center</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Carga de trabajo pendiente, organizada por agente.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Phone}
          color="bg-amber-50 text-amber-600"
          value={scheduledFollowUps.length}
          label="Seguimientos pendientes"
        />
        <Metric
          icon={CalendarClock}
          color="bg-blue-50 text-blue-600"
          value={pendingReminders.length}
          label="Recordatorios pendientes"
        />
        <Metric
          icon={Headset}
          color="bg-violet-50 text-violet-600"
          value={assignedAgents}
          label="Agentes con carga"
        />
      </section>
      <section className="space-y-4">
        {workloadGroups.map((group) => {
          const items = group.followUps.length + group.reminders.length
          return (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="bg-muted/20 border-b pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
                      {group.id === "unassigned" ? (
                        <AlertCircle className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <CardDescription>
                        {items === 0
                          ? "Sin tareas pendientes"
                          : `${items} tarea${items === 1 ? "" : "s"} pendiente${items === 1 ? "" : "s"}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {group.followUps.length} seguimientos
                    </Badge>
                    <Badge variant="secondary">
                      {group.reminders.length} recordatorios
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {items > 0 && (
                <CardContent className="grid p-0 xl:grid-cols-2">
                  <TaskColumn
                    title="Seguimientos programados"
                    count={group.followUps.length}
                    empty="No hay seguimientos pendientes."
                  >
                    {group.followUps
                      .sort((a, b) =>
                        (a.scheduledAt ?? "").localeCompare(
                          b.scheduledAt ?? "",
                        ),
                      )
                      .map((followUp) => (
                        <button
                          key={followUp.id}
                          className="hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                          onClick={() =>
                            navigate(
                              `/pacientes/${followUp.subjectPatientId}/seguimientos/${followUp.id}`,
                            )
                          }
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <Phone className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {followUp.subjectPatientName}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {typeLabels[followUp.type]} ·{" "}
                              {purposeLabels[followUp.purpose]}
                            </p>
                            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                              <Calendar className="size-3" />
                              {formatDate(followUp.scheduledAt)}
                              <Clock className="ml-1 size-3" />
                              {formatTime(followUp.scheduledAt)}
                            </p>
                          </div>
                          <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                        </button>
                      ))}
                  </TaskColumn>
                  <TaskColumn
                    title="Recordatorios"
                    count={group.reminders.length}
                    empty="No hay recordatorios pendientes."
                  >
                    {group.reminders
                      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
                      .map((reminder) => (
                        <button
                          key={reminder.id}
                          className="hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                          onClick={() =>
                            navigate(
                              patientTabUrl(
                                reminder.subjectPatientId,
                                "recordatorios",
                              ),
                            )
                          }
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <CalendarClock className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {reminder.subjectPatientName}
                            </p>
                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                              {reminder.description}
                            </p>
                            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                              <Calendar className="size-3" />
                              {formatDate(reminder.dueAt)}
                            </p>
                          </div>
                          <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                        </button>
                      ))}
                  </TaskColumn>
                </CardContent>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: typeof Phone
  color: string
  value: number
  label: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-10 items-center justify-center rounded-full ${color}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskColumn({
  title,
  count,
  empty,
  children,
}: {
  title: string
  count: number
  empty: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b last:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="outline">{count}</Badge>
      </div>
      {count ? (
        <div className="divide-y">{children}</div>
      ) : (
        <p className="text-muted-foreground px-5 py-6 text-sm">{empty}</p>
      )}
    </div>
  )
}
