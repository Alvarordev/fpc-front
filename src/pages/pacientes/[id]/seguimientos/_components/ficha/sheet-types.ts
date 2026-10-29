import type { ClinicalDrafts } from "../clinical-drafts"

/** Lo que recibe cada pestaña de la ficha: los borradores y cómo cambiarlos. */
export type SheetTabProps = {
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
}
