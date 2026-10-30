import type { PatientHealthBackgroundAssessment } from "@/api/patients"

export type ActiveComorbidity =
  PatientHealthBackgroundAssessment["activeComorbidities"][number]

/**
 * Each follow-up records the comorbidities it learned about; the patient's
 * current list is the union, keeping the latest details per condition.
 */
export function collectActiveComorbidities(
  assessments: PatientHealthBackgroundAssessment[],
): ActiveComorbidity[] {
  const latestFirst = [...assessments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
  const byCondition = new Map<string, ActiveComorbidity>()
  for (const assessment of latestFirst) {
    for (const comorbidity of assessment.activeComorbidities) {
      const key = comorbidity.conditionName.trim().toLocaleLowerCase("es")
      if (key && !byCondition.has(key)) byCondition.set(key, comorbidity)
    }
  }
  return [...byCondition.values()]
}
