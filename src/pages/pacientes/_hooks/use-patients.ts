import { useQuery } from "@tanstack/react-query"
import { patientsApi, type PatientListFilters } from "@/api/patients"

const API_MAX_LIMIT = 100

interface UsePatientsOptions {
  enabled?: boolean
  filters?: PatientListFilters
}

export function usePatients(options: UsePatientsOptions = {}) {
  const filters = options.filters ?? {}

  return useQuery({
    queryKey: ["patients", filters],
    queryFn: () => listAllPatients(filters),
    enabled: options.enabled,
    staleTime: 30 * 1000,
  })
}

async function listAllPatients(filters: PatientListFilters) {
  if (filters.limit != null) {
    return patientsApi.list(filters)
  }

  const first = await patientsApi.list({
    ...filters,
    limit: API_MAX_LIMIT,
    offset: 0,
  })
  if (first.data.length >= first.total) return first

  const pages = [first.data]
  let loaded = first.data.length
  while (loaded < first.total) {
    const next = await patientsApi.list({
      ...filters,
      limit: API_MAX_LIMIT,
      offset: loaded,
    })
    if (next.data.length === 0) break
    pages.push(next.data)
    loaded += next.data.length
  }

  return { data: pages.flat(), total: first.total }
}
