import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"

export function consentimientoValues(draft: EnrollmentDraft): Values {
  const accepted = draft.enrollmentMetadata.informedConsentAccepted
  return { informedConsent: accepted === true ? "yes" : accepted === false ? "no" : null }
}

export function applyConsentimiento(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  if (id !== "informedConsent") return {}
  return {
    enrollmentMetadata: {
      ...draft.enrollmentMetadata,
      informedConsentAccepted: value === "yes" ? true : value === "no" ? false : undefined,
    },
  }
}
