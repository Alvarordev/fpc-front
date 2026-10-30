import {
  Ban,
  Bug,
  CircleHelp,
  Palette,
  PencilRuler,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { Tone } from "@/components/ds/tone"
import type {
  SupportTicketStatus,
  SupportTicketType,
} from "@/api/support-tickets"

export const ticketTypeMeta: Record<
  SupportTicketType,
  { label: string; hint: string; icon: LucideIcon; tone: Tone }
> = {
  BLOCKING_BUG: { label: "Error bloqueante", hint: "No me deja trabajar", icon: Ban, tone: "red" },
  FUNCTIONAL_BUG: { label: "Error", hint: "Algo no funciona bien", icon: Bug, tone: "rose" },
  VISUAL_BUG: { label: "Error visual", hint: "Se ve mal o desordenado", icon: Palette, tone: "indigo" },
  CHANGE_REQUEST: { label: "Cambio", hint: "Modificar algo que ya existe", icon: PencilRuler, tone: "blue" },
  NEW_FEATURE: { label: "Nueva funcionalidad", hint: "Algo que aún no existe", icon: Sparkles, tone: "teal" },
  QUESTION: { label: "Consulta", hint: "Tengo una duda", icon: CircleHelp, tone: "gray" },
}

export const ticketTypeOrder = Object.keys(ticketTypeMeta) as SupportTicketType[]

export const ticketStatusMeta: Record<SupportTicketStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Recibido", tone: "amber" },
  IN_REVIEW: { label: "En revisión", tone: "blue" },
  NEEDS_MEETING: { label: "Requiere reunión", tone: "violet" },
  COMPLETED: { label: "Completado", tone: "green" },
  DISMISSED: { label: "Descartado", tone: "gray" },
}

export const ticketStatusOrder = Object.keys(ticketStatusMeta) as SupportTicketStatus[]

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatTicketDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}
