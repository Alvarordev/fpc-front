import { useQuery } from "@tanstack/react-query"
import { patientsApi, type PatientListFilters } from "@/api/patients"

interface UsePatientsOptions {
  enabled?: boolean
  filters?: PatientListFilters
}

export function usePatients(options: UsePatientsOptions = {}) {
  const filters = options.filters ?? {}

  return useQuery({
    queryKey: ["patients", filters],
    queryFn: () => patientsApi.list({ limit: 100, ...filters }),
    enabled: options.enabled,
    staleTime: 30 * 1000,
  })
}
