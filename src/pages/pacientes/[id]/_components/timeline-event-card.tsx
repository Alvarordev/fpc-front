import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneCall,
  BrainCircuit,
  CalendarClock,
  MessageSquare,
  Video,
  Mail,
  Users,
} from "lucide-react";
import type { TimelineEvent } from "../_utils/timeline";

const contactStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
};

const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

const contactStatusStyles: Record<string, string> = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  NO_ANSWER: "bg-red-50 text-red-700 border-red-200",
};

const contactTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: PhoneCall,
  WHATSAPP: MessageSquare,
  VIDEO_CALL: Video,
  EMAIL: Mail,
  IN_PERSON: Users,
};

function formatDate(fecha: string): string {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(hora?: string | null): string {
  if (!hora) return "";
  return hora;
}

interface TimelineEventCardProps {
  event: TimelineEvent;
  isLast: boolean;
}

export function TimelineEventCard({ event, isLast }: TimelineEventCardProps) {
  const isContact = event.type === "contacto";

  const statusLabel = isContact
    ? contactStatusLabels[event.status] ?? event.status
    : appointmentStatusLabels[event.status] ?? event.status;

  const statusStyle = contactStatusStyles[event.status] ?? "bg-muted text-muted-foreground border-muted";

  const Icon = isContact
    ? (event.meta?.type ? (contactTypeIcons[event.meta.type] ?? Phone) : Phone)
    : BrainCircuit;

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          "relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full border",
          isContact ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200",
        )}
      >
        <Icon
          className={cn(
            "size-3",
            isContact ? "text-blue-600" : "text-purple-600",
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{event.title}</p>
          <Badge className={cn("border text-[10px] font-medium", statusStyle)}>
            {statusLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <CalendarClock className="size-3" />
          <span>{formatDate(event.fecha)}</span>
          {event.hora && (
            <>
              <span>·</span>
              <span>{formatTime(event.hora)}</span>
            </>
          )}
          {event.meta?.agentName && (
            <>
              <span>·</span>
              <span>{event.meta.agentName}</span>
            </>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
