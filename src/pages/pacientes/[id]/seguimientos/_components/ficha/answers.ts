import { useState } from "react"
import { progress, type Group, type Option, type Values } from "@/components/ds/questions"
import { normalizeDuration, type DurationDraft, type DurationUnit } from "@/types/duration"

// Conversión entre las respuestas de `QuestionForm` (texto) y los borradores
// tipados que se guardan al completar el seguimiento.

/** Sí / No / No menciona: `null` en el borrador es "no menciona". */
export const TRI_MENTION: Option[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "No menciona" },
]

export const fromBool = (value: boolean | null | undefined): string | null =>
  value === true ? "yes" : value === false ? "no" : value === null ? "unknown" : null

export function toBool(value: string | null | undefined): boolean | undefined {
  return value === "yes" ? true : value === "no" ? false : undefined
}

/** Para las preguntas con "No menciona", que se guarda como `null`. */
export function toTri(value: string | null | undefined): boolean | null | undefined {
  return value === "unknown" ? null : toBool(value)
}

export const text = (value: string | null | undefined) => value?.trim() || undefined

export function toInt(value: string | null | undefined) {
  if (!value) return undefined
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 ? n : undefined
}

export const fromNumber = (value: number | null | undefined) => (value === null || value === undefined ? null : String(value))

export function fromDuration(value: unknown): string | null {
  const d = normalizeDuration(value)
  return d?.valueMin !== undefined && d.unit ? `${d.valueMin} ${d.unit}` : null
}

export function toDuration(value: string | null | undefined): DurationDraft | undefined {
  if (!value) return undefined
  const [amount, unit] = value.split(" ")
  const valueMin = Number(amount)
  return Number.isFinite(valueMin) ? { valueMin, unit: unit as DurationUnit } : undefined
}

/** Quita las claves sin valor para que el formulario las muestre vacías. */
export function compact(values: Record<string, string | null | undefined>): Values {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Values
}

/** Si están respondidas las obligatorias visibles de estos grupos. */
export const complete = (groups: Group[], values: Values) => progress(groups, values).missingRequired === 0

/**
 * Respuestas de una pestaña. Cada cambio llama a `onChange` con las respuestas
 * nuevas y la pregunta que cambió; la pestaña decide qué guarda en el borrador,
 * sin botón de "Guardar". Lo que no se toca no llega al borrador.
 */
export function useAnswers(initial: () => Values, onChange: (values: Values, changed: string) => void) {
  const [values, setValues] = useState<Values>(initial)
  function answer(id: string, value: string | null) {
    const next = { ...values, [id]: value }
    setValues(next)
    onChange(next, id)
  }
  return { values, answer }
}
