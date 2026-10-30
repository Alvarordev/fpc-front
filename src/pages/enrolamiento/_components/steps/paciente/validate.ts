import { documentNumberError } from "@/types/identity-document"
import type { EnrollmentDraft } from "../../../_store/enrollment-store"
import { contactsError, primaryValue } from "../../../_utils/contacts"
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
  const selected = primaryValue(draft, minor, callerReady)
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
  return contactsError(draft, minor, callerReady, pd.primaryPhone)
}
