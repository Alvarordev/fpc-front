import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/api/patients";

export function usePatients(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["patients"],
    queryFn: () => patientsApi.list({ limit: 100 }),
    enabled: options?.enabled,
    staleTime: 30 * 1000,
  });
}
