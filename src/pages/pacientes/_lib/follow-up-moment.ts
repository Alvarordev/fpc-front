import type { PatientListItem } from "@/api/patients"

type FollowUp = NonNullable<PatientListItem["latestFollowUp"]>

/**
 * Instante que representa el último seguimiento en la tabla y en los filtros.
 * Vencido o agendado usan la fecha programada. El resto usa la fecha en que
 * ocurrió o se completó.
 */
export function followUpInstant(followUp: FollowUp): string | null {
  if (followUp.status === "OVERDUE" || followUp.status === "SCHEDULED") {
    return followUp.scheduledAt ?? followUp.occurredAt
  }
  return followUp.completedAt ?? followUp.occurredAt ?? followUp.scheduledAt
}

export function followUpSortTime(patient: PatientListItem): number | undefined {
  const followUp = patient.latestFollowUp
  if (!followUp) return undefined
  const instant = followUpInstant(followUp)
  if (!instant) return undefined
  const time = new Date(instant).getTime()
  return Number.isNaN(time) ? undefined : time
}
