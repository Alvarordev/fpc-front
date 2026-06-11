import { useQuery } from "@tanstack/react-query";
import { recordatoriosApi } from "@/lib/api";
import type { Reminder } from "@/types";

export function useRecordatorios(patientId: string) {
  return useQuery<Reminder[]>({
    queryKey: ["recordatorios", patientId],
    queryFn: () => recordatoriosApi.list(patientId),
    enabled: Boolean(patientId),
    staleTime: 15 * 1000,
  });
}
