import type { Values } from "@/components/ds/questions"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"

function yn(value: boolean | undefined): string | null {
  return value === true ? "yes" : value === false ? "no" : null
}

export function identificacionValues(draft: EnrollmentDraft): Values {
  const meta = draft.enrollmentMetadata
  const companion = draft.companion
  return {
    affiliation: meta.affiliationType ?? null,
    isPatient: meta.affiliationType === "PATIENT" ? yn(meta.isOncologicalPatient) : null,
    isFamily: meta.affiliationType === "FAMILY" ? yn(meta.isOncologicalPatient) : null,
    callerName: companion.fullName || null,
    callerRelationship: companion.relationship ?? null,
    callerDni: companion.dni ?? null,
    callerBirth: companion.birthDate ?? null,
    callerGender: companion.gender ?? null,
    callerPhone: companion.primaryPhone || null,
    callerPhone2: companion.secondaryPhone ?? null,
    callerWhatsapp: companion.hasWhatsapp ? "yes" : "no",
  }
}

export function applyIdentificacion(draft: EnrollmentDraft, id: string, value: string | null): Partial<EnrollmentDraft> {
  const meta = draft.enrollmentMetadata
  const companion = draft.companion
  if (id === "isPatient" || id === "isFamily") {
    return { enrollmentMetadata: { ...meta, isOncologicalPatient: value === "yes" } }
  }
  const next = { ...companion }
  if (id === "callerName") next.fullName = value ?? ""
  if (id === "callerRelationship") next.relationship = value ?? undefined
  if (id === "callerDni") next.dni = value ?? undefined
  if (id === "callerBirth") next.birthDate = value ?? undefined
  if (id === "callerGender") next.gender = value ?? undefined
  if (id === "callerPhone") next.primaryPhone = value ?? ""
  if (id === "callerPhone2") next.secondaryPhone = value ?? undefined
  if (id === "callerWhatsapp") next.hasWhatsapp = value === "yes"
  return { companion: next }
}
