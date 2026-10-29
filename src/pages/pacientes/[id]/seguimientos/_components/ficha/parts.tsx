import { InlineAlert } from "@/components/ds/inline-alert"
import { progress, type Group, type Values } from "@/components/ds/questions"

// Piezas compartidas por las pestañas de la ficha clínica.

/** Avisa que una sección no se guardará hasta completar sus obligatorios. */
export function MissingNote({ groups, values, what }: { groups: Group[]; values: Values; what: string }) {
  const { missingRequired } = progress(groups, values)
  if (!missingRequired) return null
  return (
    <InlineAlert tone="warning">
      {missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`}: {what} no se guardará hasta completarlos.
    </InlineAlert>
  )
}

/** Texto de apoyo al inicio de una pestaña. */
export function TabNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">{children}</p>
}
