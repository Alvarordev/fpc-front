import { geoCentroid, geoMercator, geoPath } from "d3-geo"
import type { Feature, Geometry } from "geojson"

export const DEFAULT_PERU_PROJECTION = {
  center: [-75.5, -9.2] as [number, number],
  scale: 1680,
}

export const DEFAULT_MAP_SIZE = {
  width: 800,
  height: 600,
}

const DEFAULT_PADDING_RATIO = 0.16

export function featureCentroid(
  feature: Feature<Geometry | null>,
): [number, number] | null {
  if (!feature.geometry) return null
  const [lng, lat] = geoCentroid(feature)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

export function fitDepartmentProjection(
  features: Feature<Geometry | null>[],
  size = DEFAULT_MAP_SIZE,
  paddingRatio = DEFAULT_PADDING_RATIO,
): { center: [number, number]; scale: number } {
  const usable = features.filter((feature) => feature.geometry)
  if (usable.length === 0) return DEFAULT_PERU_PROJECTION

  const centroids = usable
    .map((feature) => featureCentroid(feature))
    .filter((centroid): centroid is [number, number] => centroid !== null)

  if (centroids.length === 0) return DEFAULT_PERU_PROJECTION

  const center: [number, number] = [
    centroids.reduce((sum, [lng]) => sum + lng, 0) / centroids.length,
    centroids.reduce((sum, [, lat]) => sum + lat, 0) / centroids.length,
  ]

  const trialScale = 1000
  const trial = geoMercator()
    .center(center)
    .translate([size.width / 2, size.height / 2])
    .scale(trialScale)
  const path = geoPath(trial)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const feature of usable) {
    const bounds = path.bounds(feature)
    minX = Math.min(minX, bounds[0][0])
    minY = Math.min(minY, bounds[0][1])
    maxX = Math.max(maxX, bounds[1][0])
    maxY = Math.max(maxY, bounds[1][1])
  }

  const projectedWidth = maxX - minX
  const projectedHeight = maxY - minY
  if (projectedWidth <= 0 || projectedHeight <= 0) {
    return { center, scale: DEFAULT_PERU_PROJECTION.scale }
  }

  const availableWidth = size.width * (1 - 2 * paddingRatio)
  const availableHeight = size.height * (1 - 2 * paddingRatio)
  const scale =
    trialScale *
    Math.min(availableWidth / projectedWidth, availableHeight / projectedHeight)

  return { center, scale }
}

export function lerpPoint(
  from: [number, number],
  to: [number, number],
  t: number,
): [number, number] {
  return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
}

export function bearingDegrees(
  from: [number, number],
  to: [number, number],
): number {
  const lng1 = toRadians(from[0])
  const lat1 = toRadians(from[1])
  const lng2 = toRadians(to[0])
  const lat2 = toRadians(to[1])
  const y = Math.sin(lng2 - lng1) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}
