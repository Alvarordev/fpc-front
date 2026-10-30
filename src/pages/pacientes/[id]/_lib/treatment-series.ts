import type { PatientTreatment } from "@/api/patients"

/**
 * Situations that close a treatment. A series whose current version is in one
 * of these goes to "Historial de tratamientos" instead of the active list.
 */
const CLOSED_TREATMENT_SITUATIONS = new Set([
  "CULMINADO",
  "ABANDONADO",
  "FALLECIDO",
  "NO_APLICA",
  "REMISION",
])

export type TreatmentSeries = {
  seriesId: string
  /** Version shown on the card: the current one, or the newest if none is. */
  current: PatientTreatment
  /** Superseded versions of the same treatment, newest first. */
  previousVersions: PatientTreatment[]
}

function byNewest(a: PatientTreatment, b: PatientTreatment) {
  return b.createdAt.localeCompare(a.createdAt)
}

/**
 * The backend versions treatments: every update inserts a new row with the
 * same `seriesId` and flags the previous one `isCurrent: false`. Group them so
 * an update reads as a change to one treatment, not as a second treatment.
 */
export function groupTreatmentSeries(
  treatments: PatientTreatment[],
): TreatmentSeries[] {
  const bySeries = new Map<string, PatientTreatment[]>()
  for (const treatment of treatments) {
    const versions = bySeries.get(treatment.seriesId)
    if (versions) versions.push(treatment)
    else bySeries.set(treatment.seriesId, [treatment])
  }

  return [...bySeries.entries()]
    .map(([seriesId, versions]) => {
      const sorted = [...versions].sort(byNewest)
      const current = sorted.find((item) => item.isCurrent) ?? sorted[0]
      return {
        seriesId,
        current,
        previousVersions: sorted.filter((item) => item !== current),
      }
    })
    .sort((a, b) => byNewest(a.current, b.current))
}

export function isClosedTreatment(treatment: PatientTreatment) {
  return (
    !treatment.isCurrent ||
    CLOSED_TREATMENT_SITUATIONS.has(treatment.treatmentSituation ?? "")
  )
}

/** Situación del tratamiento; sin dato, se deduce de si está vigente. */
export function treatmentStatus(treatment: PatientTreatment) {
  if (treatment.treatmentSituation) {
    return treatment.treatmentSituation
  }
  return treatment.isCurrent ? "EN_PROCESO" : "CULMINADO"
}
