import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BrainCircuit, Calendar, CalendarClock, Phone, PhoneCall, Video } from "lucide-react"
import { agentsApi } from "@/api/agents"
import { alertsApi } from "@/api/alerts"
import { followUpsApi } from "@/api/follow-ups"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { volunteersApi } from "@/api/volunteers"
import { patientsApi } from "@/api/patients"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/auth-store"

const TODAY = new Date().toISOString().slice(0, 10)
const typeLabels: Record<string, string> = { CALL: "Llamada", WHATSAPP: "WhatsApp", VIDEO_CALL: "Videollamada", EMAIL: "Email", IN_PERSON: "Presencial", FACEBOOK: "Facebook" }
const purposeLabels: Record<string, string> = { FIRST_CONTACT: "Primer contacto", ENROLLMENT: "Enrolamiento", FOLLOW_UP: "Seguimiento", PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología", OTHER: "Otro" }

function isToday(date: string | null) { return Boolean(date && date.slice(0, 10) === TODAY) }
function formatDate(date: string) { return new Date(date).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }) }
function formatTime(date: string | null) { return date ? new Date(date).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "-" }

export default function AgentAgendaPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const agentsQuery = useQuery({ queryKey: ["agents"], queryFn: agentsApi.list, staleTime: 60_000 })
  const agentId = agentsQuery.data?.find((agent) => agent.userId === user?.id)?.id
  const followUpsQuery = useQuery({ queryKey: ["agent-follow-ups"], queryFn: () => followUpsApi.list(), enabled: Boolean(agentId), staleTime: 30_000 })
  const alertsQuery = useQuery({ queryKey: ["agent-alerts"], queryFn: alertsApi.list, staleTime: 30_000 })
  const sessionsQuery = useQuery({ queryKey: ["agent-upcoming-sessions"], queryFn: () => psychooncologyAppointmentsApi.list({ status: "SCHEDULED" }), staleTime: 30_000 })
  const volunteersQuery = useQuery({ queryKey: ["volunteers"], queryFn: volunteersApi.list, staleTime: 300_000 })
  const followUps = followUpsQuery.data ?? []
  const pendingFollowUps = followUps.filter((item) => item.status === "SCHEDULED")
  const todayFollowUps = followUps.filter((item) => isToday(item.scheduledAt) || isToday(item.completedAt))
  const activeAlerts = (alertsQuery.data ?? []).filter((alert) => alert.status === "ACTIVE")
  const sessions = sessionsQuery.data ?? []
  const volunteers = new Map((volunteersQuery.data ?? []).map((volunteer) => [volunteer.id, volunteer]))

  if (agentsQuery.isLoading || followUpsQuery.isLoading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando agenda...</div>

  return <div className="space-y-6">
    {activeAlerts.length > 0 && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm font-medium text-red-900">{activeAlerts[0].title}</p><p className="text-xs text-red-700">{activeAlerts[0].description}</p></div>}
    <div><h1 className="text-xl font-semibold tracking-tight">Mi agenda</h1><p className="mt-1 text-sm text-muted-foreground">Seguimientos programados y sesiones de psicooncología.</p></div>
    {sessions.length > 0 && <SessionsPanel sessions={sessions} volunteers={volunteers} navigate={navigate} />}
    <div className="grid gap-4 xl:grid-cols-2"><FollowUpPanel title="Pendientes" icon={CalendarClock} items={pendingFollowUps} navigate={navigate} /><FollowUpPanel title="Hoy" icon={Phone} items={todayFollowUps} navigate={navigate} /></div>
  </div>
}

function FollowUpPanel({ title, icon: Icon, items, navigate }: { title: string; icon: typeof Phone; items: Awaited<ReturnType<typeof followUpsApi.list>>; navigate: ReturnType<typeof useNavigate> }) {
  return <Card className="overflow-hidden"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><span className="flex size-8 items-center justify-center rounded-full bg-amber-50"><Icon className="size-4 text-amber-600" /></span>{title}</CardTitle><Badge variant="secondary">{items.length}</Badge></div></CardHeader><CardContent className="p-0">{items.length === 0 ? <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground"><PhoneCall className="size-8 opacity-30" /><p className="text-sm">No hay seguimientos para mostrar</p></div> : <div className="divide-y">{items.sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "")).map((followUp) => <PatientRow key={followUp.id} patientName={followUp.subjectPatientName ?? "Paciente desconocido"} icon={Phone} title={typeLabels[followUp.type]} meta={`${purposeLabels[followUp.purpose]} · ${followUp.scheduledAt ? `${formatDate(followUp.scheduledAt)} ${formatTime(followUp.scheduledAt)}` : "Sin fecha"}`} onClick={() => navigate(`/pacientes/${followUp.subjectPatientId}/contacto?followUpId=${followUp.id}`)} />)}</div>}</CardContent></Card>
}

function SessionsPanel({ sessions, volunteers, navigate }: { sessions: Awaited<ReturnType<typeof psychooncologyAppointmentsApi.list>>; volunteers: Map<string, Awaited<ReturnType<typeof volunteersApi.list>>[number]>; navigate: ReturnType<typeof useNavigate> }) {
  const patientsQuery = useQuery({ queryKey: ["agenda-session-patients"], queryFn: () => patientsApi.list({ limit: 100 }), staleTime: 60_000 })
  const names = new Map((patientsQuery.data?.data ?? []).map((patient) => [patient.id, patient.fullName]))
  return <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-base"><BrainCircuit className="size-4 text-purple-600" />Sesiones de psicooncología pendientes</CardTitle><Badge variant="secondary">{sessions.length}</Badge></div><CardDescription>Recordatorios para contactar a los pacientes antes de su sesión.</CardDescription></CardHeader><CardContent className="divide-y p-0">{sessions.map((session) => { const volunteer = volunteers.get(session.volunteerId); return <PatientRow key={session.id} patientName={names.get(session.patientId) ?? "Paciente desconocido"} icon={session.modality === "VIDEO_CALL" ? Video : Phone} title={`Sesión ${session.sessionNumber}`} meta={`${volunteer ? `${volunteer.firstName} ${volunteer.lastName} · ` : ""}${formatDate(session.scheduledAt)} ${formatTime(session.scheduledAt)}`} onClick={() => navigate(`/pacientes/${session.patientId}`)} /> })}</CardContent></Card>
}

function PatientRow({ patientName, icon: Icon, title, meta, onClick }: { patientName: string; icon: typeof Phone; title: string; meta: string; onClick: () => void }) {
  return <button className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/30" onClick={onClick}><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50"><Icon className="size-4 text-blue-600" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{patientName}</p><p className="mt-1 text-xs text-muted-foreground">{title}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3" />{meta}</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></button>
}
