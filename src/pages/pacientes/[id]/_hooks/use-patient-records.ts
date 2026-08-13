import { useQuery } from "@tanstack/react-query"
import { patientsApi } from "@/api/patients"

export function usePatientAddresses(patientId: string, enabled = true) {
  return useQuery({
    queryKey: ["patient-addresses", patientId],
    queryFn: () => patientsApi.listAddresses(patientId),
    enabled: Boolean(patientId) && enabled,
    staleTime: 30 * 1000,
  })
}

export function useTreatmentMedications(
  patientId: string,
  treatmentId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["treatment-medications", patientId, treatmentId],
    queryFn: () => patientsApi.listTreatmentMedications(patientId, treatmentId),
    enabled: Boolean(patientId && treatmentId) && enabled,
    staleTime: 30 * 1000,
  })
}
