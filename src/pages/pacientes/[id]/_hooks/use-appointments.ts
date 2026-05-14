import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, volunteersApi } from "@/lib/api";
import type { PsychooncologyAppointment, Volunteer } from "@/types";

export function usePatientAppointments(patientId: string) {
  return useQuery<PsychooncologyAppointment[]>({
    queryKey: ["appointments", patientId],
    queryFn: () => appointmentsApi.list({ patientId }),
    enabled: Boolean(patientId),
    staleTime: 15 * 1000,
  });
}

export function useVolunteers() {
  return useQuery<Volunteer[]>({
    queryKey: ["volunteers"],
    queryFn: () => volunteersApi.list(),
    staleTime: 60 * 1000,
  });
}
