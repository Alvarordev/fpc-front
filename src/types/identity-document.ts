import type { components } from "@/api/schema"

export type IdentityDocumentType = NonNullable<
  components["schemas"]["CreatePatientDto"]["documentType"]
>

export const IDENTITY_DOCUMENT_DIGITS: Record<IdentityDocumentType, number> = {
  DNI: 8,
  CE: 9,
  CPP: 9,
}

export const IDENTITY_DOCUMENT_OPTIONS: Array<{
  value: IdentityDocumentType
  label: string
}> = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "CE" },
  { value: "CPP", label: "CPP" },
]

/** Keeps only digits, capped at the length the document type allows. */
export function sanitizeDocumentNumber(
  type: IdentityDocumentType,
  raw: string,
): string {
  return raw.replace(/\D/g, "").slice(0, IDENTITY_DOCUMENT_DIGITS[type])
}

/** Error to show for an incomplete number; empty numbers are allowed. */
export function documentNumberError(
  type: IdentityDocumentType,
  value: string | null | undefined,
): string | null {
  const number = value?.trim() ?? ""
  if (!number) return null
  const digits = IDENTITY_DOCUMENT_DIGITS[type]
  return new RegExp(`^\\d{${digits}}$`).test(number)
    ? null
    : `El ${type} debe tener ${digits} dígitos`
}

/** "DNI 41061472"; older records without a type show just the number. */
export function formatIdentityDocument(
  type: IdentityDocumentType | null | undefined,
  number: string,
): string {
  return type ? `${type} ${number}` : `Doc. ${number}`
}
