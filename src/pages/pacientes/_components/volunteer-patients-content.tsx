import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Phone, Video, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appointmentsApi, patientsApi } from "@/lib/api";
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile";
import type {
  Patient,
  AppointmentStatus,
} from "@/types";

// --- Status styling ---

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  COMPLETED:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  CANCELLED:
    "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  NO_ANSWER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

// --- Helpers ---

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// --- Component ---

export function VolunteerPatientsContent() {
  const navigate = useNavigate();
  const { volunteerId, isLoading: loadingProfile } =
    useVolunteerProfile();

  // Fetch all appointments for this volunteer
  const {
    data: appointments = [],
    isLoading: loadingAppointments,
  } = useQuery({
    queryKey: ["volunteerAppointments", volunteerId],
    queryFn: () =>
      appointmentsApi.list({ volunteerId: volunteerId! }),
    enabled: Boolean(volunteerId),
  });

  // Only SCHEDULED or COMPLETED count for "mis pacientes"
  const relevantAppointments = appointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "COMPLETED",
  );

  // Extract unique patient IDs
  const patientIds = [
    ...new Set(relevantAppointments.map((a) => a.patientId)),
  ];

  // Fetch patients by ID
  const {
    data: patientsMap = new Map<string, Patient>(),
    isLoading: loadingPatients,
  } = useQuery({
    queryKey: ["volunteerPatients", patientIds],
    queryFn: async (): Promise<Map<string, Patient>> => {
      if (patientIds.length === 0) return new Map();
      const results = await Promise.all(
        patientIds.map((id) => patientsApi.getById(id)),
      );
      const map = new Map<string, Patient>();
      for (const p of results) {
        map.set(p.id, p);
      }
      return map;
    },
    enabled: patientIds.length > 0,
  });

  const myPatients = [...patientsMap.values()];

  // Upcoming scheduled sessions
  const upcomingSessions = appointments
    .filter(
      (a) =>
        a.scheduledAt.slice(0, 10) >= TODAY &&
        a.status === "SCHEDULED",
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const isLoading =
    loadingProfile || loadingAppointments || loadingPatients;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Mis Pacientes
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {myPatients.length} paciente
          {myPatients.length !== 1 ? "s" : ""} asignado
          {myPatients.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Próximas sesiones
          </h2>
          <div className="space-y-2">
            {upcomingSessions.map((session) => {
              const patient = patientsMap.get(session.patientId);
              const patientName =
                patient?.fullName ?? "Paciente desconocido";
              const initials = getInitials(patientName);
              const sessionLabel =
                session.sessionNumber === 0
                  ? "Sesión extra"
                  : `Sesión ${session.sessionNumber}`;

              return (
                <Card
                  key={session.id}
                  className="border-border/60"
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">
                          {patientName}
                        </p>
                        <Badge
                          className={cn(
                            "border text-xs font-medium",
                            STATUS_STYLES[session.status],
                          )}
                        >
                          {STATUS_LABELS[session.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sessionLabel}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {session.modality === "CALL" ? (
                          <Phone className="size-3 shrink-0" />
                        ) : (
                          <Video className="size-3 shrink-0" />
                        )}
                        <CalendarDays className="size-3 shrink-0 ml-1" />
                        <span className="capitalize">
                          {formatDate(session.scheduledAt)}
                        </span>
                        <span>·</span>
                        <span>
                          {session.scheduledAt.slice(11, 16)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 text-xs h-8"
                      onClick={() =>
                        navigate(
                          `/pacientes/${session.patientId}`,
                        )
                      }
                    >
                      Ver perfil
                      <ArrowRight className="size-3" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* All my patients grid */}
      {myPatients.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Todos mis pacientes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myPatients.map((patient) => {
              const patientSessions = relevantAppointments.filter(
                (a) => a.patientId === patient.id,
              );
              const completedCount = patientSessions.filter(
                (a) => a.status === "COMPLETED",
              ).length;
              const nextSession = patientSessions
                .filter(
                  (a) =>
                    a.scheduledAt.slice(0, 10) >= TODAY &&
                    a.status === "SCHEDULED",
                )
                .sort((a, b) =>
                  a.scheduledAt.localeCompare(b.scheduledAt),
                )[0];

              const initials = getInitials(patient.fullName);

              return (
                <Card
                  key={patient.id}
                  className="border-border/60 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    navigate(`/pacientes/${patient.id}`)
                  }
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {completedCount} sesión
                        {completedCount !== 1 ? "es" : ""}{" "}
                        completada
                        {completedCount !== 1 ? "s" : ""}
                        {nextSession && (
                          <>
                            {" "}
                            · Próxima:{" "}
                            {formatShortDate(
                              nextSession.scheduledAt,
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {myPatients.length === 0 &&
        upcomingSessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tienes pacientes asignados aún.
          </p>
        )}
    </div>
  );
}
