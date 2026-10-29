import { followUpTypeLabels } from "@/lib/follow-up-labels"
import { changedTabs } from "../_components/ficha/sheet-tabs"
import type { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

type Drafts = ReturnType<typeof useFollowUpDraftStore.getState>

/** Lo que se guardará al completar el seguimiento, en frases cortas. */
export function pendingSummary(drafts: Drafts, notes: string): string[] {
  const items: string[] = []
  if (drafts.contact) items.push(`Contacto por ${followUpTypeLabels[drafts.contact.channel]?.toLowerCase() ?? "llamada"}`)
  if (notes.trim()) items.push("La nota del seguimiento")
  const tabs = changedTabs(drafts.clinical)
  if (tabs.length) items.push(`Ficha clínica: ${tabs.join(", ").toLowerCase()}`)
  if (drafts.psico) items.push(`Sesión de psicooncología${drafts.psicoSummary ? `: ${drafts.psicoSummary}` : ""}`)
  if (drafts.alert) items.push(`Incidencia: ${drafts.alert.title}`)
  if (drafts.nextFollowUp) items.push(`Siguiente seguimiento: ${drafts.nextFollowUp.date}, ${drafts.nextFollowUp.time}`)
  for (const r of drafts.reminders) items.push(`Recordatorio: ${r.description}`)
  return items
}
