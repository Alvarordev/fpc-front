import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/lib/api";
import type { Patient } from "@/types";

export function usePatients(options?: { enabled?: boolean }) {
  return useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => patientsApi.list(),
    enabled: options?.enabled,
    staleTime: 30 * 1000,
  });
}
