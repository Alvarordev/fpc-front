import { useQuery } from "@tanstack/react-query";
import { volunteersApi, availabilityApi, appointmentsApi, patientsApi } from "@/lib/api";
import type { Volunteer, AvailabilitySlot, PsychooncologyAppointment, Patient } from "@/types";

export function useVolunteers() {
  return useQuery<Volunteer[]>({
    queryKey: ["volunteers"],
    queryFn: () => volunteersApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useAllSlots() {
  return useQuery<AvailabilitySlot[]>({
    queryKey: ["allSlots"],
    queryFn: async () => {
      const volunteers = await volunteersApi.list();
      const allSlots: AvailabilitySlot[] = [];
      for (const v of volunteers) {
        const slots = await availabilityApi.list(v.id);
        allSlots.push(...slots);
      }
      return allSlots;
    },
    staleTime: 30 * 1000,
  });
}

export function useAllAppointments() {
  return useQuery<PsychooncologyAppointment[]>({
    queryKey: ["allAppointments"],
    queryFn: () => appointmentsApi.list(),
    staleTime: 30 * 1000,
  });
}

export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: () => patientsApi.list(),
    staleTime: 60 * 1000,
  });
}
