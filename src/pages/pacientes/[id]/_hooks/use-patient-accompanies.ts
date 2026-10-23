import { useQuery } from "@tanstack/react-query";
import { patientsApi, type CompanionPatient } from "@/api/patients";

export function usePatientAccompanies(id: string, enabled: boolean) {
  return useQuery<CompanionPatient[]>({
    queryKey: ["patient-accompanies", id],
    queryFn: () => patientsApi.accompanies(id),
    enabled: enabled && Boolean(id),
    staleTime: 30 * 1000,
  });
}
