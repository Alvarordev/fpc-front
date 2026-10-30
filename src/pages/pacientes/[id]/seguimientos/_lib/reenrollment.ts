import type { CreateReenrollmentInput } from "@/api/follow-ups"
import { patientHealthSubcategoriesByPhase } from "@/lib/patient-health-subcategory"

// Borrador del reenrolamiento (decisión E-R) y su paso a la API.

export type ReenrollmentDraft = Partial<CreateReenrollmentInput>

export type ReenrollmentPhase = CreateReenrollmentInput["healthPhase"]

export const REENROLLMENT_PHASES: ReenrollmentPhase[] = ["CANCER_DIAGNOSIS", "SIGNS_AND_SYMPTOMS"]

/** Lo que falta para poder registrar el reenrolamiento, o `null` si está completo. */
export function reenrollmentMissing(draft: ReenrollmentDraft): string | null {
  if (!draft.reason) return "Elige el motivo del reenrolamiento"
  if (!draft.entrySource) return "Elige el punto de ingreso"
  if (!draft.healthPhase) return "Elige la situación de salud"
  if (draft.healthPhase === "CANCER_DIAGNOSIS" && !draft.healthSubcategory) return "Elige la subcategoría de salud"
  if (!draft.contactDataConfirmed) return "Confirma que revisaste los datos de contacto"
  return null
}

export function toReenrollmentInput(draft: ReenrollmentDraft): CreateReenrollmentInput {
  const healthPhase = draft.healthPhase!
  const subcategories = patientHealthSubcategoriesByPhase[healthPhase]
  return {
    reason: draft.reason!,
    entrySource: draft.entrySource!,
    entrySubSource: draft.entrySubSource || undefined,
    healthPhase,
    healthSubcategory: (draft.healthSubcategory ?? (subcategories.length === 1 ? subcategories[0] : undefined)) as CreateReenrollmentInput["healthSubcategory"],
    contactDataConfirmed: true,
  }
}
