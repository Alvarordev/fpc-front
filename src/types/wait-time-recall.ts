import type { components } from "@/api/schema"
import type { DurationUnit } from "@/types/duration"

type DurationPayload = components["schemas"]["DurationDto"]

type UnspecifiedUnit = Extract<DurationUnit, "DAY" | "WEEK" | "MONTH" | "YEAR">

/** Answer to "¿Recuerda el tiempo de espera?". */
export type WaitTimeRecall =
  | "REMEMBERS"
  | "DOES_NOT_REMEMBER"
  | "IMMEDIATE"
  | `UNSPECIFIED_${UnspecifiedUnit}`

/** Answers that store a fixed value instead of an amount typed by the agent. */
export type FixedWaitTimeRecall = Exclude<WaitTimeRecall, "REMEMBERS">

export const WAIT_TIME_IMMEDIATE_LABEL = "Inmediato"

const UNSPECIFIED_LABELS: Record<UnspecifiedUnit, string> = {
  DAY: "No especifica (días)",
  WEEK: "No especifica (semanas)",
  MONTH: "No especifica (meses)",
  YEAR: "No especifica (años)",
}

export const WAIT_TIME_RECALL_OPTIONS: Array<{
  value: WaitTimeRecall
  label: string
}> = [
  { value: "REMEMBERS", label: "Sí recuerda" },
  { value: "DOES_NOT_REMEMBER", label: "No recuerda" },
  { value: "IMMEDIATE", label: WAIT_TIME_IMMEDIATE_LABEL },
  { value: "UNSPECIFIED_DAY", label: UNSPECIFIED_LABELS.DAY },
  { value: "UNSPECIFIED_WEEK", label: UNSPECIFIED_LABELS.WEEK },
  { value: "UNSPECIFIED_MONTH", label: UNSPECIFIED_LABELS.MONTH },
  { value: "UNSPECIFIED_YEAR", label: UNSPECIFIED_LABELS.YEAR },
]

/**
 * Drafts keep `remembers…` for the "Sí recuerda" branch (amount typed or
 * computed from dates) and `waitTimeRecall` for every other answer.
 */
export function resolveWaitTimeRecall(
  remembers: boolean | undefined,
  recall: FixedWaitTimeRecall | undefined,
): WaitTimeRecall {
  return remembers === false ? (recall ?? "DOES_NOT_REMEMBER") : "REMEMBERS"
}

/** Value sent to the API for an answer that has no typed amount. */
export function fixedWaitTime(
  recall: FixedWaitTimeRecall | undefined,
): DurationPayload | null {
  if (!recall || recall === "DOES_NOT_REMEMBER") return null
  if (recall === "IMMEDIATE")
    return { valueMin: 0, unit: "DAY", label: WAIT_TIME_IMMEDIATE_LABEL }
  const unit = recall.replace("UNSPECIFIED_", "") as UnspecifiedUnit
  return { unit, label: UNSPECIFIED_LABELS[unit] }
}

/** Recovers the fixed answer from a stored wait time, if it was one. */
export function fixedWaitTimeRecallFrom(
  duration:
    | { valueMin?: number | null; unit?: string | null; label?: string | null }
    | null
    | undefined,
): FixedWaitTimeRecall | undefined {
  if (!duration?.label) return undefined
  if (duration.label === WAIT_TIME_IMMEDIATE_LABEL) return "IMMEDIATE"
  if (duration.valueMin != null) return undefined
  const unit = (Object.keys(UNSPECIFIED_LABELS) as UnspecifiedUnit[]).find(
    (candidate) => candidate === duration.unit,
  )
  return unit ? `UNSPECIFIED_${unit}` : undefined
}
