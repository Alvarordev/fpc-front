import { useQuery } from "@tanstack/react-query";
import { psychooncologyAppointmentsApi, type PsychooncologyAppointment } from "@/api/psychooncology-appointments";
import { patientsApi, type PatientDetailsResponse } from "@/api/patients";

/**
 * Fetches all psychooncology appointments for a volunteer
 * and resolves patient names by fetching each patient individually.
 */
export function useAgenda(volunteerId: string | undefined) {
  const appointmentsQuery = useQuery({
    queryKey: ["agenda", volunteerId],
    queryFn: () =>
      psychooncologyAppointmentsApi.list({ volunteerId: volunteerId! }),
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
    queryFn: async (): Promise<Map<string, PatientDetailsResponse>> => {
      if (patientIds.length === 0) return new Map();
      const results = await Promise.all(
        patientIds.map((id) => patientsApi.getById(id)),
      );
      const map = new Map<string, PatientDetailsResponse>();
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
