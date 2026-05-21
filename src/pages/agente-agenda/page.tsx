import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Phone, CalendarClock, PhoneCall, Clock, ArrowRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { contactsApi, agentsApi, patientsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Contact, ContactPurpose, ContactType } from "@/types";

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

export default function AgentAgendaPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list(),
    staleTime: 60 * 1000,
  });

  const agentId = agents.find((a) => a.userId === user?.id)?.id;

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.list(),
    staleTime: 30 * 1000,
  });

  const myContacts = contacts.filter((c) => c.agentId === agentId);
  const pendingCalls = myContacts.filter((c) => c.status === "SCHEDULED");
  const todayContacts = myContacts.filter(
    (c) => isToday(c.scheduledAt) || isToday(c.completedAt),
  );

  function PatientName({ patientId }: { patientId: string }) {
    const { data: patient } = useQuery({
      queryKey: ["patients", patientId],
      queryFn: () => patientsApi.getById(patientId),
      enabled: Boolean(patientId),
      staleTime: 60 * 1000,
    });
    if (!patient) return <span className="text-muted-foreground">—</span>;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/pacientes/${patientId}`);
        }}
        className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate max-w-[180px]"
      >
        {patient.fullName}
      </button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mi agenda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Llamadas pendientes y contactos programados para hoy.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
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
                          <PatientName patientId={contact.patientId} />
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {typeLabels[contact.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
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
                      onClick={() =>
                        navigate(
                          `/pacientes/${contact.patientId}/contacto?contactId=${contact.id}`,
                        )
                      }
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
                          <PatientName patientId={contact.patientId} />
                          <Badge
                            variant={
                              contact.status === "COMPLETED"
                                ? "default"
                                : contact.status === "SCHEDULED"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-[10px] shrink-0"
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
