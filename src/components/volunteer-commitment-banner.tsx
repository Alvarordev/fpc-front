import { useState } from "react"
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react"
import type { Volunteer } from "@/api/volunteers"
import {
  commitmentDaysRemaining,
  formatCommitmentDate,
  isCommitmentExpiring,
} from "@/lib/volunteer-commitment"

interface VolunteerCommitmentBannerProps {
  volunteers: Volunteer[]
  title?: string
}

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
}: VolunteerCommitmentBannerProps) {
  const expiringVolunteers = volunteers.filter(isCommitmentExpiring)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (expiringVolunteers.length === 0) return null

  const safeIndex = Math.min(currentIndex, expiringVolunteers.length - 1)
  const volunteer = expiringVolunteers[safeIndex]!
  const daysRemaining = commitmentDaysRemaining(volunteer.commitmentEndAt)
  const hasMultiple = expiringVolunteers.length > 1

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <TriangleAlert className="size-5 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-red-900">{title}</p>
        <p className="mt-0.5 truncate text-xs text-red-700/80">
          {volunteer.firstName} {volunteer.lastName} —{" "}
          {expirationMessage(daysRemaining ?? 0)}
        </p>
        <p className="mt-0.5 text-xs text-red-700/80">
          Fecha de vencimiento:{" "}
          {formatCommitmentDate(volunteer.commitmentEndAt)}
        </p>
        {hasMultiple && (
          <p className="mt-1 text-[11px] text-red-600/70">
            Alerta {safeIndex + 1} de {expiringVolunteers.length}
          </p>
        )}
      </div>
      {hasMultiple && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((previous) =>
                previous === 0 ? expiringVolunteers.length - 1 : previous - 1,
              )
            }
            className="flex size-7 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-100"
            aria-label="Alerta anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((previous) =>
                previous === expiringVolunteers.length - 1 ? 0 : previous + 1,
              )
            }
            className="flex size-7 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-100"
            aria-label="Alerta siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
