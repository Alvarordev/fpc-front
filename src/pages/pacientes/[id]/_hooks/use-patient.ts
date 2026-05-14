import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/lib/api";
import type { Patient } from "@/types";

export function usePatient(id: string) {
  return useQuery<Patient>({
    queryKey: ["patients", id],
    queryFn: () => patientsApi.getById(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}
