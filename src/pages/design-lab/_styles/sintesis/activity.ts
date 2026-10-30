import { BellRing, CheckCircle2, FileText, HeartHandshake, History, PhoneMissed, type LucideIcon } from "lucide-react"
import {
  channelText,
  deliveryStatus,
  followUpStatus,
  psychoStatus,
  type MockPatient,
  type Tone,
} from "../../_data/mock-patient"

// Actividad reciente: lo que ya pasó con el paciente, de cualquier módulo, con
// su estado. Es lo primero que necesita el agente para saber cómo seguir.

export type ActivityKind = "seguimiento" | "psico" | "recordatorio" | "documento" | "cambio"

export type Activity = {
  id: string
  kind: ActivityKind
  date: string
  title: string
  detail?: string
  status?: { label: string; tone: Tone }
  icon: LucideIcon
  tone: Tone
}

export function recentActivity(p: MockPatient): Activity[] {
  const items: Activity[] = [
    ...p.followUps
      .filter((f) => f.status === "DONE" || f.status === "NOT_REACHED")
      .map((f) => ({
        id: f.id,
        kind: "seguimiento" as const,
        date: f.date,
        title: f.purpose,
        detail: [f.result, f.note].filter(Boolean).join(". ") || `${f.modality}, sin respuesta tras ${f.attempts} intentos`,
        status: followUpStatus[f.status],
        icon: f.status === "DONE" ? CheckCircle2 : PhoneMissed,
        tone: (f.status === "DONE" ? "green" : "red") as Tone,
      })),
    ...p.psycho.sessions
      .filter((s) => s.status !== "SCHEDULED")
      .map((s) => ({
        id: s.id,
        kind: "psico" as const,
        date: s.date,
        title: `Sesión ${s.number} de psicooncología`,
        detail: `${s.beneficiary}, con ${s.volunteer}`,
        status: psychoStatus[s.status],
        icon: HeartHandshake,
        tone: (s.status === "DONE" ? "violet" : "red") as Tone,
      })),
    ...p.reminders
      .filter((r) => r.done)
      .map((r) => ({
        id: r.id,
        kind: "recordatorio" as const,
        date: r.date,
        title: `Recordatorio: ${r.title.toLowerCase()}`,
        detail: `Por ${channelText(r.channel)}`,
        status: deliveryStatus[r.delivery],
        icon: BellRing,
        tone: (r.delivery === "FAILED" ? "red" : "amber") as Tone,
      })),
    ...p.documents.map((d) => ({
      id: d.id,
      kind: "documento" as const,
      date: d.date,
      title: `Documento subido: ${d.name}`,
      detail: `${d.category}, por ${d.uploadedBy}`,
      icon: FileText,
      tone: "blue" as Tone,
    })),
    ...p.changeLog.map((c) => ({
      id: c.id,
      kind: "cambio" as const,
      date: c.date,
      title: c.what,
      detail: c.who,
      icon: History,
      tone: "gray" as Tone,
    })),
  ]
  return items.sort((a, b) => b.date.localeCompare(a.date))
}
