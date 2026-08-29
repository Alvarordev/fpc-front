import { describe, expect, it } from "vitest"
import type { CompanionPatient } from "@/api/patients"
import {
  groupCompanions,
  hasPrimaryContact,
} from "./companion-groups"

function link(
  overrides: Partial<CompanionPatient> & Pick<CompanionPatient, "id">,
): CompanionPatient {
  return {
    companionId: "companion-1",
    patientId: "patient-1",
    isPrimaryInformant: false,
    isPrimaryContact: false,
    contactRole: null,
    isCaregiver: false,
    relationship: null,
    companionDisplayName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("companion groups", () => {
  it("groups companions by contact role", () => {
    const groups = groupCompanions([
      link({ id: "1", contactRole: "PRIMARY" }),
      link({ id: "2", contactRole: "SECONDARY" }),
      link({ id: "3", isCaregiver: true }),
    ])

    expect(groups.map((group) => group.title)).toEqual([
      "Contacto principal",
      "Contacto secundario",
      "Otros roles",
    ])
    expect(groups[0]?.companions).toHaveLength(1)
    expect(groups[2]?.companions[0]?.id).toBe("3")
  })

  it("detects primary contact from legacy flag", () => {
    expect(
      hasPrimaryContact([link({ id: "1", isPrimaryContact: true })]),
    ).toBe(true)
    expect(hasPrimaryContact([link({ id: "1" })])).toBe(false)
  })
})
