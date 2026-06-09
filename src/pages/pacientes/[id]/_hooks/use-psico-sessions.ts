import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { availabilityApi, appointmentsApi } from "@/lib/api";
import { toast } from "sonner";
import type { AvailabilitySlot } from "@/types";

// ============================================================
// useAvailableSlots — fetches & filters past slots
// ============================================================

const today = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export function useAvailableSlots(volunteerId: string | undefined) {
  return useQuery<AvailabilitySlot[]>({
    queryKey: ["availabilitySlots", volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];
      const slots = await availabilityApi.list(volunteerId);
      // Filter out past slots on the client side
      return slots.filter((s) => s.date >= today());
    },
    enabled: Boolean(volunteerId),
    staleTime: 15 * 1000,
  });
}

// ============================================================
// useReschedulePsicoSession — mutation to reschedule
// ============================================================

interface RescheduleInput {
  sessionId: string;
  newSlotId: string;
  oldSlotUuid: string;
  volunteerId: string;
}

export function useReschedulePsicoSession(pacienteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      newSlotId,
      oldSlotUuid,
      volunteerId,
    }: RescheduleInput) => {
      // 1. If the new slot is the same as the old one, just update
      //    the session without touching slot states
      const isSameSlot = newSlotId === oldSlotUuid;

      // 2. Fetch the new slot data to extract date/time
      const newSlot = await availabilityApi.getById(volunteerId, newSlotId);

      // 3. Update the session with the new slot's date/time
      await appointmentsApi.update(sessionId, {
        scheduledAt: `${newSlot.date}T${newSlot.startTime}`,
      });

      // 4. If different slot, release old + assign new
      if (!isSameSlot) {
        // Release the old slot
        await availabilityApi.update(volunteerId, oldSlotUuid, {
          status: "AVAILABLE",
        });

        // Assign the new slot
        await availabilityApi.update(volunteerId, newSlotId, {
          status: "RESERVED",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", pacienteId] });
      queryClient.invalidateQueries({ queryKey: ["availabilitySlots"] });
      toast.success("Sesión reprogramada correctamente");
    },
    onError: (err: Error) => {
      toast.error("Error al reprogramar", { description: err.message });
    },
  });
}
