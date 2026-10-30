import type { LucideIcon } from "lucide-react"
import type { Tone } from "./tone"
// Formularios descritos como datos. Cada pregunta dice su tipo, cuándo se
// muestra (`showIf`) y si es obligatoria; `QuestionForm` la dibuja. La etiqueta
// es la pregunta que el usuario hace, con el texto completo.

export type Values = Record<string, string | null>

export type Option = { value: string; label: string; sublabel?: string }

export type QuestionType = "yesno" | "tri" | "choice" | "select" | "text" | "password" | "textarea" | "date" | "time" | "datetime" | "number" | "scale" | "duration" | "multi"

/**
 * Tipos de respuesta. `tri` es Sí / No / No sabe (o las `options` que se le
 * pasen, p. ej. "No menciona"). `multi` guarda varios valores de un catálogo
 * separados por coma.
 */
export type Question = {
  id: string
  label: string
  type: QuestionType
  options?: Option[]
  /** Opciones que dependen de otras respuestas (p. ej. horarios del psicooncólogo elegido). */
  optionsFrom?: (v: Values) => Option[]
  /** Unidades de una duración (MINUTE, HOUR, DAY, WEEK, MONTH, YEAR). Por defecto, todas. */
  units?: string[]
  /** Clave de un catálogo ampliable (ver `CatalogSource`): el campo lleva el botón para agregar. */
  catalog?: string
  placeholder?: string
  hint?: string
  required?: boolean
  /** Ocupa las dos columnas. Los textos largos lo hacen por defecto. */
  wide?: boolean
  showIf?: (v: Values) => boolean
}

export type Group = {
  title: string
  description?: string
  /** Ícono de la sección; se ve cuando el grupo va en su tarjeta (`cards`). */
  icon?: LucideIcon
  tone?: Tone
  questions: Question[]
  showIf?: (v: Values) => boolean
}

export const yes = (id: string) => (v: Values) => v[id] === "yes"
export const no = (id: string) => (v: Values) => v[id] === "no"
export const is = (id: string, ...values: string[]) => (v: Values) => values.includes(v[id] ?? "")

export function visibleQuestions(groups: Group[], values: Values) {
  return groups.filter((g) => !g.showIf || g.showIf(values)).flatMap((g) => g.questions.filter((q) => !q.showIf || q.showIf(values)))
}

export function progress(groups: Group[], values: Values) {
  const visible = visibleQuestions(groups, values)
  const answered = visible.filter((q) => values[q.id] !== null && values[q.id] !== undefined && values[q.id] !== "").length
  const missingRequired = visible.filter((q) => q.required && !values[q.id]).length
  return { answered, total: visible.length, missingRequired }
}

/** Valores de una pregunta `multi`. */
export function multiValues(value: string | null | undefined) {
  return value ? value.split(",").filter(Boolean) : []
}
