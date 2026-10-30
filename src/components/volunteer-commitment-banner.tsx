import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Volunteer } from "@/api/volunteers"
import { InlineAlert } from "@/components/ds/inline-alert"
import {
  commitmentDaysRemaining,
  formatCommitmentDate,
  isCommitmentExpiring,
} from "@/lib/volunteer-commitment"

function expirationMessage(daysRemaining: number) {
  if (daysRemaining < 0) {
    const days = Math.abs(daysRemaining)
    return `El acta venció hace ${days} día${days === 1 ? "" : "s"}.`
  }
  if (daysRemaining === 0) return "El acta vence hoy."
  return `El acta vence en ${daysRemaining} día${daysRemaining === 1 ? "" : "s"}.`
}

export function VolunteerCommitmentBanner({
  volunteers,
  title = "Actas de voluntariado por vencer",
}: {
  volunteers: Volunteer[]
  title?: string
}) {
  const expiring = volunteers.filter(isCommitmentExpiring)
  const [currentIndex, setCurrentIndex] = useState(0)
  if (expiring.length === 0) return null

  const safeIndex = Math.min(currentIndex, expiring.length - 1)
  const volunteer = expiring[safeIndex]!
  const daysRemaining = commitmentDaysRemaining(volunteer.commitmentEndAt)
  const hasMultiple = expiring.length > 1
  const overdue = (daysRemaining ?? 0) < 0

  return (
    <InlineAlert
      tone={overdue ? "danger" : "warning"}
      aside={
        hasMultiple ? (
          <span className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentIndex((previous) => (previous === 0 ? expiring.length - 1 : previous - 1))}
              className="flex size-7 items-center justify-center rounded-md"
              aria-label="Alerta anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span>
              {safeIndex + 1}/{expiring.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex((previous) => (previous === expiring.length - 1 ? 0 : previous + 1))}
              className="flex size-7 items-center justify-center rounded-md"
              aria-label="Alerta siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </span>
        ) : undefined
      }
    >
      {title}: {volunteer.firstName} {volunteer.lastName}. {expirationMessage(daysRemaining ?? 0)} Vence el{" "}
      {formatCommitmentDate(volunteer.commitmentEndAt)}.
    </InlineAlert>
  )
}
