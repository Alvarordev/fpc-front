import { useMemo } from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps"
import type { Feature, Geometry } from "geojson"
import {
  PERU_DEPARTMENT_BY_CODE,
  PERU_DEPARTMENTS_GEOJSON_URL,
} from "@/lib/peru-departments"
import { cn } from "@/lib/utils"
import {
  DEFAULT_PERU_PROJECTION,
  bearingDegrees,
  featureCentroid,
  fitDepartmentProjection,
  lerpPoint,
} from "../_lib/fit-department-projection"
import type {
  PatientCareJourneyHop,
  PatientCareJourneyStop,
} from "../_lib/patient-care-journey"
import { usePeruDepartmentsGeojson } from "../_lib/use-peru-departments-geojson"

const VISITED_FILL = "#b91c1c"
const VISITED_HOVER = "#dc2626"
const PATH_STROKE = "#7f1d1d"

type DepartmentFeature = Feature<Geometry | null> & {
  rsmKey?: string
  properties: {
    FIRST_IDDP?: string | number
    NOMBDEP?: string
  }
}

export function PatientCareJourneyMap({
  departmentCodes,
  hops,
  stops,
  highlightedCode,
  onHighlight,
}: {
  departmentCodes: string[]
  hops: PatientCareJourneyHop[]
  stops: PatientCareJourneyStop[]
  highlightedCode: string | null
  onHighlight: (code: string | null) => void
}) {
  const { data: geography, isLoading } = usePeruDepartmentsGeojson()
  const marked = useMemo(() => new Set(departmentCodes), [departmentCodes])

  const markedFeatures = useMemo(() => {
    if (!geography) return []
    return geography.features.filter((feature) =>
      marked.has(departmentCode(feature as DepartmentFeature)),
    )
  }, [geography, marked])

  const projection = useMemo(
    () => fitDepartmentProjection(markedFeatures),
    [markedFeatures],
  )

  const centroids = useMemo(() => {
    const next = new Map<string, [number, number]>()
    for (const feature of markedFeatures) {
      const code = departmentCode(feature as DepartmentFeature)
      const centroid = featureCentroid(feature)
      if (code && centroid) next.set(code, centroid)
    }
    return next
  }, [markedFeatures])

  if (isLoading) {
    return (
      <div
        className="bg-muted/40 mx-auto h-[28rem] w-full max-w-3xl animate-pulse rounded-xl"
        aria-hidden
      />
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={
          marked.size > 0 ? projection : DEFAULT_PERU_PROJECTION
        }
        aria-label="Mapa de departamentos donde se atendió el paciente"
        className="h-auto w-full"
      >
        <title>Recorrido de atención por departamento</title>
        <Geographies geography={geography ?? PERU_DEPARTMENTS_GEOJSON_URL}>
          {({ geographies }) =>
            geographies.map((geo: DepartmentFeature) => {
              const code = departmentCode(geo)
              const name =
                PERU_DEPARTMENT_BY_CODE.get(code)?.label ??
                String(geo.properties.NOMBDEP ?? code)
              const visited = marked.has(code)
              const highlighted = highlightedCode === code

              return (
                <Geography
                  key={geo.rsmKey ?? code}
                  geography={geo}
                  data-testid={`geography-${code}`}
                  aria-label={name}
                  aria-pressed={highlighted}
                  onMouseEnter={() => onHighlight(code)}
                  onMouseLeave={() => onHighlight(null)}
                  onFocus={() => onHighlight(code)}
                  onBlur={() => onHighlight(null)}
                  style={{
                    default: {
                      fill: visited
                        ? highlighted
                          ? VISITED_HOVER
                          : VISITED_FILL
                        : highlighted
                          ? "#9ca3af"
                          : "var(--muted)",
                      stroke: "var(--background)",
                      strokeWidth: highlighted ? 1.25 : 0.8,
                      outline: "none",
                      cursor: visited ? "pointer" : "default",
                      transition:
                        "fill 120ms ease, stroke 120ms ease, stroke-width 120ms ease",
                    },
                    hover: {
                      fill: visited ? VISITED_HOVER : "#9ca3af",
                      stroke: "var(--foreground)",
                      strokeWidth: 1.25,
                      outline: "none",
                      cursor: visited ? "pointer" : "default",
                    },
                    pressed: {
                      fill: visited ? VISITED_FILL : "var(--muted)",
                      outline: "none",
                    },
                  }}
                />
              )
            })
          }
        </Geographies>

        {hops.map((hop, index) => {
          const from = centroids.get(hop.fromCode)
          const to = centroids.get(hop.toCode)
          if (!from || !to) return null
          const arrowAt = lerpPoint(from, to, 0.82)
          const rotation = bearingDegrees(from, to)
          return (
            <g key={`${hop.fromCode}-${hop.toCode}-${index}`}>
              <Line
                from={from}
                to={to}
                stroke={PATH_STROKE}
                strokeWidth={1.75}
                strokeDasharray="7 5"
                strokeLinecap="round"
                fill="none"
              />
              <Marker coordinates={arrowAt}>
                <polygon
                  points="0,-5 6,5 -6,5"
                  fill={PATH_STROKE}
                  transform={`rotate(${rotation})`}
                />
              </Marker>
            </g>
          )
        })}

        {stops.map((stop) => {
          const coordinates = centroids.get(stop.code)
          if (!coordinates) return null
          const active = highlightedCode === stop.code
          return (
            <Marker key={stop.code} coordinates={coordinates}>
              <circle
                r={active ? 11 : 9}
                fill={active ? VISITED_HOVER : "#7f1d1d"}
                stroke="var(--background)"
                strokeWidth={1.5}
              />
              <text
                textAnchor="middle"
                y={4}
                fill="white"
                fontSize={10}
                fontWeight={600}
                style={{ pointerEvents: "none" }}
              >
                {stop.order}
              </text>
            </Marker>
          )
        })}
      </ComposableMap>
    </div>
  )
}

function departmentCode(feature: DepartmentFeature) {
  return String(feature.properties.FIRST_IDDP ?? "")
}

export function PatientCareJourneyMapLegend({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground mx-auto flex w-full max-w-md items-center justify-center gap-4 text-xs",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm"
          style={{ background: VISITED_FILL }}
          aria-hidden
        />
        Atención registrada
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-px w-5 border-t border-dashed"
          style={{ borderColor: PATH_STROKE }}
          aria-hidden
        />
        Traslado entre regiones
      </span>
    </div>
  )
}
