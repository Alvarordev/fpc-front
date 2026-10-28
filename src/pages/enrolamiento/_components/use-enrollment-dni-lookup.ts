import { useQuery } from "@tanstack/react-query"
import { patientsApi } from "@/api/patients"

export type DniLookupState =
  | "idle"
  | "loading"
  | "none"
  | "reenroll"
  | "blocked"
  | "prospect"

export function useEnrollmentDniLookup(
  documentType: string | null | undefined,
  dni: string | null | undefined,
) {
  const normalized = (dni ?? "").trim()
  const enabled = documentType === "DNI" && /^\d{8}$/.test(normalized)
  const query = useQuery({
    queryKey: ["patients", "dni-lookup", normalized],
    queryFn: () => patientsApi.list({ search: normalized, limit: 5 }),
    enabled,
    staleTime: 15_000,
  })
  const match = enabled
    ? query.data?.data.find(
        (item) => item.dni === normalized && item.role === "PATIENT",
      )
    : undefined

  let state: DniLookupState
  if (!enabled) state = "idle"
  else if (query.isFetching && !match) state = "loading"
  else if (!match) state = "none"
  else if (
    match.activityStatus === "INACTIVE" ||
    match.healthSubcategory === "CANCER_RULED_OUT"
  )
    state = "reenroll"
  else if (match.status === "UNENROLLED") state = "prospect"
  else state = "blocked"

  return { state, match }
}
