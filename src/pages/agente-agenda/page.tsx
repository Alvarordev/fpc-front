import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Phone,
  CalendarClock,
  PhoneCall,
  Clock,
  ArrowRight,
  Calendar,
  BrainCircuit,
  Video,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { alertsApi, appointmentsApi, contactsApi, agentsApi, patientsApi, volunteersApi } from "@/lib/api";
import { AlertBanner } from "@/pages/pacientes/[id]/_components/alert-banner";
import { cn } from "@/lib/utils";
import type { Alert, ContactPurpose, ContactType, PsychooncologyAppointment, Volunteer } from "@/types";

const TODAY = new Date().toISOString().slice(0, 10);

const typeLabels: Record<ContactType, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Email",
  IN_PERSON: "Presencial",
};

const purposeLabels: Record<ContactPurpose, string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
};

function formatTime(datetime: string | null): string {
  if (!datetime) return "—";
  return datetime.slice(11, 16);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === TODAY;
}

function sessionLabel(num: number): string {
  if (num <= 4) return `Sesión ${num}`;
  return `Extra ${num - 4}`;
}

export default function AgentAgendaPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // ── Agent lookup ──
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  });
  const agentId = agents.find((a) => a.userId === user?.id)?.id;

  // ── Contacts ──
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.list(),
    staleTime: 30 * 1000,
  });
  const myContacts = contacts.filter((c) => c.agentId === agentId);
  const pendingCalls = myContacts.filter((c) => c.status === "SCHEDULED");
  const todayContacts = myContacts.filter(
    (c) => isToday(c.scheduledAt) || isToday(c.completedAt),
  );

  // ── Active alerts ──
  const { data: activeAlerts = [] } = useQuery<Alert[]>({
    queryKey: ["agentAlerts"],
    queryFn: () => alertsApi.list({ status: "ACTIVE" }),
    staleTime: 30 * 1000,
  });

  // ── Pending psycho sessions ──
  const { data: upcomingSessions = [] } = useQuery<PsychooncologyAppointment[]>({
    queryKey: ["agentUpcomingSessions"],
    queryFn: () => appointmentsApi.list({ upcoming: true }),
    staleTime: 30 * 1000,
  });
  const pendingSessions = upcomingSessions.filter((s) => s.status === "SCHEDULED");

  // ── Volunteers (for session names) ──
  const { data: volunteers = [] } = useQuery<Volunteer[]>({
    queryKey: ["agentVolunteers"],
    queryFn: () => volunteersApi.list(),
    staleTime: 5 * 60 * 1000,
  });
  const volunteerMap = new Map(volunteers.map((v) => [v.id, v]));

  // ── Patient info component ──
  function PatientInfo({ patientId }: { patientId: string }) {
    const { data: patient } = useQuery({
      queryKey: ["patients", patientId],
      queryFn: () => patientsApi.getById(patientId),
      enabled: Boolean(patientId),
      staleTime: 60 * 1000,
    });
    if (!patient) return null;

    return (
      <div className="min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/pacientes/${patientId}`);
          }}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px] block text-left"
        >
          {patient.fullName}
        </button>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Phone className="size-3" />
          {patient.primaryPhone}
        </p>
      </div>
    );
  }

  // ── Patient name (simple lookup for session cards) ──
  function PatientName({ patientId }: { patientId: string }) {
    const { data: patient } = useQuery({
      queryKey: ["patients", patientId],
      queryFn: () => patientsApi.getById(patientId),
      enabled: Boolean(patientId),
      staleTime: 60 * 1000,
    });
    if (!patient) return <span className="text-sm">Paciente desconocido</span>;
    return (
      <span className="text-sm font-medium truncate">{patient.fullName}</span>
    );
  }

  if (contactsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ ALERTS BANNER ═══ */}
      {activeAlerts.length > 0 && <AlertBanner alerts={activeAlerts} />}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mi agenda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Llamadas pendientes, contactos programados y sesiones de psicooncología.
        </p>
      </div>

      {/* ═══ PENDING SESSIONS ═══ */}
      {pendingSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit className="size-4 text-purple-600" />
                Sesiones de psicooncología pendientes
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {pendingSessions.length}
              </Badge>
            </div>
            <CardDescription>
              Recordatorios para contactar a los pacientes antes de su sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {pendingSessions.map((s) => {
                const volunteer = volunteerMap.get(s.volunteerId);
                const ModalityIcon = s.modality === "VIDEO_CALL" ? Video : Phone;

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                      <ModalityIcon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <PatientName patientId={s.patientId} />
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <BrainCircuit className="size-3" />
                          {sessionLabel(s.sessionNumber)}
                        </span>
                        {volunteer && (
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {volunteer.firstName} {volunteer.lastName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(s.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTime(s.scheduledAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/pacientes/${s.patientId}`);
                      }}
                    >
                      Ver paciente
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ CONTACT CARDS ═══ */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Pendientes */}
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-50">
                  <CalendarClock className="size-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Pendientes</CardTitle>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {pendingCalls.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <PhoneCall className="size-8 opacity-30" />
                <p className="text-sm">No hay llamadas pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {pendingCalls
                  .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))
                  .map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() =>
                        navigate(
                          `/pacientes/${contact.patientId}/contacto?contactId=${contact.id}`,
                        )
                      }
                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 group-hover:bg-amber-100 transition-colors">
                        <Phone className="size-4 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PatientInfo patientId={contact.patientId} />
                          <Badge variant="outline" className="text-[10px] shrink-0 self-start mt-0.5">
                            {typeLabels[contact.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          <span>{formatDate(contact.scheduledAt ?? "")}</span>
                          <span>·</span>
                          <Clock className="size-3" />
                          <span>{formatTime(contact.scheduledAt)}</span>
                          {contact.purpose && (
                            <>
                              <span>·</span>
                              <span>{purposeLabels[contact.purpose]}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hoy */}
        <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-50">
                  <Phone className="size-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Hoy</CardTitle>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {todayContacts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {todayContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <CalendarClock className="size-8 opacity-30" />
                <p className="text-sm">No hay contactos para hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                  {todayContacts
                    .sort((a, b) => (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? ""))
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          if (contact.status === "COMPLETED") {
                            navigate(`/pacientes/${contact.patientId}`);
                          } else {
                            navigate(
                              `/pacientes/${contact.patientId}/contacto?contactId=${contact.id}`,
                            );
                          }
                        }}

                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          contact.status === "COMPLETED"
                            ? "bg-emerald-50"
                            : contact.status === "NO_ANSWER"
                              ? "bg-zinc-100"
                              : "bg-blue-50",
                        )}
                      >
                        <PhoneCall
                          className={cn(
                            "size-4",
                            contact.status === "COMPLETED"
                              ? "text-emerald-600"
                              : contact.status === "NO_ANSWER"
                                ? "text-zinc-500"
                                : "text-blue-600",
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <PatientInfo patientId={contact.patientId} />
                          <Badge
                            variant={
                              contact.status === "COMPLETED"
                                ? "default"
                                : contact.status === "SCHEDULED"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-[10px] shrink-0 self-start mt-0.5"
                          >
                            {contact.status === "COMPLETED"
                              ? "Completado"
                              : contact.status === "SCHEDULED"
                                ? "Agendado"
                                : contact.status === "CANCELLED"
                                  ? "Cancelado"
                                  : "No contestó"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          <span>
                            {formatTime(contact.scheduledAt)}
                          </span>
                          <span>·</span>
                          <span>{typeLabels[contact.type]}</span>
                        </div>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
