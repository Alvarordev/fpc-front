import type { components } from "@/api/schema"

export type DurationUnit = components["schemas"]["DurationDto"]["unit"]

/** Partial while the user is filling the two numeric fields and the unit. */
export interface DurationDraft {
  valueMin?: number
  valueMax?: number
  unit?: DurationUnit
}

export type DurationInput = {
  valueMin: number
  valueMax?: number
  unit: DurationUnit
}

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  MINUTE: "Minutos",
  HOUR: "Horas",
  DAY: "Días",
  WEEK: "Semanas",
  MONTH: "Meses",
  YEAR: "Años",
}

export const DURATION_UNIT_OPTIONS = Object.entries(DURATION_UNIT_LABELS).map(
  ([value, label]) => ({ value: value as DurationUnit, label }),
)

export const DURATION_UNIT_MINUTES: Record<DurationUnit, number> = {
  MINUTE: 1,
  HOUR: 60,
  DAY: 60 * 24,
  WEEK: 60 * 24 * 7,
  MONTH: 60 * 24 * 30,
  YEAR: 60 * 24 * 365,
}

function roundDurationValue(value: number): number {
  return Math.round(value * 100) / 100
}

export function convertDurationValue(
  value: number,
  fromUnit: DurationUnit,
  toUnit: DurationUnit,
): number {
  return roundDurationValue(
    (value * DURATION_UNIT_MINUTES[fromUnit]) / DURATION_UNIT_MINUTES[toUnit],
  )
}

export function calculateDurationBetweenDates(
  firstDate?: string | null,
  secondDate?: string | null,
): DurationDraft | undefined {
  if (!firstDate || !secondDate) return undefined

  const first = Date.parse(`${firstDate}T00:00:00Z`)
  const second = Date.parse(`${secondDate}T00:00:00Z`)
  if (!Number.isFinite(first) || !Number.isFinite(second) || second < first)
    return undefined

  const days = Math.round((second - first) / (1000 * 60 * 60 * 24))
  if (days < 60) return { valueMin: days, unit: "DAY" }
  if (days < 730)
    return { valueMin: roundDurationValue(days / 30), unit: "MONTH" }
  return { valueMin: roundDurationValue(days / 365), unit: "YEAR" }
}

function unitFromLegacyLabel(label: string): DurationUnit | undefined {
  const normalized = label.toLowerCase()
  if (normalized.startsWith("min")) return "MINUTE"
  if (normalized.startsWith("h")) return "HOUR"
  if (normalized.startsWith("d")) return "DAY"
  if (normalized.startsWith("sem")) return "WEEK"
  if (normalized.startsWith("mes")) return "MONTH"
  if (normalized.startsWith("a")) return "YEAR"
  return undefined
}

/** Converts both API responses and values from the old free-text draft. */
export function normalizeDuration(value: unknown): DurationDraft | undefined {
  if (!value) return undefined

  if (typeof value === "string") {
    const match = value.match(
      /(\d+(?:[.,]\d+)?)(?:\s*(?:a|-)\s*(\d+(?:[.,]\d+)?))?\s*(min\w*|h\w*|d(?:í|i)\w*|sem\w*|mes\w*|a(?:ñ|n)\w*)/i,
    )
    if (!match) return undefined
    const valueMin = Number(match[1].replace(",", "."))
    const valueMax = match[2] ? Number(match[2].replace(",", ".")) : undefined
    const unit = unitFromLegacyLabel(match[3])
    if (
      !unit ||
      !Number.isFinite(valueMin) ||
      (valueMax !== undefined && !Number.isFinite(valueMax))
    )
      return undefined
    return { valueMin, ...(valueMax !== undefined ? { valueMax } : {}), unit }
  }

  if (typeof value !== "object") return undefined
  const candidate = value as {
    valueMin?: unknown
    valueMax?: unknown
    unit?: unknown
  }
  const draft: DurationDraft = {}
  if (
    typeof candidate.valueMin === "number" &&
    Number.isFinite(candidate.valueMin) &&
    candidate.valueMin >= 0
  )
    draft.valueMin = candidate.valueMin
  if (
    typeof candidate.valueMax === "number" &&
    Number.isFinite(candidate.valueMax) &&
    candidate.valueMax >= 0
  )
    draft.valueMax = candidate.valueMax
  if (
    typeof candidate.unit === "string" &&
    candidate.unit in DURATION_UNIT_LABELS
  )
    draft.unit = candidate.unit as DurationUnit
  return Object.keys(draft).length ? draft : undefined
}

export function toDurationInput(
  value: DurationDraft | null | undefined,
): DurationInput | undefined {
  if (value?.valueMin === undefined || value.unit === undefined)
    return undefined
  if (value.valueMin < 0) return undefined
  if (value.valueMax !== undefined && value.valueMax < value.valueMin)
    return undefined

  return {
    valueMin: value.valueMin,
    ...(value.valueMax !== undefined ? { valueMax: value.valueMax } : {}),
    unit: value.unit,
  }
}

export function isInvalidDuration(
  value: DurationDraft | null | undefined,
): boolean {
  return Boolean(
    value &&
    value.valueMin !== undefined &&
    value.valueMax !== undefined &&
    value.valueMax < value.valueMin,
  )
}
