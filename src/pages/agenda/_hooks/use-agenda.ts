import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, patientsApi } from "@/lib/api";
import type { PsychooncologyAppointment, Patient } from "@/types";

/**
 * Fetches all psychooncology appointments for a volunteer
 * and resolves patient names by fetching each patient individually.
 */
export function useAgenda(volunteerId: string | undefined) {
  const appointmentsQuery = useQuery({
    queryKey: ["agenda", volunteerId],
    queryFn: () =>
      appointmentsApi.list({ volunteerId: volunteerId! }),
    enabled: Boolean(volunteerId),
  });

  const appointments: PsychooncologyAppointment[] =
    appointmentsQuery.data ?? [];

  // Extract unique patient IDs from appointments
  const patientIds = [
    ...new Set(appointments.map((a) => a.patientId)),
  ];

  const patientsQuery = useQuery({
    queryKey: ["agendaPatients", patientIds],
    queryFn: async (): Promise<Map<string, Patient>> => {
      if (patientIds.length === 0) return new Map();
      const results = await Promise.all(
        patientIds.map((id) => patientsApi.getById(id)),
      );
      const map = new Map<string, Patient>();
      for (const p of results) {
        map.set(p.id, p);
      }
      return map;
    },
    enabled: appointmentsQuery.isSuccess && patientIds.length > 0,
  });

  const patients = patientsQuery.data ?? new Map();

  return {
    appointments,
    patients,
    isLoading:
      appointmentsQuery.isLoading || patientsQuery.isLoading,
  };
}
