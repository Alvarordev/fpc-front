import { useState } from "react"
import type { Attempt, MockFollowUp } from "../_data/mock-follow-up"

// Borrador del seguimiento, como en la pantalla real: la nota, los cambios de la
// ficha clínica y las acciones derivadas se guardan juntos al completarlo.

export type DerivedKind = "psico" | "alerta" | "siguiente" | "recordatorio"

export type DerivedDraft = { id: string; kind: DerivedKind; title: string; detail: string; values: Record<string, string | null> }

export function useFollowUpDraft(followUp: MockFollowUp) {
  const [attempts, setAttempts] = useState<Attempt[]>(followUp.attempts)
  const [notes, setNotes] = useState(followUp.notes)
  const [interlocutor, setInterlocutor] = useState(followUp.interlocutor === "Paciente" ? "patient" : "c1")
  const [changedTabs, setChangedTabs] = useState<Set<string>>(new Set())
  const [derived, setDerived] = useState<DerivedDraft[]>([])

  const contacted = attempts.some((a) => a.outcome === "CONTACTED")

  return {
    attempts,
    addAttempt: (attempt: Omit<Attempt, "id">) => setAttempts((prev) => [...prev, { ...attempt, id: `a${prev.length + 1}` }]),
    notes,
    setNotes,
    interlocutor,
    setInterlocutor,
    changedTabs,
    markChanged: (tab: string) => setChangedTabs((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab))),
    derived,
    /** Recordatorios se suman; las demás acciones son una por seguimiento y se reemplazan. */
    saveDerived: (item: Omit<DerivedDraft, "id">, id?: string) =>
      setDerived((prev) => {
        const existing = id ?? (item.kind !== "recordatorio" ? prev.find((d) => d.kind === item.kind)?.id : undefined)
        return existing ? prev.map((d) => (d.id === existing ? { ...item, id: existing } : d)) : [...prev, { ...item, id: `${item.kind}-${Date.now()}` }]
      }),
    removeDerived: (id: string) => setDerived((prev) => prev.filter((d) => d.id !== id)),
    contacted,
  }
}

export type FollowUpDraft = ReturnType<typeof useFollowUpDraft>

/** Lo que se guardará al completar, en frases cortas para el resumen de cierre. */
export function pendingSummary(draft: FollowUpDraft) {
  const items: string[] = []
  if (draft.notes.trim()) items.push("La nota del seguimiento")
  if (draft.changedTabs.size) items.push(`${draft.changedTabs.size} ${draft.changedTabs.size === 1 ? "cambio" : "cambios"} en la ficha clínica`)
  for (const d of draft.derived) items.push(`${d.title}: ${d.detail}`)
  return items
}
