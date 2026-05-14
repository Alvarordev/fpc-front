import { useQuery } from "@tanstack/react-query";
import { patientsApi } from "@/lib/api";
import type { Contact } from "@/types";

export function useContacts(patientId: string) {
  return useQuery<Contact[]>({
    queryKey: ["contacts", patientId],
    queryFn: () => patientsApi.getContacts(patientId),
    enabled: Boolean(patientId),
    staleTime: 15 * 1000,
  });
}
