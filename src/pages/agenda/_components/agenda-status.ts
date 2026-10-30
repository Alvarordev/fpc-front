import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import type { Tone } from "@/components/ds/tone"

export const appointmentStatus: Record<
  PsychooncologyAppointment["status"],
  { label: string; tone: Tone }
> = {
  SCHEDULED: { label: "Programada", tone: "blue" },
  COMPLETED: { label: "Completada", tone: "green" },
  CANCELLED: { label: "Cancelada", tone: "gray" },
  NO_SHOW: { label: "No se presentó", tone: "amber" },
  RESCHEDULED: { label: "Reprogramada", tone: "gray" },
  OVERDUE: { label: "Vencida", tone: "red" },
}

export function sessionLabel(sessionNumber: number | null | undefined) {
  return sessionNumber ? `Sesión ${sessionNumber}` : "Sesión extra"
}

/**
 * Sesiones a las que ya se les puede registrar el resultado: abiertas y que ya
 * empezaron (el backend rechaza registrar una sesión antes de su hora).
 */
export function canRegisterResult(appointment: Pick<PsychooncologyAppointment, "status" | "scheduledAt">, now = new Date()) {
  const open = appointment.status === "SCHEDULED" || appointment.status === "OVERDUE" || appointment.status === "NO_SHOW"
  return open && (!appointment.scheduledAt || new Date(appointment.scheduledAt) <= now)
}
