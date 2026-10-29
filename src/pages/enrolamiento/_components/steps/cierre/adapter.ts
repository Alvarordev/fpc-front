import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"

function clockNow() {
  return new Date().toTimeString().slice(0, 5)
}

export function cierreValues(draft: EnrollmentDraft, historical: boolean): Values {
  const meta = draft.enrollmentMetadata
  const end = meta.endTime?.slice(0, 5)
  return {
    survey: meta.surveyAccepted ? "yes" : "no",
    agent: meta.assignedAgentId ?? null,
    endTime: end || (historical ? null : clockNow()),
  }
}

export function applyCierre(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  const meta = draft.enrollmentMetadata
  if (id === "survey") return { enrollmentMetadata: { ...meta, surveyAccepted: value === "yes" } }
  if (id === "agent") return { enrollmentMetadata: { ...meta, assignedAgentId: value ?? undefined } }
  if (id === "endTime") return { enrollmentMetadata: { ...meta, endTime: value ?? undefined } }
  return {}
}
