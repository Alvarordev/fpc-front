import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneCall,
  BrainCircuit,
  CalendarClock,
  Clock,
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
}

const accentBar = {
  contacto: "border-l-blue-400",
  psico: "border-l-purple-400",
};

const iconBg = {
  contacto: "bg-blue-50 text-blue-600",
  psico: "bg-purple-50 text-purple-600",
};

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const isContact = event.type === "contacto";

  const statusLabel = isContact
    ? contactStatusLabels[event.status] ?? event.status
    : appointmentStatusLabels[event.status] ?? event.status;

  const statusStyle = contactStatusStyles[event.status] ?? "bg-muted text-muted-foreground border-muted";

  const Icon = isContact
    ? (event.meta?.type ? (contactTypeIcons[event.meta.type] ?? Phone) : Phone)
    : BrainCircuit;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card pl-3 pr-4 py-3 border-l-[3px]",
        accentBar[event.type],
      )}
    >
      {/* Header: icon + title + badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full",
            iconBg[event.type],
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <p className="text-sm font-medium text-foreground">{event.title}</p>
        <Badge className={cn("border text-[10px] font-medium ml-auto", statusStyle)}>
          {statusLabel}
        </Badge>
      </div>

      {/* Meta row: date · time · agent */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2.5 ml-[35px]">
        <CalendarClock className="size-3 shrink-0" />
        <span>{formatDate(event.fecha)}</span>
        {event.hora && (
          <>
            <span>·</span>
            <Clock className="size-3 shrink-0" />
            <span>{formatTime(event.hora)}</span>
          </>
        )}
        {event.meta?.agentName && (
          <>
            <span>·</span>
            <span className="truncate">{event.meta.agentName}</span>
          </>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-xs text-muted-foreground mt-1.5 ml-[35px] leading-relaxed line-clamp-3">
          {event.description}
        </p>
      )}
    </div>
  );
}
