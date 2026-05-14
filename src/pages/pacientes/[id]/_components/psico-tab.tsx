import { CalendarPlus, BrainCircuit, PhoneCall, Video, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { usePatientAppointments, useVolunteers } from "../_hooks/use-appointments";

const TOTAL_DEFAULT_SESSIONS = 4;

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200",
};

const modalityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: PhoneCall,
  VIDEO_CALL: Video,
};

const modalityLabels: Record<string, string> = {
  CALL: "Llamada",
  VIDEO_CALL: "Videollamada",
};

function sessionLabel(num: number): string {
  if (num <= TOTAL_DEFAULT_SESSIONS) return `Sesión ${num}`;
  return `Extra ${num - TOTAL_DEFAULT_SESSIONS}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

interface PsicoTabProps {
  pacienteId: string;
}

export function PsicoTab({ pacienteId }: PsicoTabProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const canManage = role === "ADMIN" || role === "AGENT";

  const { data: appointments = [], isLoading } = usePatientAppointments(pacienteId);
  const { data: volunteers = [] } = useVolunteers();

  const sorted = [...appointments].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const totalSlots = Math.max(TOTAL_DEFAULT_SESSIONS, sorted.length);
  const placeholderSlots = Array.from(
    { length: Math.max(0, totalSlots - sorted.length) },
    (_, i) => sorted.length + i + 1,
  );

  function getVolunteerName(volunteerId: string): string {
    const v = volunteers.find((vol) => vol.id === volunteerId);
    return v ? `${v.firstName} ${v.lastName}` : "Voluntario";
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Sesiones de psicooncología
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sorted.length} de {totalSlots} sesiones agendadas
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5 shrink-0">
            <CalendarPlus className="size-4" />
            Agendar sesión
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-muted-foreground">Cargando sesiones...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-2">
          <p className="text-sm font-medium text-foreground">
            Sin sesiones agendadas
          </p>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            {canManage
              ? "Agendá la primera sesión de psicooncología para este paciente."
              : "No hay sesiones registradas aún."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-4 min-w-max">
            {sorted.map((a) => {
              const ModalityIcon = modalityIcons[a.modality] ?? Calendar;
              const isCompleted = a.status === "COMPLETED";

              return (
                <div
                  key={a.id}
                  className={cn(
                    "min-w-60 max-w-70 shrink-0 rounded-xl border p-4 space-y-3",
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50/50"
                      : a.status === "SCHEDULED"
                        ? "border-blue-200 bg-blue-50/50"
                        : "border-border/60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <BrainCircuit className="size-4 text-purple-600" />
                    <Badge
                      className={cn(
                        "border text-[10px] font-medium",
                        statusStyles[a.status],
                      )}
                    >
                      {statusLabels[a.status]}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{sessionLabel(a.sessionNumber)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getVolunteerName(a.volunteerId)}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <ModalityIcon className="size-3" />
                      <span>{modalityLabels[a.modality] ?? a.modality}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      <span>{formatDate(a.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>{formatTime(a.scheduledAt)}</span>
                    </div>
                  </div>

                  {a.topicAddressed && (
                    <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                      {a.topicAddressed}
                    </p>
                  )}
                </div>
              );
            })}

            {placeholderSlots.map((num) => (
              <div
                key={`placeholder-${num}`}
                className={cn(
                  "min-w-60 max-w-70 shrink-0 rounded-xl border-2 border-dashed border-border/50",
                  "flex flex-col items-center justify-center gap-1.5 py-8 px-4 text-center",
                )}
              >
                <p className="text-xs font-semibold text-muted-foreground/70">
                  {sessionLabel(num)}
                </p>
                <p className="text-xs text-muted-foreground/50">Pendiente</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
