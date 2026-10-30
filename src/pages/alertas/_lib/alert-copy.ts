import type { LucideIcon } from "lucide-react"
import { CheckCircle, Clock, Link2, Mail, MessageSquare, Share2, Sparkles, TriangleAlert } from "lucide-react"
import type { Alert, AlertEvent } from "@/api/alerts"
import type { Tone } from "@/components/ds/tone"

export const alertStatusLabels: Record<Alert["status"] | "all", string> = {
  REPORTED: "Reportadas",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resueltas",
  all: "Todas",
}

export const alertStatusChip: Record<Alert["status"], { label: string; tone: Tone }> = {
  REPORTED: { label: "Reportada", tone: "red" },
  IN_REVIEW: { label: "En revisión", tone: "amber" },
  RESOLVED: { label: "Resuelta", tone: "green" },
}

export const alertSeverityChip: Record<Alert["severity"], { label: string; tone: Tone }> = {
  HIGH: { label: "Alta", tone: "red" },
  MEDIUM: { label: "Media", tone: "amber" },
  LOW: { label: "Baja", tone: "gray" },
}

const EVENT_META: Record<AlertEvent["eventType"], { label: string; icon: LucideIcon; tone: Tone }> = {
  CREATED: { label: "Registrada", icon: TriangleAlert, tone: "red" },
  STATUS_CHANGED: { label: "Cambió de estado", icon: Clock, tone: "amber" },
  DERIVED: { label: "Derivada", icon: Share2, tone: "violet" },
  COMMENT: { label: "Comentario", icon: MessageSquare, tone: "blue" },
  AI_SUMMARY_GENERATED: { label: "Resumen generado", icon: Sparkles, tone: "violet" },
  RESOLVED: { label: "Resuelta", icon: CheckCircle, tone: "green" },
  REPORT_LINKED: { label: "Reporte vinculado", icon: Link2, tone: "blue" },
  PATIENTS_NOTIFIED: { label: "Pacientes avisados", icon: Mail, tone: "green" },
}

export function eventMeta(type: AlertEvent["eventType"]) {
  return EVENT_META[type] ?? { label: "Actualización", icon: Clock, tone: "gray" as const }
}

export function relativeAge(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff) || diff < 0) return "hace un momento"
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "hace un momento"
  if (min < 60) return `hace ${min} min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? "hace 1 día" : `hace ${days} días`
}

export function formatAlertDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return iso
  return date.toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
