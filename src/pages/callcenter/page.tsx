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
import {
  agentsApi,
  contactsApi,
  patientsApi,
  recordatoriosApi,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  Contact,
  ContactPurpose,
  ContactType,
  Patient,
  Reminder,
  ReminderType,
} from "@/types"

const contactTypeLabels: Record<ContactType, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Email",
  IN_PERSON: "Presencial",
}

const contactPurposeLabels: Record<ContactPurpose, string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
}

const reminderTypeLabels: Record<ReminderType, string> = {
  LABORATORIO: "Laboratorio",
  IMAGEN: "Imagen",
  CONSULTA: "Consulta",
  PROCEDIMIENTO: "Procedimiento",
  MEDICACION: "Medicación",
  OTRO: "Otro",
}

type WorkloadGroup = {
  id: string
  name: string
  contacts: Contact[]
  reminders: Reminder[]
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
  return datetime?.slice(11, 16) ?? "Sin hora"
}

export default function CallcenterPage() {
  const navigate = useNavigate()
  const workloadQuery = useQuery({
    queryKey: ["callcenter-workload"],
    queryFn: async () => {
      const [agents, contacts, patients] = await Promise.all([
        agentsApi.list(),
        contactsApi.list(),
        patientsApi.list(),
      ])
      const remindersByPatient = await Promise.all(
        patients.map(async (patient) => ({
          patientId: patient.id,
          reminders: await recordatoriosApi.list(patient.id),
        })),
      )

      return {
        agents,
        contacts,
        patients,
        reminders: remindersByPatient.flatMap(({ reminders }) => reminders),
      }
    },
    staleTime: 30 * 1000,
  })

  if (workloadQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Cargando la carga del call center...
        </p>
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

  const { agents, contacts, patients, reminders } = workloadQuery.data
  const patientMap = new Map<string, Patient>(
    patients.map((patient) => [patient.id, patient]),
  )
  const contactMap = new Map<string, Contact>(
    contacts.map((contact) => [contact.id, contact]),
  )
  const groups = new Map<string, WorkloadGroup>(
    agents.map((agent) => [
      agent.id,
      { id: agent.id, name: agent.fullName, contacts: [], reminders: [] },
    ]),
  )
  const unassigned: WorkloadGroup = {
    id: "unassigned",
    name: "Sin agente asignado",
    contacts: [],
    reminders: [],
  }

  contacts
    .filter((contact) => contact.status === "SCHEDULED")
    .forEach((contact) => {
      const group = contact.agentId ? groups.get(contact.agentId) : undefined
      ;(group ?? unassigned).contacts.push(contact)
    })

  reminders
    .filter((reminder) => reminder.status === "PENDIENTE")
    .forEach((reminder) => {
      const agentId = contactMap.get(reminder.contactId)?.agentId
      const group = agentId ? groups.get(agentId) : undefined
      ;(group ?? unassigned).reminders.push(reminder)
    })

  const workloadGroups = [
    ...groups.values(),
    ...(unassigned.contacts.length || unassigned.reminders.length
      ? [unassigned]
      : []),
  ]
  const pendingContacts = workloadGroups.reduce(
    (total, group) => total + group.contacts.length,
    0,
  )
  const pendingReminders = workloadGroups.reduce(
    (total, group) => total + group.reminders.length,
    0,
  )
  const assignedAgents = workloadGroups.filter(
    (group) =>
      group.id !== "unassigned" &&
      (group.contacts.length || group.reminders.length),
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Call center
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Carga de trabajo pendiente, organizada por agente.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Phone className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingContacts}</p>
              <p className="text-muted-foreground text-sm">
                Contactos pendientes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{pendingReminders}</p>
              <p className="text-muted-foreground text-sm">
                Recordatorios pendientes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <Headset className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{assignedAgents}</p>
              <p className="text-muted-foreground text-sm">Agentes con carga</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        {workloadGroups.map((group) => {
          const items = group.contacts.length + group.reminders.length
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
                      {group.contacts.length} contactos
                    </Badge>
                    <Badge variant="secondary">
                      {group.reminders.length} recordatorios
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {items > 0 && (
                <CardContent className="grid p-0 xl:grid-cols-2">
                  <div className="border-b xl:border-r xl:border-b-0">
                    <div className="flex items-center justify-between border-b px-5 py-3">
                      <p className="text-sm font-medium">
                        Contactos programados
                      </p>
                      <Badge variant="outline">{group.contacts.length}</Badge>
                    </div>
                    {group.contacts.length === 0 ? (
                      <p className="text-muted-foreground px-5 py-6 text-sm">
                        No hay contactos pendientes.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {group.contacts
                          .sort((a, b) =>
                            (a.scheduledAt ?? "").localeCompare(
                              b.scheduledAt ?? "",
                            ),
                          )
                          .map((contact) => {
                            const patient = patientMap.get(contact.patientId)
                            return (
                              <button
                                key={contact.id}
                                className="hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                                onClick={() =>
                                  navigate(
                                    `/pacientes/${contact.patientId}/contacto?contactId=${contact.id}`,
                                  )
                                }
                              >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                  <Phone className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {patient?.fullName ??
                                      "Paciente desconocido"}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 text-xs">
                                    {contactTypeLabels[contact.type]} ·{" "}
                                    {contactPurposeLabels[contact.purpose]}
                                  </p>
                                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                    <Calendar className="size-3" />{" "}
                                    {formatDate(contact.scheduledAt)}
                                    <Clock className="ml-1 size-3" />{" "}
                                    {formatTime(contact.scheduledAt)}
                                  </p>
                                </div>
                                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                              </button>
                            )
                          })}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between border-b px-5 py-3">
                      <p className="text-sm font-medium">Recordatorios</p>
                      <Badge variant="outline">{group.reminders.length}</Badge>
                    </div>
                    {group.reminders.length === 0 ? (
                      <p className="text-muted-foreground px-5 py-6 text-sm">
                        No hay recordatorios pendientes.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {group.reminders
                          .sort((a, b) =>
                            a.scheduledDate.localeCompare(b.scheduledDate),
                          )
                          .map((reminder) => {
                            const patient = patientMap.get(reminder.patientId)
                            return (
                              <button
                                key={reminder.id}
                                className="hover:bg-muted/30 flex w-full items-center gap-3 px-5 py-3 text-left transition-colors"
                                onClick={() =>
                                  navigate(`/pacientes/${reminder.patientId}`)
                                }
                              >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                  <CalendarClock className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">
                                    {patient?.fullName ??
                                      "Paciente desconocido"}
                                  </p>
                                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                    {reminder.description}
                                  </p>
                                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                    <Badge
                                      variant="outline"
                                      className="h-5 px-1.5 text-[10px]"
                                    >
                                      {reminderTypeLabels[reminder.type]}
                                    </Badge>
                                    <Calendar className="ml-1 size-3" />{" "}
                                    {formatDate(reminder.scheduledDate)}
                                  </p>
                                </div>
                                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
                              </button>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}
