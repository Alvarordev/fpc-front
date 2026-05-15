import { useNavigate } from "react-router-dom";
import { Phone, Video, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PsychooncologyAppointment } from "@/types";

interface AgendaSessionCardProps {
  appointment: PsychooncologyAppointment;
  patientName: string;
  isToday?: boolean;
  onComplete?: (appointment: PsychooncologyAppointment) => void;
}

const STATUS_STYLES: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

const STATUS_LABELS: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export function AgendaSessionCard({
  appointment,
  patientName,
  isToday,
  onComplete,
}: AgendaSessionCardProps) {
  const navigate = useNavigate();

  const sessionLabel =
    appointment.sessionNumber === 0 || !appointment.sessionNumber
      ? "Sesión extra"
      : `Sesión ${appointment.sessionNumber}`;

  const isScheduled = appointment.status === "SCHEDULED";

  return (
    <Card
      className={cn(
        "border-border/60 transition-colors",
        isToday && "ring-primary/30 ring-2",
      )}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
          {appointment.modality === "CALL" ? (
            <Phone className="size-4" />
          ) : (
            <Video className="size-4" />
          )}
        </div>

        <button
          type="button"
          className="hover:bg-muted/30 min-w-0 flex-1 space-y-1 rounded-md px-1 py-0.5 text-left transition-colors"
          onClick={() => navigate(`/pacientes/${appointment.patientId}`)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground truncate text-sm font-medium">
              {patientName}
            </p>
            <Badge
              className={cn(
                "border text-xs font-medium",
                STATUS_STYLES[appointment.status],
              )}
            >
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">{sessionLabel}</p>
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarDays className="size-3 shrink-0" />
            <span className="capitalize">
              {formatDate(appointment.scheduledAt)}
            </span>
            <span>·</span>
            <span>{formatTime(appointment.scheduledAt)}</span>
          </div>
        </button>

        {isScheduled && onComplete && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(appointment);
            }}
          >
            Registrar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
