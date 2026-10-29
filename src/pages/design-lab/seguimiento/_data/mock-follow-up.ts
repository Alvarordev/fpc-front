// Datos de ejemplo del laboratorio de la pantalla de seguimiento. Reutilizan al
// paciente de la ficha para que ambos laboratorios cuenten la misma historia.

import type { Tone } from "@/components/ds/tone"
import { samplePatient, type MockPatient } from "../../_data/mock-patient"

export type FollowUpLabState = "open" | "overdue" | "closed" | "loading"

export type Channel = "CALL" | "WHATSAPP" | "VIDEO_CALL" | "EMAIL" | "IN_PERSON" | "FACEBOOK"
export type AttemptOutcome = "CONTACTED" | "NO_ANSWER" | "WRONG_NUMBER" | "REJECTED"

export const channelLabels: Record<Channel, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Correo",
  IN_PERSON: "Presencial",
  FACEBOOK: "Facebook",
}

export const outcomeLabels: Record<AttemptOutcome, { label: string; tone: Tone }> = {
  CONTACTED: { label: "Contactado", tone: "green" },
  NO_ANSWER: { label: "No contestó", tone: "amber" },
  WRONG_NUMBER: { label: "Número equivocado", tone: "red" },
  REJECTED: { label: "Rechazó la llamada", tone: "red" },
}

export type Attempt = { id: string; at: string; channel: Channel; outcome: AttemptOutcome; note?: string; author: string }

export type FollowUpStatus = "SCHEDULED" | "OVERDUE" | "COMPLETED" | "NO_ANSWER" | "CANCELLED"

export const statusLabels: Record<FollowUpStatus, { label: string; tone: Tone }> = {
  SCHEDULED: { label: "Agendado", tone: "blue" },
  OVERDUE: { label: "Vencido", tone: "red" },
  COMPLETED: { label: "Completado", tone: "green" },
  NO_ANSWER: { label: "No contestó", tone: "amber" },
  CANCELLED: { label: "Cancelado", tone: "gray" },
}

export type MockFollowUp = {
  id: string
  purpose: string
  channel: Channel
  scheduledAt: string
  status: FollowUpStatus
  agent: string
  interlocutor: string
  attempts: Attempt[]
  notes: string
  previous: { date: string; purpose: string; note: string; agent: string } | null
  /** Lo que se guardó al completar (solo cuando está cerrado). */
  outcomes: { id: string; kind: string; text: string; tone: Tone }[]
}

const base: MockFollowUp = {
  id: "f1",
  purpose: "Seguimiento mensual",
  channel: "CALL",
  scheduledAt: "2026-10-28T10:00",
  status: "SCHEDULED",
  agent: "Carla Mendoza",
  interlocutor: "Paciente",
  attempts: [{ id: "a1", at: "2026-10-28T10:15", channel: "CALL", outcome: "NO_ANSWER", note: "Timbró y no contestó.", author: "Carla Mendoza" }],
  notes: "",
  previous: {
    date: "2026-09-27",
    purpose: "Seguimiento mensual",
    note: "Refiere náuseas después del ciclo 3. Ánimo bajo. Se derivó a psicooncología.",
    agent: "Carla Mendoza",
  },
  outcomes: [],
}

export function followUpFor(state: FollowUpLabState): { followUp: MockFollowUp; patient: MockPatient } {
  if (state === "overdue") {
    return {
      patient: samplePatient,
      followUp: { ...base, scheduledAt: "2026-10-25T10:00", status: "OVERDUE", attempts: [] },
    }
  }
  if (state === "closed") {
    return {
      patient: samplePatient,
      followUp: {
        ...base,
        status: "COMPLETED",
        interlocutor: "Rosa Torres (hija)",
        attempts: [
          ...base.attempts,
          { id: "a2", at: "2026-10-28T15:40", channel: "WHATSAPP", outcome: "CONTACTED", note: "Respondió la hija y pidió que la llamen.", author: "Carla Mendoza" },
          { id: "a3", at: "2026-10-28T15:55", channel: "CALL", outcome: "CONTACTED", author: "Carla Mendoza" },
        ],
        notes:
          "Habló la hija. Ana sigue con náuseas tras el ciclo 4 pero asistió a su cita. Aún no recibe los medicamentos de la farmacia del INEN; se reportó la incidencia. Confirmó la sesión de psicooncología del 30 oct.",
        outcomes: [
          { id: "o1", kind: "Ficha clínica", text: "Tratamiento actualizado: ciclo 4 de 6 de quimioterapia", tone: "blue" },
          { id: "o2", kind: "Ficha clínica", text: "Síntomas registrados: náuseas, cansancio", tone: "blue" },
          { id: "o3", kind: "Incidencia", text: "Alerta: retraso en la entrega de medicamentos en el INEN", tone: "red" },
          { id: "o4", kind: "Siguiente seguimiento", text: "Seguimiento mensual agendado para el 27 nov", tone: "green" },
          { id: "o5", kind: "Recordatorio", text: "Cita de oncología del 4 nov, aviso por WhatsApp un día antes", tone: "amber" },
        ],
      },
    }
  }
  return { patient: samplePatient, followUp: base }
}

export function timeOf(iso: string) {
  return iso.slice(11, 16)
}
