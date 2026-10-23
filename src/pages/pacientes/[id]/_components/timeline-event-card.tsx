import type { ComponentType } from "react"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PatientTimelineEvent } from "@/api/patient-timeline"
import {
  followUpStatusLabels,
  followUpTypeLabels,
  formatFollowUpTitle,
} from "@/lib/follow-up-labels"
import { FollowUpOutcomes } from "./follow-up-outcomes"

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

const socialNoteLabels: Record<string, string> = {
  SOCIAL_WORKER: "Trabajo social",
  CONADIS: "CONADIS",
  FISSAL: "FISSAL",
}

const statusStyles = {
  scheduled: {
    card: "border-amber-200/90 bg-amber-50/45",
    accent: "border-l-amber-400",
    icon: "bg-amber-100 text-amber-700",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
  },
  completed: {
    card: "bg-card",
    accent: "border-l-emerald-400",
    icon: "bg-emerald-50 text-emerald-600",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  noAnswer: {
    card: "border-orange-200/90 bg-orange-50/45",
    accent: "border-l-orange-400",
    icon: "bg-orange-100 text-orange-700",
    badge: "border-orange-200 bg-orange-50 text-orange-800",
  },
  cancelled: {
    card: "bg-muted/35",
    accent: "border-l-slate-300",
    icon: "bg-muted text-muted-foreground",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
  pending: {
    card: "border-amber-200/80 bg-amber-50/35",
    accent: "border-l-amber-400",
    icon: "bg-amber-50 text-amber-600",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  dismissed: {
    card: "bg-muted/25",
    accent: "border-l-slate-300",
    icon: "bg-muted text-muted-foreground",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
  neutral: {
    card: "bg-card",
    accent: "border-l-slate-300",
    icon: "bg-slate-50 text-slate-600",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
} as const

type StatusTone = keyof typeof statusStyles

function formatDate(date: string): string {
  return new Date(date).toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusTone(event: PatientTimelineEvent): StatusTone {
  if (event.kind === "SOCIAL_NOTE") return "neutral"
  if (event.status === "SCHEDULED" || event.status === "PENDING") {
    return "scheduled"
  }
  if (event.status === "COMPLETED" || event.status === "DONE") {
    return "completed"
  }
  if (event.status === "NO_ANSWER") return "noAnswer"
  if (event.status === "CANCELLED") return "cancelled"
  if (event.status === "DISMISSED") return "dismissed"
  return "neutral"
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
    ? formatFollowUpTitle(event.type, event.purpose)
    : isReminder
      ? "Recordatorio"
      : isSocialNote
        ? `Nota · ${socialNoteLabels[event.type] ?? event.type}`
        : `Sesión de psicooncología ${event.sessionNumber}`
  const statusLabel = isFollowUp
    ? followUpStatusLabels[event.status]
    : isReminder
      ? reminderStatusLabels[event.status]
      : isSocialNote
        ? "Nota clínica"
        : followUpStatusLabels[event.status]
  const detail = isFollowUp
    ? `Canal · ${followUpTypeLabels[event.type]}`
    : isReminder
      ? "Recordatorio"
      : isSocialNote
        ? "Registro social"
        : event.modality === "VIDEO_CALL"
          ? "Videollamada"
          : "Llamada"
  const tone = getStatusTone(event)
  const style = statusStyles[tone]
  const note = isFollowUp
    ? event.notes
    : isReminder
      ? event.description
      : isSocialNote
        ? event.note
        : undefined

  return (
    <div
      className={cn(
        "rounded-xl border border-l-[3px] px-4 py-4 sm:px-5",
        style.card,
        style.accent,
        onClick &&
          "hover:border-r-primary/20 hover:bg-muted/30 focus-visible:ring-ring/50 cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-sm focus-visible:ring-3 focus-visible:outline-none active:translate-y-px",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Abrir ${title}` : undefined}
      onKeyDown={
        onClick
          ? (keyboardEvent) => {
              if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                keyboardEvent.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            style.icon,
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold sm:text-base">{title}</p>
            <Badge
              className={cn("border text-[10px] font-medium", style.badge)}
              variant="outline"
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
        </div>
      </div>
      <div className="text-muted-foreground mt-3 ml-12 flex items-center gap-2 text-xs sm:ml-12 sm:text-sm">
        <CalendarClock className="size-3.5 shrink-0" />
        <span>{formatDate(event.occurredAt)}</span>
      </div>
      {note && (
        <p className="text-muted-foreground bg-background/70 mt-3 ml-12 rounded-lg px-3 py-2.5 text-sm leading-relaxed sm:ml-12">
          {note}
        </p>
      )}
      {isFollowUp && <FollowUpOutcomes outcomes={event.outcomes} limit={3} />}
    </div>
  )
}
