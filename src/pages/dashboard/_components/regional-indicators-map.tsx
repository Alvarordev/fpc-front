import { useState, type KeyboardEvent, type MouseEvent } from "react"
import { createPortal } from "react-dom"
import { scaleLinear } from "d3-scale"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PERU_DEPARTMENTS, type IndicatorMap } from "./regional-indicators"

const GEO_URL = "/peru-departamentos.geojson"
const numberFormat = new Intl.NumberFormat("es-PE")
const percentageFormat = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 1,
})

const departmentByCode = new Map<string, (typeof PERU_DEPARTMENTS)[number]>(
  PERU_DEPARTMENTS.map((department) => [department.code, department]),
)

export interface RegionalIndicator {
  id: string
  label: string
  description: string
  data: IndicatorMap
  known: number
  unknown: number
  coveragePct: number
  colorRange?: [string, string]
  formatValue?: (value: number) => string
}

export interface PeruMapProps {
  data: IndicatorMap
  colorRange?: [string, string]
  onSelect?: (codigo: string, nombre: string) => void
  formatValue?: (value: number) => string
  highlightedCode?: string | null
  selectedCode?: string | null
  onHighlight?: (codigo: string | null) => void
}

interface TooltipState {
  x: number
  y: number
  code: string
  name: string
  value: number | undefined
}

export function PeruMap({
  data,
  colorRange = ["#e5e7eb", "#52525b"],
  onSelect,
  formatValue = (value) => numberFormat.format(value),
  highlightedCode,
  selectedCode,
  onHighlight,
}: PeruMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const values = Object.values(data)
  const min = values.length > 0 ? Math.min(...values) : 0
  const rawMax = values.length > 0 ? Math.max(...values) : 1
  const max = rawMax === min ? min + 1 : rawMax
  const colorScale = scaleLinear<string>().domain([min, max]).range(colorRange)

  function showTooltip(
    event: MouseEvent<SVGPathElement>,
    code: string,
    name: string,
    value: number | undefined,
  ) {
    setTooltip({
      x: event.clientX,
      y: event.clientY,
      code,
      name,
      value,
    })
    onHighlight?.(code)
  }

  function selectWithKeyboard(
    event: KeyboardEvent<SVGPathElement>,
    code: string,
    name: string,
  ) {
    if (!onSelect || (event.key !== "Enter" && event.key !== " ")) return
    event.preventDefault()
    onSelect(code, name)
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-75.5, -9.2], scale: 1500 }}
        aria-label="Mapa interactivo del Perú por departamento"
        className="h-auto w-full"
      >
        <title>Mapa interactivo del Perú por departamento</title>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = String(geo.properties.FIRST_IDDP)
              const department = departmentByCode.get(code)
              const name = department?.label ?? String(geo.properties.NOMBDEP)
              const value = data[code]
              const isHighlighted = highlightedCode === code
              const isSelected = selectedCode === code
              const fill =
                value === undefined ? "var(--muted)" : colorScale(value)
              const activeFill = value === undefined ? "#9ca3af" : colorRange[1]

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  role={onSelect ? "button" : undefined}
                  tabIndex={onSelect ? 0 : undefined}
                  aria-label={`${name}: ${value === undefined ? "sin dato" : formatValue(value)}`}
                  aria-pressed={onSelect ? isSelected : undefined}
                  onMouseEnter={(event) =>
                    showTooltip(event, code, name, value)
                  }
                  onMouseMove={(event) =>
                    setTooltip((current) =>
                      current
                        ? { ...current, x: event.clientX, y: event.clientY }
                        : current,
                    )
                  }
                  onMouseLeave={() => {
                    setTooltip(null)
                    onHighlight?.(null)
                  }}
                  onFocus={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect()
                    setTooltip({
                      x: bounds.left + bounds.width / 2,
                      y: bounds.top + bounds.height / 2,
                      code,
                      name,
                      value,
                    })
                    onHighlight?.(code)
                  }}
                  onBlur={() => {
                    setTooltip(null)
                    onHighlight?.(null)
                  }}
                  onClick={() => onSelect?.(code, name)}
                  onKeyDown={(event) => selectWithKeyboard(event, code, name)}
                  style={{
                    default: {
                      fill: isSelected
                        ? "var(--primary)"
                        : isHighlighted
                          ? activeFill
                          : fill,
                      stroke: isSelected
                        ? "var(--foreground)"
                        : "var(--background)",
                      strokeWidth: isSelected ? 1.5 : 0.8,
                      outline: "none",
                      cursor: onSelect ? "pointer" : "default",
                      transition:
                        "fill 120ms ease, stroke 120ms ease, stroke-width 120ms ease",
                    },
                    hover: {
                      fill: activeFill,
                      stroke: "var(--foreground)",
                      strokeWidth: 1.25,
                      outline: "none",
                      cursor: onSelect ? "pointer" : "default",
                    },
                    pressed: {
                      fill: "var(--primary)",
                      stroke: "var(--foreground)",
                      strokeWidth: 1.5,
                      outline: "none",
                    },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <MapTooltip tooltip={tooltip} formatValue={formatValue} />,
            document.body,
          )
        : null}
    </div>
  )
}

export function RegionalIndicatorsMap({
  indicators,
}: {
  indicators: RegionalIndicator[]
}) {
  const [indicatorId, setIndicatorId] = useState(indicators[0]?.id ?? "")
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const indicator =
    indicators.find((item) => item.id === indicatorId) ?? indicators[0]

  if (!indicator) return null

  const formatValue =
    indicator.formatValue ?? ((value) => numberFormat.format(value))
  const rows = PERU_DEPARTMENTS.map((department) => ({
    ...department,
    value: indicator.data[department.code],
  })).sort((a, b) => {
    if (a.value === undefined) return 1
    if (b.value === undefined) return -1
    return b.value - a.value || a.label.localeCompare(b.label, "es-PE")
  })
  const maxValue = Math.max(1, ...rows.map((row) => row.value ?? 0))
  const activeCode = hoveredCode ?? selectedCode
  const activeRow = rows.find((row) => row.code === activeCode)
  const activeRank = activeRow
    ? rows.findIndex((row) => row.code === activeRow.code) + 1
    : null
  const selectorItems = indicators.map((item) => ({
    value: item.id,
    label: item.label,
  }))

  function toggleSelection(code: string) {
    setSelectedCode((current) => (current === code ? null : code))
  }

  return (
    <Card className="gap-0">
      <CardHeader className="border-b pb-5">
        <div>
          <CardTitle>Distribución territorial</CardTitle>
          <CardDescription className="mt-1 max-w-2xl">
            Pacientes registrados por departamento de residencia. Los valores
            absolutos no representan incidencia poblacional.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="outline">
            Cobertura {percentageFormat.format(indicator.coveragePct)}%
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid p-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="bg-muted/20 flex min-h-[32rem] flex-col justify-between p-4 sm:p-6">
          <PeruMap
            data={indicator.data}
            colorRange={indicator.colorRange}
            formatValue={formatValue}
            highlightedCode={hoveredCode}
            selectedCode={selectedCode}
            onHighlight={setHoveredCode}
            onSelect={(code) => toggleSelection(code)}
          />

          <div className="mx-auto mt-3 w-full max-w-md space-y-2">
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span>Menor volumen</span>
              <div
                className="h-2 flex-1 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${indicator.colorRange?.[0] ?? "#e5e7eb"}, ${indicator.colorRange?.[1] ?? "#52525b"})`,
                }}
              />
              <span>Mayor volumen</span>
            </div>
            <p className="text-muted-foreground text-center text-xs">
              Selecciona un departamento para mantener su detalle visible.
            </p>
          </div>
        </div>

        <div className="border-t p-4 sm:p-6 xl:border-t-0 xl:border-l">
          {indicators.length > 1 ? (
            <div className="mb-5 space-y-2">
              <label className="text-muted-foreground text-xs font-medium">
                Indicador
              </label>
              <Select
                value={indicator.id}
                onValueChange={(value) => {
                  if (value) {
                    setIndicatorId(value)
                    setHoveredCode(null)
                    setSelectedCode(null)
                  }
                }}
                items={selectorItems}
              >
                <SelectTrigger aria-label="Indicador">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectorItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mb-5">
              <p className="text-muted-foreground text-xs font-medium">
                Indicador
              </p>
              <p className="mt-1 font-medium">{indicator.label}</p>
            </div>
          )}

          <div className="bg-muted/25 mb-5 rounded-xl border p-4">
            {activeRow && activeRow.value !== undefined ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{activeRow.label}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Puesto {activeRank} de {rows.length}
                    </p>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatValue(activeRow.value)}
                  </p>
                </div>
                <p className="text-muted-foreground mt-3 text-xs">
                  {formatPercentage(activeRow.value, indicator.known)} del total
                  con residencia conocida
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">Cobertura del indicador</p>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {numberFormat.format(indicator.known)} conocidos ·{" "}
                  {numberFormat.format(indicator.unknown)} sin información
                </p>
              </div>
            )}
          </div>

          <div className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-medium">
            <span>Departamento</span>
            <span>Pacientes</span>
          </div>
          <div
            className="max-h-[25rem] space-y-1 overflow-y-auto pr-2"
            aria-label="Ranking de departamentos"
          >
            {rows.map((row, index) => {
              const isSelected = selectedCode === row.code
              const isActive = activeCode === row.code
              const width = ((row.value ?? 0) / maxValue) * 100

              return (
                <button
                  key={row.code}
                  type="button"
                  aria-pressed={isSelected}
                  onMouseEnter={() => setHoveredCode(row.code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onFocus={() => setHoveredCode(row.code)}
                  onBlur={() => setHoveredCode(null)}
                  onClick={() => toggleSelection(row.code)}
                  className={cn(
                    "focus-visible:ring-ring/50 w-full rounded-lg px-3 py-2.5 text-left transition-[background-color,box-shadow,transform] duration-150 outline-none focus-visible:ring-3 active:scale-[0.99]",
                    isActive && "bg-accent",
                    isSelected && "ring-foreground/15 ring-1",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {row.value === undefined
                        ? "Sin dato"
                        : formatValue(row.value)}
                    </span>
                  </div>
                  <div className="bg-muted mt-2 ml-8 h-1 overflow-hidden rounded-full">
                    <div
                      className="bg-chart-2 h-full rounded-full transition-[width] duration-200"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          <p className="text-muted-foreground mt-4 border-t pt-4 text-xs leading-relaxed">
            {indicator.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function MapTooltip({
  tooltip,
  formatValue,
}: {
  tooltip: TooltipState
  formatValue: (value: number) => string
}) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const left = Math.max(8, Math.min(tooltip.x + 14, viewportWidth - 190))
  const top = Math.max(8, Math.min(tooltip.y + 14, viewportHeight - 72))

  return (
    <div
      role="tooltip"
      data-region-code={tooltip.code}
      className="bg-popover text-popover-foreground ring-foreground/10 pointer-events-none fixed z-50 min-w-36 rounded-lg px-3 py-2 text-sm shadow-md ring-1"
      style={{ left, top }}
    >
      <p className="font-medium">{tooltip.name}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">
        {tooltip.value === undefined
          ? "Sin dato"
          : `${formatValue(tooltip.value)} pacientes`}
      </p>
    </div>
  )
}

function formatPercentage(value: number, total: number) {
  if (total === 0) return "0%"
  return `${percentageFormat.format((value / total) * 100)}%`
}
