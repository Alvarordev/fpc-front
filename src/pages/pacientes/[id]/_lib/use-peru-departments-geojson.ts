import { useQuery } from "@tanstack/react-query"
import type { FeatureCollection } from "geojson"
import { PERU_DEPARTMENTS_GEOJSON_URL } from "@/lib/peru-departments"

export const peruDepartmentsGeojsonQueryKey = [
  "peru-departamentos-geojson",
] as const

export function usePeruDepartmentsGeojson() {
  return useQuery({
    queryKey: peruDepartmentsGeojsonQueryKey,
    queryFn: async () => {
      const response = await fetch(PERU_DEPARTMENTS_GEOJSON_URL)
      if (!response.ok) {
        throw new Error("No se pudo cargar el mapa de departamentos")
      }
      return (await response.json()) as FeatureCollection
    },
    staleTime: Infinity,
  })
}
