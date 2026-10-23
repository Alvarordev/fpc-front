import { describe, expect, it } from "vitest"
import type { Feature, Polygon } from "geojson"
import {
  DEFAULT_PERU_PROJECTION,
  bearingDegrees,
  fitDepartmentProjection,
  lerpPoint,
} from "./fit-department-projection"

function square(lng: number, lat: number, size = 1): Feature<Polygon> {
  // d3-geo treats clockwise rings as the small spherical polygon.
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng, lat],
          [lng, lat + size],
          [lng + size, lat + size],
          [lng + size, lat],
          [lng, lat],
        ],
      ],
    },
  }
}

describe("fitDepartmentProjection", () => {
  it("returns the full-Peru projection when there are no features", () => {
    expect(fitDepartmentProjection([])).toEqual(DEFAULT_PERU_PROJECTION)
  })

  it("zooms into a single department farther than the country view", () => {
    const lima = square(-77.1, -12.2, 0.8)
    const fitted = fitDepartmentProjection([lima])

    expect(fitted.scale).toBeGreaterThan(DEFAULT_PERU_PROJECTION.scale * 2)
    expect(fitted.center[0]).toBeCloseTo(-76.7, 1)
    expect(fitted.center[1]).toBeCloseTo(-11.8, 1)
  })

  it("keeps two distant departments in view with a scale close to the country", () => {
    const tumbes = square(-80.6, -4, 0.6)
    const tacna = square(-70.4, -18.2, 0.6)
    const fitted = fitDepartmentProjection([tumbes, tacna])
    const limaOnly = fitDepartmentProjection([square(-77.1, -12.2, 0.8)])

    expect(fitted.scale).toBeLessThan(limaOnly.scale)
    expect(fitted.scale).toBeGreaterThan(DEFAULT_PERU_PROJECTION.scale * 0.4)
    expect(fitted.center[0]).toBeCloseTo(-75.2, 0)
    expect(fitted.center[1]).toBeCloseTo(-10.8, 0)
  })
})

describe("path helpers", () => {
  it("interpolates a point along a hop", () => {
    expect(lerpPoint([-77, -12], [-71, -16], 0.5)).toEqual([-74, -14])
  })

  it("computes a south-east bearing between two points", () => {
    const bearing = bearingDegrees([-77, -12], [-71, -16])
    expect(bearing).toBeGreaterThan(90)
    expect(bearing).toBeLessThan(160)
  })
})
