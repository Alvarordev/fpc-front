import type { CompanionPatient } from "@/api/patients"

export type CompanionGroup = {
  title: string
  companions: CompanionPatient[]
}

export function isPrimaryContactLink(link: CompanionPatient) {
  return link.contactRole === "PRIMARY" || link.isPrimaryContact
}

export function groupCompanions(companions: CompanionPatient[]): CompanionGroup[] {
  const primary = companions.filter(
    (link) => link.contactRole === "PRIMARY" || link.isPrimaryContact,
  )
  const secondary = companions.filter(
    (link) =>
      link.contactRole === "SECONDARY" &&
      !primary.some((item) => item.id === link.id),
  )
  const others = companions.filter(
    (link) =>
      !primary.some((item) => item.id === link.id) &&
      !secondary.some((item) => item.id === link.id),
  )

  const groups: CompanionGroup[] = []
  if (primary.length > 0) {
    groups.push({ title: "Contacto principal", companions: primary })
  }
  if (secondary.length > 0) {
    groups.push({ title: "Contacto secundario", companions: secondary })
  }
  if (others.length > 0) {
    groups.push({ title: "Otros roles", companions: others })
  }
  return groups
}

export function hasPrimaryContact(companions: CompanionPatient[]) {
  return companions.some(
    (link) => link.contactRole === "PRIMARY" || link.isPrimaryContact,
  )
}
