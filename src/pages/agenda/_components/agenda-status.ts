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

/** Sesiones a las que todavía se les puede registrar el resultado. */
export function canRegisterResult(status: PsychooncologyAppointment["status"]) {
  return status === "SCHEDULED" || status === "OVERDUE" || status === "NO_SHOW"
}
