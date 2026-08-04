import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Bell, BrainCircuit, CalendarClock, Mail, MessageSquare, PhoneCall, Users, Video } from "lucide-react"
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
  return new Date(date).toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface TimelineEventCardProps {
  event: PatientTimelineEvent
  onClick?: () => void
}

export function TimelineEventCard({ event, onClick }: TimelineEventCardProps) {
  const isFollowUp = event.kind === "FOLLOW_UP"
  const isReminder = event.kind === "REMINDER"
  const Icon = isFollowUp ? typeIcons[event.type] ?? PhoneCall : isReminder ? Bell : BrainCircuit
  const title = isFollowUp
    ? `Seguimiento: ${event.purpose.replaceAll("_", " ")}`
    : isReminder
      ? "Recordatorio"
      : `Sesión de psicooncología ${event.sessionNumber}`
  const statusLabel = isReminder ? reminderStatusLabels[event.status] : followUpStatusLabels[event.status]
  const accent = isFollowUp ? "border-l-blue-400" : isReminder ? "border-l-amber-400" : "border-l-purple-400"
  const iconColor = isFollowUp ? "bg-blue-50 text-blue-600" : isReminder ? "bg-amber-50 text-amber-600" : "bg-purple-50 text-purple-600"

  return (
    <div
      className={cn("rounded-lg border border-l-[3px] bg-card px-4 py-3", accent, onClick && "cursor-pointer transition-colors hover:bg-muted/40")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => event.key === "Enter" && onClick() : undefined}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", iconColor)}><Icon className="size-3.5" /></div>
        <p className="text-sm font-medium">{title}</p>
        <Badge className="ml-auto border text-[10px] font-medium" variant="outline">{statusLabel ?? event.status}</Badge>
      </div>
      <div className="mt-2.5 ml-[35px] flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="size-3 shrink-0" />
        <span>{formatDate(event.occurredAt)}</span>
      </div>
      {((isFollowUp && event.notes) || (isReminder && event.description)) && (
        <p className="mt-1.5 ml-[35px] text-xs leading-relaxed text-muted-foreground">
          {isFollowUp ? event.notes : event.description}
        </p>
      )}
    </div>
  )
}
