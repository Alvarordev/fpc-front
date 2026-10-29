import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"

function clockNow() {
  return new Date().toTimeString().slice(0, 5)
}

export function inicioValues(draft: EnrollmentDraft, historical: boolean): Values {
  const start = draft.enrollmentMetadata.startTime?.slice(0, 5)
  return {
    historicalDate: draft.historicalEnrollmentDate || null,
    startTime: start || (historical ? null : clockNow()),
  }
}

export function applyInicio(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  if (id === "historicalDate") return { historicalEnrollmentDate: value ?? "" }
  if (id === "startTime") {
    return { enrollmentMetadata: { ...draft.enrollmentMetadata, startTime: value ?? undefined } }
  }
  return {}
}
