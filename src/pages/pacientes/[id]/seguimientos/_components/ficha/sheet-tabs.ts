import type { ClinicalDrafts } from "../clinical-drafts"

/** Pestañas de la ficha clínica y cuándo tienen cambios por guardar. */
export const SHEET_TABS = [
  { id: "datos", label: "Datos clínicos", changed: (d: ClinicalDrafts) => Boolean(d.details) },
  { id: "sintomas", label: "Síntomas", changed: (d: ClinicalDrafts) => Boolean(d.symptomReport || d.diagnosticStatus) },
  { id: "diagnostico", label: "Diagnóstico", changed: (d: ClinicalDrafts) => Boolean(d.diagnoses?.length) },
  { id: "tratamiento", label: "Tratamientos", changed: (d: ClinicalDrafts) => Boolean(d.treatments?.length) },
  { id: "antecedentes", label: "Antecedentes", changed: (d: ClinicalDrafts) => Boolean(d.healthBackground) },
  { id: "contacto", label: "Contacto", changed: (d: ClinicalDrafts) => Boolean(d.contact) },
  { id: "direcciones", label: "Direcciones", changed: (d: ClinicalDrafts) => Boolean(d.address) },
  { id: "seguro", label: "Seguro", changed: (d: ClinicalDrafts) => Boolean(d.insurance) },
  { id: "social", label: "Social", changed: (d: ClinicalDrafts) => Boolean(d.social || d.socialNotes?.length) },
] as const

export type SheetTabId = (typeof SHEET_TABS)[number]["id"]

/** Nombres de las pestañas con cambios, en el orden de la ficha. */
export const changedTabs = (drafts: ClinicalDrafts) => SHEET_TABS.filter((t) => t.changed(drafts)).map((t) => t.label)
