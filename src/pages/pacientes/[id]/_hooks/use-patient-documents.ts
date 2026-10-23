import { useQuery } from "@tanstack/react-query"
import {
  patientDocumentsApi,
  type PatientDocumentListFilters,
} from "@/api/patient-documents"

export function usePatientDocuments(
  patientId: string,
  filters: PatientDocumentListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["patient-documents", patientId, filters],
    queryFn: () => patientDocumentsApi.list(patientId, filters),
    enabled: Boolean(patientId) && enabled,
    staleTime: 30_000,
  })
}
