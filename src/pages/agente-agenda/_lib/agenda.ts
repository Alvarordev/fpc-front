import type { FollowUp } from "@/api/follow-ups"
import type { Reminder } from "@/api/reminders"

export const followUpTypeLabels: Record<FollowUp["type"], string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Correo electrónico",
  IN_PERSON: "Presencial",
  FACEBOOK: "Facebook",
}

export const followUpPurposeLabels: Record<FollowUp["purpose"], string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
}

export type AgendaEvent =
  | {
      id: string
      kind: "follow-up"
      patientId: string
      patientName: string
      startsAt: string
      title: string
      detail: string
      followUp: FollowUp
    }
  | {
      id: string
      kind: "reminder"
      patientId: string
      patientName: string
      startsAt: string
      title: string
      detail: string
      reminder: Reminder
    }

export function toDateKey(value: string | Date | null | undefined) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.valueOf())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatAgendaDate(value: string | null | undefined) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "Sin fecha"

  return date.toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatAgendaTime(value: string | null | undefined) {
  if (!value) return "Sin hora"
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return "Sin hora"

  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatAgendaDateTime(value: string | null | undefined) {
  if (!value) return "Sin fecha"
  return `${formatAgendaDate(value)} · ${formatAgendaTime(value)}`
}

export function isToday(value: string | null | undefined) {
  return Boolean(value && toDateKey(value) === toDateKey(new Date()))
}

export function isOverdue(value: string) {
  return new Date(value).valueOf() < Date.now()
}

export function sortByStart(a: AgendaEvent, b: AgendaEvent) {
  return a.startsAt.localeCompare(b.startsAt)
}

export function buildAgendaEvents(
  followUps: FollowUp[],
  reminders: Reminder[],
  patientNames: Map<string, string>,
): AgendaEvent[] {
  const followUpEvents: AgendaEvent[] = followUps.flatMap((followUp) => {
    if (!followUp.scheduledAt) return []

    return [
      {
        id: followUp.id,
        kind: "follow-up",
        patientId: followUp.subjectPatientId,
        patientName: followUp.subjectPatientName ?? "Paciente desconocido",
        startsAt: followUp.scheduledAt,
        title: followUpTypeLabels[followUp.type],
        detail: followUpPurposeLabels[followUp.purpose],
        followUp,
      },
    ]
  })

  const reminderEvents: AgendaEvent[] = reminders.map((reminder) => ({
    id: reminder.id,
    kind: "reminder",
    patientId: reminder.subjectPatientId,
    patientName:
      patientNames.get(reminder.subjectPatientId) ?? "Paciente desconocido",
    startsAt: reminder.dueAt,
    title: reminder.description,
    detail: "Recordatorio",
    reminder,
  }))

  return [...followUpEvents, ...reminderEvents].sort(sortByStart)
}

export function toLocalDateTimeParts(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return { date: "", time: "" }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString()
}
