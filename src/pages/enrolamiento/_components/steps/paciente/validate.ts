import { documentNumberError } from "@/types/identity-document"
import type { CompanionDraft, EnrollmentDraft } from "../../../_store/enrollment-store"
import type { EnrollmentContactSource } from "@/types"
import { lodgingCostError } from "../../../_utils/address-housing"
import type { DniLookupState } from "../../use-enrollment-dni-lookup"

function isValidLocationUrl(value: string | undefined) {
  if (!value?.trim()) return true
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function contactError(source: EnrollmentContactSource | "", person: CompanionDraft, role: string, patientPhone: string, callerReady: boolean) {
  if (!source) return `Seleccione el contacto ${role}`
  if (source === "PATIENT") return patientPhone.trim() ? null : "Complete el teléfono principal del paciente"
  if (source === "CALLER") return callerReady ? null : "Complete primero los datos de quien llama"
  if (!person.fullName.trim() || !person.primaryPhone.trim() || !person.relationship?.trim()) {
    return `Complete nombre, parentesco y teléfono del ${role}`
  }
  return null
}

export function validatePaciente(
  draft: EnrollmentDraft,
  historical: boolean,
  lookup: { state: DniLookupState; matchId?: string },
  callerReady: boolean,
  minor: boolean,
): string | null {
  if (lookup.state === "loading") return "Espera a que termine la búsqueda del documento"
  if (lookup.state === "blocked") return "Ya está enrolado, registra un seguimiento"
  if (lookup.state === "prospect" && draft.patientId !== lookup.matchId) {
    return "Este documento ya tiene una ficha. Ábrela para enrolarlo."
  }
  if (lookup.state === "reenroll" && draft.patientId !== lookup.matchId) {
    return "Este documento es de un paciente inactivo o con cáncer descartado. Usa Reenrolar para continuar."
  }

  const pd = draft.patientData
  const selected = draft.primaryContactSource ?? (minor && callerReady ? "CALLER" : "")
  const phoneRequired = selected === "PATIENT" || !historical
  const basicsMissing = !pd.fullName.trim() || !pd.birthDate || (phoneRequired && !pd.primaryPhone.trim())
  if (basicsMissing || !selected) return null

  const documentError = documentNumberError(pd.documentType ?? "DNI", pd.dni)
  if (documentError) return documentError

  const temporary = draft.addresses[1]
  if (draft.addresses.length > 1 && temporary) {
    const lodging = lodgingCostError(temporary)
    if (lodging) return lodging
  }
  const permanent = draft.addresses[0]
  if (!isValidLocationUrl(permanent?.locationUrl) || !isValidLocationUrl(temporary?.locationUrl)) {
    return "La ubicación web debe ser una URL válida http o https"
  }
  if (minor && selected === "PATIENT") {
    return "Un paciente menor debe tener un acompañante como contacto principal"
  }
  const primary = contactError(selected, draft.primaryContact, "contacto principal", pd.primaryPhone, callerReady)
  if (primary) return primary
  if (draft.secondaryContactEnabled) {
    const secondary = contactError(
      draft.secondaryContactSource ?? "",
      draft.secondaryContact,
      "contacto secundario",
      pd.primaryPhone,
      callerReady,
    )
    if (secondary) return secondary
    if (draft.secondaryContactSource === "PATIENT") return "El paciente solo puede ser contacto principal"
    for (const [index, person] of draft.additionalSecondaryContacts.entries()) {
      const additional = contactError("NEW", person, `contacto secundario ${index + 2}`, pd.primaryPhone, callerReady)
      if (additional) return additional
    }
  }
  return null
}
