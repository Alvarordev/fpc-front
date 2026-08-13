import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DURATION_UNIT_LABELS,
  DURATION_UNIT_OPTIONS,
  isInvalidDuration,
  convertDurationValue,
  type DurationDraft,
  type DurationUnit,
} from "@/types/duration"
import { cn } from "@/lib/utils"

interface DurationInputProps {
  value?: DurationDraft
  onChange: (value: DurationDraft | undefined) => void
  units?: readonly DurationUnit[]
  label?: string
  className?: string
  /** Render an exact duration instead of a range. */
  singleValue?: boolean
  /** Unit shown before the user enters a value. */
  defaultUnit?: DurationUnit
}

function parseNumber(rawValue: string): number | undefined {
  const normalized = rawValue.trim().replace(",", ".")
  if (!normalized) return undefined
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value)
}

export function DurationInput({
  value,
  onChange,
  units,
  label,
  className,
  singleValue = false,
  defaultUnit,
}: DurationInputProps) {
  const options = units
    ? DURATION_UNIT_OPTIONS.filter((option) => units.includes(option.value))
    : DURATION_UNIT_OPTIONS
  const invalidRange = isInvalidDuration(value)
  const fieldLabel = label ?? "Duración"
  const fallbackUnit =
    defaultUnit && options.some((option) => option.value === defaultUnit)
      ? defaultUnit
      : options[0]?.value
  const selectedUnit = value?.unit ?? fallbackUnit
  const [minText, setMinText] = useState<string | null>(null)
  const [maxText, setMaxText] = useState<string | null>(null)
  const [lastMinValue, setLastMinValue] = useState(value?.valueMin)
  const [lastMaxValue, setLastMaxValue] = useState(value?.valueMax)
  const displayedMinText =
    minText !== null && lastMinValue === value?.valueMin
      ? minText
      : formatNumber(value?.valueMin)
  const displayedMaxText =
    maxText !== null && lastMaxValue === value?.valueMax
      ? maxText
      : formatNumber(value?.valueMax)

  function update(partial: Partial<DurationDraft>) {
    const next = {
      ...value,
      ...(!value?.unit && singleValue && fallbackUnit
        ? { unit: fallbackUnit }
        : {}),
      ...partial,
    }
    if (singleValue && next.valueMin === undefined) {
      const hasExplicitUnit = Object.prototype.hasOwnProperty.call(partial, "unit")
      const unitToKeep = hasExplicitUnit ? partial.unit : value?.unit
      onChange(unitToKeep !== undefined ? { unit: unitToKeep } : undefined)
      return
    }

    const cleaned: DurationDraft = {}

    if (next.valueMin !== undefined) cleaned.valueMin = next.valueMin
    if (!singleValue && next.valueMax !== undefined)
      cleaned.valueMax = next.valueMax
    if (next.unit !== undefined) cleaned.unit = next.unit

    onChange(Object.keys(cleaned).length ? cleaned : undefined)
  }

  function updateNumber(field: "valueMin" | "valueMax", rawValue: string) {
    const setText = field === "valueMin" ? setMinText : setMaxText
    setText(rawValue)

    const parsed = parseNumber(rawValue)
    if (parsed === undefined && rawValue.trim()) {
      if (field === "valueMin") setLastMinValue(value?.valueMin)
      else setLastMaxValue(value?.valueMax)
    }
    if (!rawValue.trim() || parsed !== undefined) {
      if (field === "valueMin") setLastMinValue(parsed)
      else setLastMaxValue(parsed)
      update({ [field]: parsed })
    }
  }

  function normalizeNumber(
    field: "valueMin" | "valueMax",
    rawValue: string,
    input: HTMLInputElement,
  ) {
    const parsed = parseNumber(rawValue)
    const setText = field === "valueMin" ? setMinText : setMaxText
    if (parsed === undefined) {
      const formatted = formatNumber(
        field === "valueMin" ? value?.valueMin : value?.valueMax,
      )
      setText(formatted)
      input.value = formatted
      return
    }
    const formatted = formatNumber(parsed)
    if (field === "valueMin") setLastMinValue(parsed)
    else setLastMaxValue(parsed)
    setText(formatted)
    input.value = formatted
  }

  function updateUnit(nextUnit: DurationUnit | undefined) {
    if (!nextUnit) {
      onChange(
        singleValue && value?.valueMin === undefined
          ? undefined
          : { ...value, unit: undefined },
      )
      return
    }

    const currentUnit = value?.unit ?? selectedUnit
    if (!currentUnit || currentUnit === nextUnit) {
      if (value?.valueMin === undefined) {
        setLastMinValue(undefined)
        setMinText(null)
      }
      update({ unit: nextUnit })
      return
    }

    if (value?.valueMin !== undefined) {
      const convertedMin = convertDurationValue(
        value.valueMin,
        currentUnit,
        nextUnit,
      )
      setLastMinValue(convertedMin)
      setMinText(formatNumber(convertedMin))
    } else {
      setLastMinValue(undefined)
      setMinText(null)
    }
    if (!singleValue && value?.valueMax !== undefined) {
      const convertedMax = convertDurationValue(
        value.valueMax,
        currentUnit,
        nextUnit,
      )
      setLastMaxValue(convertedMax)
      setMaxText(formatNumber(convertedMax))
    } else if (singleValue) {
      setLastMaxValue(undefined)
      setMaxText(null)
    }

    update({
      unit: nextUnit,
      ...(value?.valueMin !== undefined
        ? {
            valueMin: convertDurationValue(
              value.valueMin,
              currentUnit,
              nextUnit,
            ),
          }
        : {}),
      ...(!singleValue && value?.valueMax !== undefined
        ? {
            valueMax: convertDurationValue(
              value.valueMax,
              currentUnit,
              nextUnit,
            ),
          }
        : {}),
    })
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          "grid items-center gap-2",
          singleValue
            ? "grid-cols-[minmax(0,1fr)_minmax(8rem,auto)]"
            : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(8rem,auto)]",
        )}
      >
        <Input
          type="text"
          min={0}
          inputMode="decimal"
          value={displayedMinText}
          onChange={(event) => updateNumber("valueMin", event.target.value)}
          onBlur={(event) =>
            normalizeNumber("valueMin", event.target.value, event.currentTarget)
          }
          placeholder={singleValue ? "Cantidad" : "Desde"}
          aria-label={`${fieldLabel}, ${singleValue ? "cantidad" : "valor mínimo"}`}
          aria-invalid={invalidRange}
        />
        {!singleValue && (
          <>
            <span className="text-muted-foreground text-sm">a</span>
            <Input
              type="text"
              min={0}
              inputMode="decimal"
              value={displayedMaxText}
              onChange={(event) => updateNumber("valueMax", event.target.value)}
              onBlur={(event) =>
                normalizeNumber(
                  "valueMax",
                  event.target.value,
                  event.currentTarget,
                )
              }
              placeholder="Hasta (opcional)"
              aria-label={`${fieldLabel}, valor máximo`}
              aria-invalid={invalidRange}
            />
          </>
        )}
        <Select
          items={options}
          value={selectedUnit ?? ""}
          onValueChange={(nextUnit) =>
            updateUnit((nextUnit || undefined) as DurationUnit | undefined)
          }
        >
          <SelectTrigger aria-label={`${fieldLabel}, unidad`}>
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {invalidRange && (
        <p className="text-destructive text-xs">
          El valor máximo debe ser mayor o igual al mínimo.
        </p>
      )}
      {value?.valueMin !== undefined && !value.unit && (
        <p className="text-muted-foreground text-xs">Selecciona una unidad.</p>
      )}
      {value?.unit && value.valueMin === undefined && (
        <p className="text-muted-foreground text-xs">
          {singleValue ? "Indica la cantidad." : "Indica el valor mínimo."}
        </p>
      )}
      {value?.unit && value.valueMin !== undefined && !invalidRange && (
        <p className="sr-only">
          Unidad seleccionada: {DURATION_UNIT_LABELS[value.unit]}
        </p>
      )}
    </div>
  )
}
