import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { volunteersApi } from "@/api/volunteers";
import { toast } from "sonner";
import type { CreateAvailabilityInput, VolunteerAvailability } from "@/api/volunteers";

/**
 * Fetches the current volunteer's availability slots.
 *
 * NOTE: The backend currently restricts POST/PUT/DELETE availability endpoints
 * to ADMIN role. These mutations will fail with 403 if called by a VOLUNTEER.
 * The backend must be updated to allow volunteers to manage their own slots.
 */

export function useMySlots(volunteerId: string | undefined) {
  return useQuery({
    queryKey: ["myAvailability", volunteerId],
    queryFn: () => volunteersApi.listAvailability(volunteerId!),
    enabled: Boolean(volunteerId),
    staleTime: 30 * 1000,
  });
}

export function useCreateSlot(volunteerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAvailabilityInput) => volunteersApi.createAvailability(volunteerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myAvailability", volunteerId],
      });
      queryClient.invalidateQueries({ queryKey: ["allSlots"] });
    },
    // Toast is handled by the caller (form) to avoid multiple toasts for bulk
  });
}

export interface BulkSlotPayload {
  date: string;
  startTime: string;
  endTime: string;
}

export function useCreateBulkSlots(volunteerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slots: BulkSlotPayload[]) => {
      const results: VolunteerAvailability[] = [];
      for (const slot of slots) {
        const created = await volunteersApi.createAvailability(volunteerId, slot);
        results.push(created);
      }
      return results;
    },
    onSuccess: (_data, slots) => {
      const count = slots.length;
      toast.success(
        count === 1
          ? "Disponibilidad agregada"
          : `${count} slots de disponibilidad creados`,
      );
      queryClient.invalidateQueries({
        queryKey: ["myAvailability", volunteerId],
      });
      queryClient.invalidateQueries({ queryKey: ["allSlots"] });
    },
    onError: () => {
      toast.error("Error al crear disponibilidad");
    },
  });
}

export function useDeleteSlot(volunteerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slotId: string) =>
      volunteersApi.deleteAvailability(volunteerId, slotId),
    onSuccess: () => {
      toast.success("Disponibilidad eliminada");
      queryClient.invalidateQueries({
        queryKey: ["myAvailability", volunteerId],
      });
      queryClient.invalidateQueries({ queryKey: ["allSlots"] });
    },
    onError: () => {
      toast.error("Error al eliminar disponibilidad");
    },
  });
}
