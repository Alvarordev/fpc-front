import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Bell,
  BrainCircuit,
  CalendarClock,
  FileText,
  Mail,
  MessageSquare,
  PhoneCall,
  Users,
  Video,
} from "lucide-react"
import type { ComponentType } from "react"
import type { PatientTimelineEvent } from "@/api/patient-timeline"

const followUpStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
}
const reminderStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  DONE: "Completado",
  DISMISSED: "Descartado",
}
const typeIcons: Record<string, ComponentType<{ className?: string }>> = {
  CALL: PhoneCall,
  WHATSAPP: MessageSquare,
  VIDEO_CALL: Video,
  EMAIL: Mail,
  IN_PERSON: Users,
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface TimelineEventCardProps {
  event: PatientTimelineEvent
  onClick?: () => void
}

export function TimelineEventCard({ event, onClick }: TimelineEventCardProps) {
  const isFollowUp = event.kind === "FOLLOW_UP"
  const isReminder = event.kind === "REMINDER"
  const isSocialNote = event.kind === "SOCIAL_NOTE"
  const Icon = isFollowUp
    ? (typeIcons[event.type] ?? PhoneCall)
    : isReminder
      ? Bell
      : isSocialNote
        ? FileText
        : BrainCircuit
  const title = isFollowUp
    ? `Seguimiento: ${event.purpose.replaceAll("_", " ")}`
    : isReminder
      ? "Recordatorio"
      : isSocialNote
        ? `Nota: ${event.type === "SOCIAL_WORKER" ? "Trabajo social" : event.type}`
        : `Sesión de psicooncología ${event.sessionNumber}`
  const statusLabel = isSocialNote
    ? "Nota clínica"
    : isReminder
      ? reminderStatusLabels[event.status]
      : followUpStatusLabels[event.status]
  const accent = isFollowUp
    ? "border-l-blue-400"
    : isReminder
      ? "border-l-amber-400"
      : isSocialNote
        ? "border-l-orange-400"
        : "border-l-purple-400"
  const iconColor = isFollowUp
    ? "bg-blue-50 text-blue-600"
    : isReminder
      ? "bg-amber-50 text-amber-600"
      : isSocialNote
        ? "bg-orange-50 text-orange-600"
        : "bg-purple-50 text-purple-600"

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-l-[3px] px-4 py-3",
        accent,
        onClick && "hover:bg-muted/40 cursor-pointer transition-colors",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick ? (event) => event.key === "Enter" && onClick() : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full",
            iconColor,
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <p className="text-sm font-medium">{title}</p>
        <Badge
          className="ml-auto border text-[10px] font-medium"
          variant="outline"
        >
          {statusLabel ?? ("status" in event ? event.status : "")}
        </Badge>
      </div>
      <div className="text-muted-foreground mt-2.5 ml-[35px] flex items-center gap-2 text-xs">
        <CalendarClock className="size-3 shrink-0" />
        <span>{formatDate(event.occurredAt)}</span>
      </div>
      {((isFollowUp && event.notes) ||
        (isReminder && event.description) ||
        (isSocialNote && event.note)) && (
        <p className="text-muted-foreground mt-1.5 ml-[35px] text-xs leading-relaxed">
          {isFollowUp
            ? event.notes
            : isReminder
              ? event.description
              : event.note}
        </p>
      )}
    </div>
  )
}
