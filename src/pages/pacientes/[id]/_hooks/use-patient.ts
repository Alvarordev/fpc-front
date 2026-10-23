import { useQuery } from "@tanstack/react-query";
import { patientsApi, type PatientDetailsResponse } from "@/api/patients";

export function usePatient(id: string) {
  return useQuery<PatientDetailsResponse>({
    queryKey: ["patient-profile", id],
    queryFn: () => patientsApi.getById(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}
