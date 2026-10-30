import type { EnrollmentContactSource } from "@/types"
import type { CompanionDraft, EnrollmentDraft } from "../_store/enrollment-store"

// Contactos del paciente. El principal es el paciente, quien llama o uno de
// los acompañantes agregados en el paso Paciente. Los secundarios se marcan en
// quien llama o en esos acompañantes. La API solo da de alta a un acompañante
// nuevo como contacto; los que no se marcan se registran después del
// enrolamiento (`unlinkedPeople`).

export const PATIENT = "PATIENT"
export const CALLER = "CALLER"
export const NEW_PERSON = "NEW"
const PERSON = "person:"

export const personValue = (index: number) => `${PERSON}${index}`
export const personIndex = (value: string | null | undefined) =>
  value?.startsWith(PERSON) ? Number(value.slice(PERSON.length)) : null

export function personReady(person: CompanionDraft) {
  return Boolean(person.fullName.trim() && person.primaryPhone.trim() && person.relationship?.trim())
}

/** Valor de la pregunta "¿Quién es el contacto principal?". */
export function primaryValue(draft: EnrollmentDraft, minor: boolean, callerReady: boolean): string | null {
  const source = draft.primaryContactSource ?? (minor && callerReady ? CALLER : undefined)
  if (source === PATIENT || source === CALLER) return source
  const index = draft.contactPeople.findIndex((person) => person.isPrimaryContact)
  return index >= 0 ? personValue(index) : null
}

/** Opciones del contacto principal: el paciente, quien llama y cada acompañante. */
export function primaryOptions(draft: EnrollmentDraft, minor: boolean, callerReady: boolean) {
  return [
    ...(minor ? [] : [{ value: PATIENT, label: "El paciente" }]),
    ...(callerReady ? [{ value: CALLER, label: `${draft.companion.fullName.trim()} (quien llama)` }] : []),
    ...draft.contactPeople.map((person, index) => ({ value: personValue(index), label: person.fullName.trim() || `Acompañante ${index + 1}` })),
    { value: NEW_PERSON, label: "Otra persona" },
  ]
}

/** Elegir el contacto principal. Quien pasa a principal deja de ser secundario. */
export function choosePrimary(draft: EnrollmentDraft, value: string | null): Partial<EnrollmentDraft> {
  const index = personIndex(value)
  return {
    primaryContactSource: (index !== null ? NEW_PERSON : value || undefined) as EnrollmentContactSource | undefined,
    companion: value === CALLER ? { ...draft.companion, isSecondaryContact: false } : draft.companion,
    contactPeople: draft.contactPeople.map((person, i) => ({
      ...person,
      isPrimaryContact: i === index,
      isSecondaryContact: i === index ? false : person.isSecondaryContact,
    })),
  }
}

/** Personas que pueden marcarse como contacto secundario (todas menos el principal). */
export function secondaryCandidates(draft: EnrollmentDraft, callerReady: boolean) {
  return [
    ...(callerReady && draft.primaryContactSource !== CALLER
      ? [{ key: CALLER, person: draft.companion, caller: true }]
      : []),
    ...draft.contactPeople
      .map((person, index) => ({ key: personValue(index), person, caller: false }))
      .filter((item) => !item.person.isPrimaryContact),
  ]
}

export function secondaryCount(draft: EnrollmentDraft, callerReady: boolean) {
  return secondaryCandidates(draft, callerReady).filter((item) => item.person.isSecondaryContact).length
}

/** Marca o desmarca a una persona (`CALLER` o `person:i`) como contacto secundario. */
export function toggleSecondary(draft: EnrollmentDraft, key: string, on: boolean): Partial<EnrollmentDraft> {
  if (key === CALLER) return { companion: { ...draft.companion, isSecondaryContact: on } }
  const index = personIndex(key)
  return { contactPeople: draft.contactPeople.map((person, i) => (i === index ? { ...person, isSecondaryContact: on } : person)) }
}

/** Marca o desmarca a una persona como cuidador. Solo hay un cuidador: marcar a uno desmarca a los demás. */
export function toggleCaregiver(draft: EnrollmentDraft, key: string, on: boolean): Partial<EnrollmentDraft> {
  const index = personIndex(key)
  return {
    companion: { ...draft.companion, isCaregiver: key === CALLER ? on : on ? false : draft.companion.isCaregiver },
    contactPeople: draft.contactPeople.map((person, i) => ({ ...person, isCaregiver: i === index ? on : on ? false : person.isCaregiver })),
  }
}

/** Primer problema de los contactos, o `null`. */
export function contactsError(draft: EnrollmentDraft, minor: boolean, callerReady: boolean, patientPhone: string): string | null {
  const primary = primaryValue(draft, minor, callerReady)
  if (!primary) return "Elige el contacto principal"
  if (primary === PATIENT && minor) return "Un paciente menor debe tener un acompañante como contacto principal"
  if (primary === PATIENT && !patientPhone.trim()) return "Completa el teléfono principal del paciente"
  if (primary === CALLER && !callerReady) return "Completa primero los datos de quien llama"
  const incomplete = draft.contactPeople.find((person) => !personReady(person))
  if (incomplete) return `Completa nombre, parentesco y teléfono de ${incomplete.fullName.trim() || "un acompañante"}`
  if (draft.secondaryContactEnabled && secondaryCount(draft, callerReady) === 0) {
    return secondaryCandidates(draft, callerReady).length
      ? "Marca al menos un acompañante como contacto secundario"
      : "Agrega un acompañante para tenerlo como contacto secundario"
  }
  return null
}

type ContactPayload = { role: "PRIMARY" | "SECONDARY"; source: EnrollmentContactSource; person?: CompanionDraft }

/**
 * Contactos para la API y acompañantes que quedan fuera (sin rol), para
 * registrarlos después del enrolamiento.
 */
export function enrollmentContacts(draft: EnrollmentDraft, primarySource: EnrollmentContactSource, callerReady: boolean) {
  const contacts: ContactPayload[] = []
  const primaryPerson = draft.contactPeople.find((person) => person.isPrimaryContact)
  if (primarySource === NEW_PERSON && !primaryPerson) throw new Error("Elige el contacto principal")
  contacts.push({ role: "PRIMARY", source: primarySource, ...(primarySource === NEW_PERSON ? { person: primaryPerson } : {}) })
  const secondaries = draft.secondaryContactEnabled ? secondaryCandidates(draft, callerReady).filter((item) => item.person.isSecondaryContact) : []
  for (const item of secondaries) {
    contacts.push(item.caller ? { role: "SECONDARY", source: CALLER } : { role: "SECONDARY", source: NEW_PERSON, person: item.person })
  }
  const linked = new Set(contacts.map((contact) => contact.person).filter(Boolean))
  const unlinkedPeople = draft.contactPeople.filter((person) => !linked.has(person))
  return { contacts, unlinkedPeople, callerIsContact: contacts.some((contact) => contact.source === CALLER) }
}

/** Acompañantes agregados que no quedaron como contacto principal ni secundario. */
export function unlinkedPeople(draft: EnrollmentDraft) {
  return draft.contactPeople.filter((person) => !person.isPrimaryContact && !(draft.secondaryContactEnabled && person.isSecondaryContact))
}
