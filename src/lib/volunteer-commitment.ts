import type { Volunteer } from "@/api/volunteers"

const DAY_IN_MS = 24 * 60 * 60 * 1000

function dateAtStartOfDay(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? null : date
}

export function commitmentDaysRemaining(
  commitmentEndAt: string | null | undefined,
  now = new Date(),
) {
  if (!commitmentEndAt) return null
  const endDate = dateAtStartOfDay(commitmentEndAt)
  if (!endDate) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((endDate.valueOf() - today.valueOf()) / DAY_IN_MS)
}

export function isCommitmentExpiring(
  volunteer: Pick<Volunteer, "commitmentEndAt">,
) {
  const daysRemaining = commitmentDaysRemaining(volunteer.commitmentEndAt)
  return daysRemaining !== null && daysRemaining <= 30
}

export function formatCommitmentDate(value: string | null | undefined) {
  if (!value) return "Sin fecha"
  const date = dateAtStartOfDay(value)
  if (!date) return "Fecha inválida"
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
